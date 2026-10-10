// Temporary seed list; replaced by the full list derived from data/countries.json
// in the data step.
export const CURRENCY_COOKIE = "fw_currency";
export const DEFAULT_CURRENCY = "USD";

export type CurrencyInfo = { code: string; symbol: string; name: string };

export const currencies: CurrencyInfo[] = [
  { code: "USD", symbol: "$", name: "US dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British pound" },
];

export function isSupportedCurrency(code: string) {
  return currencies.some((c) => c.code === code);
}
