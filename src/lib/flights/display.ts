import { effectiveCurrency, fromUsd } from "@/lib/currency/convert";
import type { DisplayOffer, FlightOffer } from "./types";

/** Adds prices in the visitor's currency (whole units; indicative only). */
export function toDisplayOffer(offer: FlightOffer, currency: string): DisplayOffer {
  const code = effectiveCurrency(currency);
  return {
    ...offer,
    display: {
      currency: code,
      total: fromUsd(offer.price.totalUsd, code),
      perAdult: fromUsd(offer.price.perAdultUsd, code),
    },
  };
}
