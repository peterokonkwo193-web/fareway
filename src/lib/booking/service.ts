import "server-only";
import { addHours, format } from "date-fns";
import { db } from "@/lib/db";
import { customerCare } from "@/lib/env";
import { fareBreakdown } from "@/lib/flights/fare";
import { flightProvider } from "@/lib/flights/provider";
import type { FlightOffer } from "@/lib/flights/types";
import { getMailer } from "@/lib/mail/mailer";
import { bookingRequestEmail } from "@/lib/mail/templates";
import { geo } from "@/lib/geo/data";
import { buildContactLinks } from "./contact-links";
import { generateReference, isValidReference, normalizeReference } from "./reference";
import type { BookingFormValues } from "./schema";
import { EXPIRY_HOURS, isStale, type BookingStatus } from "./status";
import { flightSummaryLine, passengersLine, quoteLine } from "./summary";

export class BookingError extends Error {
  constructor(public code: "offer_unavailable" | "invalid") {
    super(code);
  }
}

/**
 * Saves a booking request. The offer is re-fetched from the provider so the
 * price and itinerary come from the server, never from the browser.
 * No payment is requested or processed.
 */
export async function createBookingRequest(offerId: string, input: BookingFormValues, currency: string) {
  const offer = await flightProvider.getOffer(offerId);
  if (!offer) throw new BookingError("offer_unavailable");

  const fare = fareBreakdown(offer, currency);
  const first = offer.slices[0];
  const last = offer.slices[offer.slices.length - 1];
  const destination = offer.slices.length === 2 && first.from.iata === last.to.iata ? first.to : last.to;
  const dial = geo.getCountry(input.phoneCountry)?.dialCode ?? "";
  const now = new Date();
  const expiresAt = addHours(now, EXPIRY_HOURS);

  let booking = null;
  for (let attempt = 0; attempt < 5 && !booking; attempt++) {
    try {
      booking = await db.bookingRequest.create({
        data: {
          reference: generateReference(now),
          status: "PENDING",
          contactName: input.contactName,
          contactEmail: input.email.toLowerCase(),
          contactPhone: `${dial}${input.phoneNumber.replace(/^0+/, "")}`,
          contactDialCode: dial,
          notes: input.notes || null,
          flightSnapshot: JSON.stringify(offer),
          originCode: first.from.iata,
          destinationCode: destination.iata,
          destCountryCode: destination.countryCode,
          departDate: new Date(`${first.departLocal.slice(0, 10)}T00:00:00Z`),
          quotedPrice: fare.total,
          currency: fare.currency,
          quotedPriceUsd: offer.price.totalUsd,
          expiresAt,
          passengers: {
            create: input.passengers.map((p, position) => ({
              type: p.type,
              firstName: p.firstName,
              lastName: p.lastName,
              dateOfBirth: new Date(`${p.dateOfBirth}T00:00:00Z`),
              nationality: p.nationality,
              position,
            })),
          },
          statusHistory: { create: { from: "NEW", to: "PENDING", changedBy: "customer" } },
        },
      });
    } catch (err) {
      // Unique constraint on reference: retry with a new code.
      if (!(err instanceof Error && /Unique constraint/i.test(err.message))) throw err;
    }
  }
  if (!booking) throw new Error("Could not allocate a booking reference");

  // Confirmation email. A mail failure must not lose the saved request.
  try {
    const care = customerCare();
    const summary = flightSummaryLine(offer);
    await getMailer().send(
      bookingRequestEmail({
        to: booking.contactEmail,
        name: booking.contactName,
        reference: booking.reference,
        flight: summary,
        passengers: passengersLine(offer.passengers),
        price: quoteLine(fare.total, fare.currency),
        expiresAt: `${format(expiresAt, "EEE d MMM yyyy, HH:mm")} UTC`,
        care,
        links: buildContactLinks(care, booking.reference, summary),
      }),
    );
  } catch (err) {
    console.error(`[booking] confirmation email failed for ${booking.reference}:`, err instanceof Error ? err.message : "unknown");
  }

  return booking;
}

/** Marks a stale Pending request as Expired (lazy expiry on read). */
async function expireIfStale<T extends { id: string; status: string; expiresAt: Date }>(booking: T): Promise<T> {
  if (!isStale(booking.status, booking.expiresAt)) return booking;
  await db.bookingRequest.update({
    where: { id: booking.id },
    data: { status: "EXPIRED", statusHistory: { create: { from: "PENDING", to: "EXPIRED", changedBy: "system" } } },
  });
  return { ...booking, status: "EXPIRED" };
}

export async function getBooking(reference: string) {
  const ref = normalizeReference(reference);
  if (!isValidReference(ref)) return null;
  const booking = await db.bookingRequest.findUnique({
    where: { reference: ref },
    include: { passengers: { orderBy: { position: "asc" } } },
  });
  return booking ? expireIfStale(booking) : null;
}

/** Lookup by reference + email. Returns null for any mismatch (no hint which part was wrong). */
export async function lookupBooking(reference: string, email: string) {
  const booking = await getBooking(reference);
  if (!booking || booking.contactEmail !== email.trim().toLowerCase()) return null;
  return booking;
}

/** Expires every stale Pending request. Used by the cron route. */
export async function expireStaleBookings(now = new Date()) {
  const stale = await db.bookingRequest.findMany({ where: { status: "PENDING", expiresAt: { lte: now } }, select: { id: true } });
  for (const { id } of stale) {
    await db.bookingRequest.update({
      where: { id },
      data: { status: "EXPIRED", statusHistory: { create: { from: "PENDING", to: "EXPIRED", changedBy: "system" } } },
    });
  }
  return stale.length;
}

export function parseSnapshot(json: string): FlightOffer {
  return JSON.parse(json) as FlightOffer;
}

export function displayQuote(booking: { quotedPrice: number; currency: string }) {
  return quoteLine(booking.quotedPrice, booking.currency);
}

export type { BookingStatus };
