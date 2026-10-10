import type { Airport, Country, MetroCode, Place } from "./types";

/**
 * Pure geo index (no I/O) so it can be unit-tested with the JSON datasets.
 * The server instance lives in ./data.ts.
 */

export type PlaceGroup = "anywhere" | "country" | "city" | "airport";
export type PlaceSuggestion = Place & { group: PlaceGroup; score: number };

type Entry = {
  place: Place;
  group: PlaceGroup;
  /** Normalised strings: [primaryName, ...otherNames] */
  names: string[];
  /** Exact codes (upper-case) */
  codes: string[];
  /** Normalised country name, used to surface airports when a country is typed. */
  countryName: string;
  boost: number;
};

const sizeRank = { L: 0, M: 1, S: 2 } as const;

/** Lower-case, strip accents and punctuation: "São Paulo–Guarulhos" -> "sao paulo guarulhos". */
export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slug(input: string) {
  return normalize(input).replace(/ /g, "-");
}

/** Levenshtein distance with an early exit once `max` is exceeded. */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

const GATEWAY_OVERRIDES: Record<string, string[]> = {
  US: ["JFK", "LAX", "ORD", "MIA", "ATL", "SFO"],
  CA: ["YYZ", "YVR", "YUL"],
  AU: ["SYD", "MEL", "BNE"],
  CN: ["PEK", "PVG", "CAN"],
  IN: ["DEL", "BOM", "BLR"],
  BR: ["GRU", "GIG"],
  TR: ["IST", "SAW", "AYT"],
  CH: ["ZRH", "GVA"],
  DE: ["FRA", "MUC", "BER"],
  NZ: ["AKL", "CHC"],
  VN: ["SGN", "HAN"],
  ZA: ["JNB", "CPT"],
  NG: ["LOS", "ABV"],
  MA: ["CMN", "RAK"],
  AE: ["DXB", "AUH"],
  SA: ["JED", "RUH"],
  PK: ["KHI", "LHE", "ISB"],
  KZ: ["ALA", "NQZ"],
  IT: ["FCO", "MXP"],
  ES: ["MAD", "BCN"],
  JP: ["HND", "NRT", "KIX"],
  GB: ["LHR", "LGW", "MAN"],
  FR: ["CDG", "ORY", "NCE"],
  RU: ["SVO", "LED"],
  KR: ["ICN"],
  TZ: ["DAR", "JRO", "ZNZ"],
  EC: ["UIO", "GYE"],
  BO: ["VVI", "LPB"],
  CM: ["DLA", "NSI"],
  PH: ["MNL", "CEB"],
  ID: ["CGK", "DPS"],
  IL: ["TLV"],
  PT: ["LIS", "OPO"],
  GR: ["ATH"],
  EG: ["CAI"],
  MX: ["MEX", "CUN"],
};

export const ANYWHERE: Place = {
  id: "anywhere",
  kind: "anywhere",
  name: "Everywhere",
  code: "ANY",
  detail: "Find the cheapest destinations",
  airports: [],
};

export function createGeoIndex(data: { countries: Country[]; airports: Airport[]; metros: MetroCode[] }) {
  const countryByIso2 = new Map(data.countries.map((c) => [c.iso2, c]));
  const airportByIata = new Map(data.airports.map((a) => [a.iata, a]));
  const metroByCode = new Map(data.metros.map((m) => [m.code, m]));
  const airportsByCountry = new Map<string, Airport[]>();
  for (const a of data.airports) {
    const list = airportsByCountry.get(a.countryCode) ?? [];
    list.push(a);
    airportsByCountry.set(a.countryCode, list);
  }

  function gatewayAirports(iso2: string, limit = 3): string[] {
    const country = countryByIso2.get(iso2);
    if (!country) return [];
    const own = airportsByCountry.get(iso2) ?? [];
    if (own.length === 0) return (country.nearestAirports ?? []).slice(0, limit);
    const override = (GATEWAY_OVERRIDES[iso2] ?? []).filter((code) => airportByIata.get(code)?.countryCode === iso2);
    const capital = country.capital ? normalize(country.capital) : "";
    const ranked = [...own].sort((a, b) => {
      const capA = normalize(a.city) === capital ? 0 : 1;
      const capB = normalize(b.city) === capital ? 0 : 1;
      return sizeRank[a.size] - sizeRank[b.size] || capA - capB || a.iata.localeCompare(b.iata);
    });
    return [...override, ...ranked.map((a) => a.iata).filter((c) => !override.includes(c))].slice(0, limit);
  }

  function countryPlace(c: Country): Place {
    return {
      id: `country:${c.iso2}`,
      kind: "country",
      name: c.name,
      code: c.iso2,
      detail: c.airportCount > 0 ? c.continent : `${c.continent} · via nearby airports`,
      countryCode: c.iso2,
      flag: c.flag,
      airports: gatewayAirports(c.iso2),
    };
  }

  function airportPlace(a: Airport): Place {
    const c = countryByIso2.get(a.countryCode);
    return {
      id: a.iata,
      kind: "airport",
      name: a.name,
      code: a.iata,
      detail: `${a.city}, ${c?.name ?? a.countryCode}`,
      countryCode: a.countryCode,
      city: a.city,
      flag: c?.flag,
      airports: [a.iata],
    };
  }

  // Cities: curated metro codes plus any city served by 2+ airports in the dataset.
  const cityPlaces: Place[] = [];
  const cityById = new Map<string, Place>();
  const coveredCities = new Set<string>();
  for (const m of data.metros) {
    const valid = m.airports.filter((code) => airportByIata.has(code));
    if (valid.length === 0) continue;
    const c = countryByIso2.get(m.countryCode);
    const place: Place = {
      id: `city:${m.code}`,
      kind: "city",
      name: m.city,
      code: m.code,
      detail: `${valid.length > 1 ? "All airports" : valid[0]} · ${c?.name ?? m.countryCode}`,
      countryCode: m.countryCode,
      flag: c?.flag,
      airports: valid,
    };
    cityPlaces.push(place);
    cityById.set(place.id, place);
    coveredCities.add(`${m.countryCode}|${normalize(m.city)}`);
  }
  const grouped = new Map<string, Airport[]>();
  for (const a of data.airports) {
    const key = `${a.countryCode}|${normalize(a.city)}`;
    if (coveredCities.has(key)) continue;
    grouped.set(key, [...(grouped.get(key) ?? []), a]);
  }
  for (const [key, list] of grouped) {
    if (list.length < 2) continue;
    const [countryCode] = key.split("|");
    const c = countryByIso2.get(countryCode);
    const sorted = [...list].sort((a, b) => sizeRank[a.size] - sizeRank[b.size]);
    const place: Place = {
      id: `city:${countryCode}-${slug(list[0].city)}`,
      kind: "city",
      name: list[0].city,
      code: sorted[0].iata,
      detail: `All airports · ${c?.name ?? countryCode}`,
      countryCode,
      flag: c?.flag,
      airports: sorted.map((a) => a.iata),
    };
    cityPlaces.push(place);
    cityById.set(place.id, place);
  }

  // Search entries
  const entries: Entry[] = [];
  for (const c of data.countries) {
    entries.push({
      place: countryPlace(c),
      group: "country",
      names: [normalize(c.name), normalize(c.officialName)],
      codes: [c.iso3],
      countryName: normalize(c.name),
      boost: 60,
    });
  }
  for (const p of cityPlaces) {
    entries.push({
      place: p,
      group: "city",
      names: [normalize(p.name)],
      codes: p.code.length === 3 && p.id.startsWith("city:") && !p.id.includes("-") ? [p.code] : [],
      countryName: normalize(countryByIso2.get(p.countryCode!)?.name ?? ""),
      boost: 45,
    });
  }
  for (const a of data.airports) {
    entries.push({
      place: airportPlace(a),
      group: "airport",
      names: [normalize(a.city), normalize(a.name)],
      codes: [a.iata],
      countryName: normalize(countryByIso2.get(a.countryCode)?.name ?? ""),
      boost: a.size === "L" ? 40 : a.size === "M" ? 10 : 0,
    });
  }

  // Words per entry, precomputed for the fuzzy pass.
  const entryWords = entries.map((e) => [...new Set(e.names.flatMap((n) => n.split(" ")))]);
  // Gateway airports get a bonus when the user types their country's name.
  const gatewaySet = new Set(data.countries.flatMap((c) => gatewayAirports(c.iso2, 4)));

  /** Strict pass: codes, exact names, prefixes and word prefixes. */
  function strictScore(q: string, qUpper: string, e: Entry): number {
    let best = 0;
    if (qUpper.length === 3 && e.codes.includes(qUpper)) best = 1000;
    for (let i = 0; i < e.names.length; i++) {
      const name = e.names[i];
      const primaryBonus = i === 0 ? 40 : 0;
      if (name === q) best = Math.max(best, 700 + primaryBonus);
      else if (name.startsWith(q)) best = Math.max(best, 500 + primaryBonus - Math.min(60, name.length - q.length));
      else if (q.length >= 2 && name.includes(` ${q}`)) best = Math.max(best, 320 + primaryBonus);
    }
    if (best === 0 && e.group === "airport" && q.length >= 3 && e.countryName.startsWith(q)) {
      best = 200 + (gatewaySet.has(e.place.code) ? 100 : 0);
    }
    return best ? best + e.boost : 0;
  }

  /** Typo-tolerant pass, only used when the strict pass finds little. */
  function fuzzyScore(q: string, words: string[], e: Entry): number {
    const max = q.length >= 8 ? 2 : 1;
    for (const word of words) {
      if (word.length < 3) continue;
      const target = word.length > q.length ? word.slice(0, q.length) : word;
      if (editDistance(q, target, max) <= max) return 120 + e.boost + (gatewaySet.has(e.place.code) ? 30 : 0);
    }
    return 0;
  }

  const GROUP_LIMITS: Record<Exclude<PlaceGroup, "anywhere">, number> = { country: 3, city: 4, airport: 6 };

  /** Grouped fuzzy search. Order: Everywhere, Countries, Cities, Airports. */
  function searchPlaces(query: string, opts: { allowEverywhere?: boolean } = {}): PlaceSuggestion[] {
    const q = normalize(query);
    const out: PlaceSuggestion[] = [];
    const wantsAnywhere = opts.allowEverywhere && (!q || "everywhere".startsWith(q) || "anywhere".startsWith(q));
    if (wantsAnywhere) out.push({ ...ANYWHERE, group: "anywhere", score: 2000 });
    if (!q) return out;

    const qUpper = q.toUpperCase().replace(/ /g, "");
    const buckets: Record<"country" | "city" | "airport", PlaceSuggestion[]> = { country: [], city: [], airport: [] };
    const matched = new Set<number>();
    entries.forEach((e, i) => {
      const score = strictScore(q, qUpper, e);
      if (score > 0) {
        matched.add(i);
        buckets[e.group as "country" | "city" | "airport"].push({ ...e.place, group: e.group, score });
      }
    });
    if (matched.size === 0 && !wantsAnywhere && q.length >= 4) {
      entries.forEach((e, i) => {
        if (matched.has(i)) return;
        const score = fuzzyScore(q, entryWords[i], e);
        if (score > 0) buckets[e.group as "country" | "city" | "airport"].push({ ...e.place, group: e.group, score });
      });
    }
    for (const group of ["country", "city", "airport"] as const) {
      buckets[group].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
      out.push(...buckets[group].slice(0, GROUP_LIMITS[group]));
    }
    return out;
  }

  function resolvePlace(id: string | null | undefined): Place | undefined {
    if (!id) return undefined;
    if (id === "anywhere") return ANYWHERE;
    if (/^[A-Z]{3}$/.test(id)) {
      const a = airportByIata.get(id);
      return a ? airportPlace(a) : undefined;
    }
    if (id.startsWith("country:")) {
      const c = countryByIso2.get(id.slice(8));
      return c ? countryPlace(c) : undefined;
    }
    if (id.startsWith("city:")) return cityById.get(id);
    return undefined;
  }

  return {
    countries: data.countries,
    airports: data.airports,
    cities: cityPlaces,
    getCountry: (iso2: string) => countryByIso2.get(iso2.toUpperCase()),
    getAirport: (iata: string) => airportByIata.get(iata.toUpperCase()),
    getMetro: (code: string) => metroByCode.get(code.toUpperCase()),
    airportsInCountry: (iso2: string) => airportsByCountry.get(iso2.toUpperCase()) ?? [],
    gatewayAirports,
    searchPlaces,
    resolvePlace,
  };
}

export type GeoIndex = ReturnType<typeof createGeoIndex>;
