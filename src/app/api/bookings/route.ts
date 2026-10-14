import { NextResponse } from "next/server";
import { z } from "zod";
import { grantBookingAccess } from "@/lib/booking/access";
import { buildBookingSchema } from "@/lib/booking/schema";
import { BookingError, createBookingRequest } from "@/lib/booking/service";
import { flightProvider } from "@/lib/flights/provider";
import { getCurrency } from "@/lib/preferences";
import { guardFormRequest } from "@/lib/security/guard";
import { HONEYPOT_FIELD, isHoneypotFilled } from "@/lib/security/honeypot";

const envelope = z.object({ offerId: z.string().min(4).max(2000), form: z.record(z.string(), z.unknown()) });

/**
 * POST /api/bookings: save a booking request (no payment).
 * Validates on the server with the same Zod schema as the form.
 */
export async function POST(req: Request) {
  const blocked = await guardFormRequest(req, "bookings", 5, 10 * 60 * 1000);
  if (blocked) return blocked;

  const body = envelope.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  // Bots fill the hidden field: pretend success, store nothing.
  if (isHoneypotFilled(body.data.form[HONEYPOT_FIELD])) {
    return NextResponse.json({ reference: null }, { status: 202 });
  }

  const offer = await flightProvider.getOffer(body.data.offerId);
  if (!offer) return NextResponse.json({ error: "offer_unavailable" }, { status: 410 });

  const schema = buildBookingSchema({ travelDate: offer.slices[0].departLocal.slice(0, 10), passengers: offer.passengers });
  const parsed = schema.safeParse(body.data.form);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[issue.path.join(".")] ??= issue.message;
    return NextResponse.json({ error: "invalid", fields }, { status: 422 });
  }

  try {
    const booking = await createBookingRequest(body.data.offerId, parsed.data, await getCurrency());
    await grantBookingAccess(booking.reference);
    return NextResponse.json({ reference: booking.reference }, { status: 201 });
  } catch (err) {
    if (err instanceof BookingError) return NextResponse.json({ error: err.code }, { status: 410 });
    // Log the error type only: request bodies contain personal data.
    console.error("[bookings] create failed:", err instanceof Error ? err.name : "unknown");
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
