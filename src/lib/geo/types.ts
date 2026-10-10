export type Continent = "Africa" | "Antarctica" | "Asia" | "Europe" | "North America" | "Oceania" | "South America";

export const CONTINENTS: Continent[] = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Oceania",
  "Antarctica",
];

export type Country = {
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

export type Airport = {
  iata: string;
  name: string;
  city: string;
  countryCode: string;
  lat: number;
  lng: number;
  size: "L" | "M" | "S";
};

export type MetroCode = { code: string; city: string; countryCode: string; airports: string[] };

/**
 * Place ids used in URLs and the search store:
 *   "LHR"              airport (IATA)
 *   "city:LON"         metro city with several airports
 *   "country:GB"       a whole country
 *   "anywhere"         "Everywhere" destination
 */
export type PlaceKind = "airport" | "city" | "country" | "anywhere";

export type Place = {
  id: string;
  kind: PlaceKind;
  /** Display name, e.g. "London Heathrow", "London (any airport)", "Japan", "Everywhere". */
  name: string;
  /** Short code shown in chips: IATA, metro code or ISO2. */
  code: string;
  /** Secondary line, e.g. "London, United Kingdom". */
  detail: string;
  countryCode?: string;
  /** City name for airports (used for compact labels like "London (LHR)"). */
  city?: string;
  flag?: string;
  /** Airports this place resolves to when searching flights (best first). */
  airports: string[];
};
