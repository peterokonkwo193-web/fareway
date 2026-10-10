/**
 * Builds data/countries.json and data/airports.json.
 *
 *   npm run data:geo            # uses the cached OurAirports CSV if present
 *   npm run data:geo -- --fresh # re-downloads the CSV
 *
 * Sources
 *  - Countries: `world-countries` npm package (mledoze/countries, ODbL-1.0).
 *  - Airports:  OurAirports open data (public domain),
 *               https://davidmegginson.github.io/ourairports-data/airports.csv
 *
 * Selection rules for airports (kept small enough to load in memory on the server):
 *  1. Must have an IATA code and scheduled passenger service.
 *  2. Every `large_airport` and `medium_airport` is kept.
 *  3. If a country still has none, its `small_airport`s with scheduled service are kept.
 *  4. Countries/territories with no qualifying airport get `nearestAirports`
 *     (the closest airports by great-circle distance) so they remain searchable.
 */
import fs from "node:fs";
import path from "node:path";
import worldCountries from "world-countries";

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const CACHE_DIR = path.join(ROOT, "scripts", ".cache");
const CSV_URL = "https://davidmegginson.github.io/ourairports-data/airports.csv";
const CSV_PATH = path.join(CACHE_DIR, "airports.csv");

type Continent = "Africa" | "Antarctica" | "Asia" | "Europe" | "North America" | "Oceania" | "South America";

export type CountryRecord = {
  name: string;
  officialName: string;
  iso2: string;
  iso3: string;
  continent: Continent;
  subregion: string;
  capital: string | null;
  currency: { code: string; name: string; symbol: string } | null;
  dialCode: string | null;
  flag: string;
  status: "un-member" | "un-observer" | "partially-recognised" | "territory";
  lat: number;
  lng: number;
  airportCount: number;
  nearestAirports?: string[];
};

export type AirportRecord = {
  iata: string;
  name: string;
  city: string;
  countryCode: string;
  lat: number;
  lng: number;
  size: "L" | "M" | "S";
};

const UN_OBSERVERS = new Set(["VA", "PS"]);
const PARTIALLY_RECOGNISED = new Set(["XK", "TW", "EH"]);
const DIAL_OVERRIDES: Record<string, string> = { VA: "+39", XK: "+383" };

function continentOf(region: string, subregion: string): Continent {
  if (region === "Americas") return subregion === "South America" ? "South America" : "North America";
  if (region === "Antarctic") return "Antarctica";
  return region as Continent;
}

function dialCodeOf(iso2: string, idd: { root?: string; suffixes?: string[] }): string | null {
  if (DIAL_OVERRIDES[iso2]) return DIAL_OVERRIDES[iso2];
  if (!idd.root) return null;
  const suffixes = idd.suffixes ?? [];
  if (suffixes.length === 1) return `${idd.root}${suffixes[0]}`;
  return idd.root;
}

/** Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, CRLF). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Tidies OurAirports names, e.g. "Heathrow Airport" stays, "Lic. Benito Juarez Intl" untouched. */
function cleanName(name: string) {
  return name.replace(/\s+/g, " ").trim();
}

async function loadCsv(fresh: boolean): Promise<string> {
  if (!fresh && fs.existsSync(CSV_PATH)) return fs.readFileSync(CSV_PATH, "utf8");
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      console.log(`Downloading ${CSV_URL} (attempt ${attempt})…`);
      const res = await fetch(CSV_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      fs.writeFileSync(CSV_PATH, text);
      return text;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

async function main() {
  const fresh = process.argv.includes("--fresh");

  // ---- Countries -----------------------------------------------------------
  const countries: CountryRecord[] = worldCountries
    .map((c) => {
      const [currencyCode, currencyInfo] = Object.entries(c.currencies ?? {})[0] ?? [];
      const status: CountryRecord["status"] = UN_OBSERVERS.has(c.cca2)
        ? "un-observer"
        : PARTIALLY_RECOGNISED.has(c.cca2)
          ? "partially-recognised"
          : c.unMember
            ? "un-member"
            : "territory";
      return {
        name: c.name.common,
        officialName: c.name.official,
        iso2: c.cca2,
        iso3: c.cca3,
        continent: continentOf(c.region, c.subregion),
        subregion: c.subregion || c.region,
        capital: c.capital?.[0] ?? null,
        currency: currencyCode
          ? { code: currencyCode, name: currencyInfo!.name, symbol: currencyInfo!.symbol ?? currencyCode }
          : null,
        dialCode: dialCodeOf(c.cca2, c.idd ?? {}),
        flag: c.flag,
        status,
        lat: c.latlng[0],
        lng: c.latlng[1],
        airportCount: 0,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "en"));

  const countryCodes = new Set(countries.map((c) => c.iso2));

  // ---- Airports ------------------------------------------------------------
  const rows = parseCsv(await loadCsv(fresh));
  const header = rows[0];
  const col = (name: string) => {
    const i = header.indexOf(name);
    if (i < 0) throw new Error(`Column ${name} missing from airports.csv`);
    return i;
  };
  const C = {
    type: col("type"),
    name: col("name"),
    lat: col("latitude_deg"),
    lng: col("longitude_deg"),
    country: col("iso_country"),
    city: col("municipality"),
    scheduled: col("scheduled_service"),
    iata: col("iata_code"),
  };

  const sizeOf: Record<string, AirportRecord["size"]> = { large_airport: "L", medium_airport: "M", small_airport: "S" };
  const candidates: AirportRecord[] = [];
  for (const r of rows.slice(1)) {
    const iata = r[C.iata]?.trim();
    const size = sizeOf[r[C.type]];
    if (!iata || !/^[A-Z]{3}$/.test(iata) || !size || r[C.scheduled] !== "yes") continue;
    const countryCode = r[C.country] === "NA" || r[C.country] === "" ? "NA" : r[C.country];
    if (!countryCodes.has(countryCode)) continue;
    candidates.push({
      iata,
      name: cleanName(r[C.name]),
      // "Nice, Alpes-Maritimes" -> "Nice"
      city: cleanName((r[C.city] || r[C.name]).split(",")[0]),
      countryCode,
      lat: Math.round(Number(r[C.lat]) * 10000) / 10000,
      lng: Math.round(Number(r[C.lng]) * 10000) / 10000,
      size,
    });
  }

  // De-duplicate IATA codes (keep the larger airport).
  const rank = { L: 0, M: 1, S: 2 } as const;
  const byIata = new Map<string, AirportRecord>();
  for (const a of candidates) {
    const existing = byIata.get(a.iata);
    if (!existing || rank[a.size] < rank[existing.size]) byIata.set(a.iata, a);
  }
  const unique = [...byIata.values()];

  const hasMajor = new Set(unique.filter((a) => a.size !== "S").map((a) => a.countryCode));
  const airports = unique
    .filter((a) => a.size !== "S" || !hasMajor.has(a.countryCode))
    .sort((a, b) => a.countryCode.localeCompare(b.countryCode) || rank[a.size] - rank[b.size] || a.iata.localeCompare(b.iata));

  // ---- Link countries to airports -----------------------------------------
  const perCountry = new Map<string, number>();
  for (const a of airports) perCountry.set(a.countryCode, (perCountry.get(a.countryCode) ?? 0) + 1);

  const majorAirports = airports.filter((a) => a.size !== "S");
  const withoutAirports: string[] = [];
  for (const c of countries) {
    c.airportCount = perCountry.get(c.iso2) ?? 0;
    if (c.airportCount === 0) {
      withoutAirports.push(c.iso2);
      c.nearestAirports = majorAirports
        .map((a) => ({ iata: a.iata, d: haversineKm(c.lat, c.lng, a.lat, a.lng) }))
        .sort((x, y) => x.d - y.d)
        .slice(0, 2)
        .map((x) => x.iata);
    }
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, "countries.json"), JSON.stringify(countries, null, 1) + "\n");
  fs.writeFileSync(path.join(DATA_DIR, "airports.json"), JSON.stringify(airports) + "\n");

  const unMembers = countries.filter((c) => c.status === "un-member").length;
  console.log(`countries.json: ${countries.length} entries (${unMembers} UN members, observers: VA, PS)`);
  console.log(
    `airports.json:  ${airports.length} airports (L=${airports.filter((a) => a.size === "L").length}, M=${airports.filter((a) => a.size === "M").length}, S=${airports.filter((a) => a.size === "S").length})`,
  );
  console.log(
    `No own airport (mapped to nearest): ${withoutAirports
      .map((code) => `${code}→${countries.find((c) => c.iso2 === code)!.nearestAirports!.join("/")}`)
      .join(", ")}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
