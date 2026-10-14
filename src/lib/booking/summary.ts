import { format, parseISO } from "date-fns";
import { formatMoney } from "@/lib/currency/format";
import type { FlightOffer } from "@/lib/flights/types";

/** One-line flight summary used in WhatsApp/email messages, e.g. "LHR → JFK, Sat 12 Dec · JFK → LHR, Sat 19 Dec". */
export function flightSummaryLine(offer: FlightOffer): string {
  return offer.slices
    .map((s) => `${s.from.city} (${s.from.iata}) → ${s.to.city} (${s.to.iata}), ${format(parseISO(s.departLocal), "EEE d MMM yyyy HH:mm")}`)
    .join(" · ");
}

export function passengersLine(p: FlightOffer["passengers"]): string {
  const parts = [`${p.adults} adult${p.adults === 1 ? "" : "s"}`];
  if (p.children) parts.push(`${p.children} child${p.children === 1 ? "" : "ren"}`);
  if (p.infants) parts.push(`${p.infants} infant${p.infants === 1 ? "" : "s"}`);
  return parts.join(", ");
}

export function quoteLine(amount: number, currency: string) {
  return formatMoney(amount, currency, "en");
}
