import type { DisplayOffer } from "./types";
import { minuteOfDay } from "./time";

/** Filters for the results page. Every field maps to a URL parameter. */
export const TIME_WINDOWS = ["early", "morning", "afternoon", "evening"] as const;
export type TimeWindow = (typeof TIME_WINDOWS)[number];
export const BAG_OPTIONS = ["cabin", "checked"] as const;
export type BagOption = (typeof BAG_OPTIONS)[number];
/** 0 = direct, 1 = one stop, 2 = two or more stops */
export type StopsOption = 0 | 1 | 2;

export type FlightFilters = {
  stops: StopsOption[];
  /** Max total price in display currency */
  maxPrice?: number;
  depTimes: TimeWindow[];
  /** Carrier codes; empty = all */
  airlines: string[];
  /** Max duration per journey (longest slice), hours */
  maxDurationH?: number;
  /** Required included bags */
  bags: BagOption[];
};

export const emptyFilters: FlightFilters = { stops: [], depTimes: [], airlines: [], bags: [] };

export const timeWindowRanges: Record<TimeWindow, [number, number]> = {
  early: [0, 8 * 60],
  morning: [8 * 60, 12 * 60],
  afternoon: [12 * 60, 18 * 60],
  evening: [18 * 60, 24 * 60],
};

export function timeWindowOf(localDateTime: string): TimeWindow {
  const m = minuteOfDay(localDateTime);
  return TIME_WINDOWS.find((w) => m >= timeWindowRanges[w][0] && m < timeWindowRanges[w][1]) ?? "evening";
}

const stopsBucket = (stops: number): StopsOption => (stops >= 2 ? 2 : (stops as StopsOption));

export function matchesFilters(offer: DisplayOffer, f: FlightFilters): boolean {
  if (f.stops.length && !f.stops.includes(stopsBucket(offer.maxStops))) return false;
  if (f.maxPrice !== undefined && offer.display.total > f.maxPrice) return false;
  if (f.depTimes.length && !f.depTimes.includes(timeWindowOf(offer.slices[0].departLocal))) return false;
  // An offer matches when every airline on it is selected (mixed-carrier itineraries need all selected).
  if (f.airlines.length && !offer.carriers.every((c) => f.airlines.includes(c.code))) return false;
  if (f.maxDurationH !== undefined && Math.max(...offer.slices.map((s) => s.durationMin)) > f.maxDurationH * 60) return false;
  if (f.bags.includes("cabin") && offer.baggage.cabinBagKg === null) return false;
  if (f.bags.includes("checked") && offer.baggage.checkedBags < 1) return false;
  return true;
}

export function applyFilters(offers: DisplayOffer[], f: FlightFilters): DisplayOffer[] {
  return offers.filter((o) => matchesFilters(o, f));
}

export type FilterFacets = {
  stops: { value: StopsOption; minPrice: number; count: number }[];
  airlines: { code: string; name: string; minPrice: number; count: number }[];
  price: { min: number; max: number };
  durationH: { min: number; max: number };
  depTimes: { value: TimeWindow; count: number }[];
};

/** Options and "from" prices for the filter panel, computed on the unfiltered list. */
export function computeFacets(offers: DisplayOffer[]): FilterFacets {
  const stops = new Map<StopsOption, { minPrice: number; count: number }>();
  const airlines = new Map<string, { name: string; minPrice: number; count: number }>();
  const times = new Map<TimeWindow, number>();
  let minPrice = Infinity;
  let maxPrice = 0;
  let minDur = Infinity;
  let maxDur = 0;
  for (const o of offers) {
    const price = o.display.total;
    minPrice = Math.min(minPrice, price);
    maxPrice = Math.max(maxPrice, price);
    const longest = Math.max(...o.slices.map((s) => s.durationMin));
    minDur = Math.min(minDur, longest);
    maxDur = Math.max(maxDur, longest);
    const b = stopsBucket(o.maxStops);
    const s = stops.get(b);
    stops.set(b, { minPrice: Math.min(s?.minPrice ?? Infinity, price), count: (s?.count ?? 0) + 1 });
    for (const c of o.carriers) {
      const a = airlines.get(c.code);
      airlines.set(c.code, { name: c.name, minPrice: Math.min(a?.minPrice ?? Infinity, price), count: (a?.count ?? 0) + 1 });
    }
    const w = timeWindowOf(o.slices[0].departLocal);
    times.set(w, (times.get(w) ?? 0) + 1);
  }
  return {
    stops: ([0, 1, 2] as StopsOption[]).filter((v) => stops.has(v)).map((v) => ({ value: v, ...stops.get(v)! })),
    airlines: [...airlines.entries()]
      .map(([code, v]) => ({ code, ...v }))
      .sort((a, b) => a.minPrice - b.minPrice || a.name.localeCompare(b.name)),
    price: offers.length ? { min: minPrice, max: maxPrice } : { min: 0, max: 0 },
    durationH: offers.length ? { min: Math.floor(minDur / 60), max: Math.ceil(maxDur / 60) } : { min: 0, max: 0 },
    depTimes: TIME_WINDOWS.map((value) => ({ value, count: times.get(value) ?? 0 })),
  };
}

// ---- URL params ------------------------------------------------------------

type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;
const get = (src: ParamSource, key: string): string | undefined => {
  if (src instanceof URLSearchParams) return src.get(key) ?? undefined;
  const v = src[key];
  return Array.isArray(v) ? v[0] : v;
};
const list = (v: string | undefined) => (v ? v.split(",").filter(Boolean) : []);
const positive = (v: string | undefined) => {
  const n = Number(v);
  return v && Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
};

export function parseFilters(src: ParamSource): FlightFilters {
  return {
    stops: list(get(src, "stops"))
      .map(Number)
      .filter((n): n is StopsOption => n === 0 || n === 1 || n === 2),
    maxPrice: positive(get(src, "maxPrice")),
    depTimes: list(get(src, "dep")).filter((v): v is TimeWindow => (TIME_WINDOWS as readonly string[]).includes(v)),
    airlines: list(get(src, "airlines")).filter((v) => /^[A-Z0-9]{2}$/.test(v)),
    maxDurationH: positive(get(src, "maxDur")),
    bags: list(get(src, "bags")).filter((v): v is BagOption => (BAG_OPTIONS as readonly string[]).includes(v)),
  };
}

/** Writes filters onto a copy of `base`, removing empty ones. */
export function writeFilters(base: URLSearchParams, f: FlightFilters): URLSearchParams {
  const p = new URLSearchParams(base);
  const set = (key: string, value: string | undefined) => (value ? p.set(key, value) : p.delete(key));
  set("stops", f.stops.length ? [...f.stops].sort().join(",") : undefined);
  set("maxPrice", f.maxPrice !== undefined ? String(f.maxPrice) : undefined);
  set("dep", f.depTimes.length ? f.depTimes.join(",") : undefined);
  set("airlines", f.airlines.length ? f.airlines.join(",") : undefined);
  set("maxDur", f.maxDurationH !== undefined ? String(f.maxDurationH) : undefined);
  set("bags", f.bags.length ? f.bags.join(",") : undefined);
  return p;
}

export function activeFilterCount(f: FlightFilters): number {
  return (
    (f.stops.length ? 1 : 0) +
    (f.maxPrice !== undefined ? 1 : 0) +
    (f.depTimes.length ? 1 : 0) +
    (f.airlines.length ? 1 : 0) +
    (f.maxDurationH !== undefined ? 1 : 0) +
    (f.bags.length ? 1 : 0)
  );
}
