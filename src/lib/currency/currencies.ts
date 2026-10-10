import "server-only";
import { geo } from "@/lib/geo/data";
import { hasRate } from "./convert";
import { DEFAULT_CURRENCY, type CurrencyInfo } from "./constants";

/** Every currency used by a country in data/countries.json, USD/EUR/GBP first. */
export const currencies: CurrencyInfo[] = (() => {
  const map = new Map<string, CurrencyInfo>();
  for (const c of geo.countries) {
    if (c.currency && !map.has(c.currency.code)) {
      map.set(c.currency.code, { ...c.currency, hasRate: hasRate(c.currency.code) });
    }
  }
  const pinned = ["USD", "EUR", "GBP"];
  return [...map.values()].sort((a, b) => {
    const pa = pinned.indexOf(a.code);
    const pb = pinned.indexOf(b.code);
    if (pa !== -1 || pb !== -1) return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
    return a.code.localeCompare(b.code);
  });
})();

const codes = new Set(currencies.map((c) => c.code));

export function isSupportedCurrency(code: string) {
  return codes.has(code) || code === DEFAULT_CURRENCY;
}
