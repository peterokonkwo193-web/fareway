import fx from "../../../data/fx-rates.json";
import { DEFAULT_CURRENCY } from "./constants";

const rates = fx.rates as Record<string, number>;

export const fxUpdated = fx.updated;

export function hasRate(code: string) {
  return code in rates;
}

/** The currency prices will actually be shown in (falls back to USD when no rate is known). */
export function effectiveCurrency(code: string) {
  return hasRate(code) ? code : DEFAULT_CURRENCY;
}

/** Converts a USD amount to `code`, rounded to whole units (prices are indicative). */
export function fromUsd(amountUsd: number, code: string): number {
  const rate = rates[effectiveCurrency(code)] ?? 1;
  return Math.round(amountUsd * rate);
}

export function toUsd(amount: number, code: string): number {
  const rate = rates[effectiveCurrency(code)] ?? 1;
  return amount / rate;
}
