import { effectiveCurrency, fromUsd } from "@/lib/currency/convert";
import type { FlightOffer } from "./types";

export type FareLine = { kind: "adult" | "child" | "infant"; count: number; unit: number; amount: number };

export type FareBreakdown = {
  currency: string;
  lines: FareLine[];
  base: number;
  taxes: number;
  total: number;
};

/** Children pay 75% and lap infants 10% of the adult fare (mock pricing rule, mirrored by MockProvider). */
const SHARE = { adult: 1, child: 0.75, infant: 0.1 } as const;

/** Per-passenger-type price lines in the display currency. `total` always equals the quoted total. */
export function fareBreakdown(offer: FlightOffer, currency: string): FareBreakdown {
  const code = effectiveCurrency(currency);
  const counts = { adult: offer.passengers.adults, child: offer.passengers.children, infant: offer.passengers.infants };
  const lines: FareLine[] = (["adult", "child", "infant"] as const)
    .filter((kind) => counts[kind] > 0)
    .map((kind) => {
      const unit = fromUsd(offer.price.perAdultUsd * SHARE[kind], code);
      return { kind, count: counts[kind], unit, amount: unit * counts[kind] };
    });
  const total = fromUsd(offer.price.totalUsd, code);
  const share = offer.price.taxesUsd / Math.max(1, offer.price.perAdultUsd);
  const taxes = Math.round(total * share);
  return { currency: code, lines, base: total - taxes, taxes, total };
}
