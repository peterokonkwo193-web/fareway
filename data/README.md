# Fareway reference data

| File | What | Source | Refresh |
|---|---|---|---|
| `countries.json` | 250 countries and territories: all 193 UN members, the two UN observer states (Vatican City, Palestine), partially recognised states (Kosovo, Taiwan, Western Sahara) and ISO 3166-1 territories. Name, ISO alpha-2/alpha-3, continent, capital, primary currency (code, name, symbol), international dialling code, flag emoji, airport count and, for places without an airport, the nearest airports. | [`world-countries`](https://github.com/mledoze/countries) (ODbL-1.0) | `npm run data:geo` |
| `airports.json` | ~3,200 commercial airports (IATA code, name, city, country code, latitude, longitude, size). All large and medium airports with an IATA code and scheduled passenger service; small airports are added only for countries that would otherwise have none. | [OurAirports](https://ourairports.com/data/) (public domain) | `npm run data:geo -- --fresh` |
| `metro-codes.json` | Multi-airport city codes (LON, NYC, PAR, TYO…). | Curated | Edit by hand |
| `airlines.json` | Carrier names, home country and hubs, used by the mock flight provider. Names are shown as text only (no logos). | Curated | Edit by hand |
| `fx-rates.json` | Indicative exchange rates, base USD. | [open.er-api.com](https://www.exchangerate-api.com/docs/free) | `npm run data:fx` |

## Refreshing airports from OurAirports

```bash
npm run data:geo -- --fresh   # downloads airports.csv, rebuilds countries.json + airports.json
npm run data:fx               # optional: refresh exchange rates
```

The script (`scripts/build-geo-data.ts`) caches the CSV in `scripts/.cache/` (git-ignored). It prints the
number of airports and the list of countries that have no airport of their own along with the
airports they were mapped to (for example Monaco → NCE, Vatican City → CIA/FCO). Countries with no
scheduled service listed in OurAirports (for example Ukraine while its airspace is closed) are mapped
to the nearest airports abroad in the same way.

These files are only imported on the server (`src/lib/geo/data.ts` is `server-only`), so their size does
not affect the browser bundle.
