/**
 * Refreshes data/fx-rates.json (indicative exchange rates, base USD).
 *
 *   npm run data:fx
 *
 * Source: https://open.er-api.com (free, no API key, daily updates).
 * Only currencies used by a country in data/countries.json are kept.
 * Rates are for display only: customer care confirms the final price.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const URL = "https://open.er-api.com/v6/latest/USD";

async function main() {
  const countries: { currency: { code: string } | null }[] = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "countries.json"), "utf8"),
  );
  const wanted = new Set(countries.flatMap((c) => (c.currency ? [c.currency.code] : [])));
  wanted.add("USD");

  let body: { result: string; time_last_update_utc: string; rates: Record<string, number> } | undefined;
  for (let attempt = 1; attempt <= 4 && !body; attempt++) {
    try {
      const res = await fetch(URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      body = await res.json();
    } catch (err) {
      if (attempt === 4) throw err;
    }
  }
  if (!body || body.result !== "success") throw new Error("Rate API returned an error");

  const rates: Record<string, number> = {};
  const missing: string[] = [];
  for (const code of [...wanted].sort()) {
    if (body.rates[code]) rates[code] = body.rates[code];
    else missing.push(code);
  }

  const out = { base: "USD", updated: new Date(body.time_last_update_utc).toISOString(), source: "open.er-api.com", rates };
  fs.writeFileSync(path.join(ROOT, "data", "fx-rates.json"), JSON.stringify(out, null, 1) + "\n");
  console.log(`fx-rates.json: ${Object.keys(rates).length} currencies. No rate (shown in USD): ${missing.join(", ") || "none"}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
