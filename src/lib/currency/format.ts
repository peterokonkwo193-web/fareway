const cache = new Map<string, Intl.NumberFormat>();

/** Formats a whole-unit price, e.g. formatMoney(389, "GBP") -> "£389". */
export function formatMoney(amount: number, currency: string, locale = "en"): string {
  const key = `${locale}|${currency}`;
  let fmt = cache.get(key);
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0, minimumFractionDigits: 0 });
    } catch {
      fmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
      cache.set(key, fmt);
      return `${currency} ${fmt.format(amount)}`;
    }
    cache.set(key, fmt);
  }
  return fmt.format(amount);
}
