import "server-only";
import { addDays } from "date-fns";
import destinationsJson from "../../../data/destinations.json";
import { geo } from "@/lib/geo/data";
import type { Place } from "@/lib/geo/types";
import { toIsoDate } from "@/lib/search/query";
import { flightProvider } from "./provider";
import type { PriceEstimate } from "./types";

export type Destination = { place: string; name: string; countryCode: string; image?: string; tags: string[] };
export const destinations = destinationsJson as Destination[];

export type Deal = {
  destination: Place;
  name: string;
  countryName: string;
  flag?: string;
  image?: string;
  departDate: string;
  returnDate: string;
  estimate: PriceEstimate;
  /** Indicative return-trip price (outbound + inbound estimates, return discount applied). */
  returnPriceUsd: number;
};

const TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { at: number; value: unknown }>();

async function memo<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as T;
  const value = await fn();
  cache.set(key, { at: Date.now(), value });
  if (cache.size > 2000) cache.delete(cache.keys().next().value!);
  return value;
}

/** Cheapest estimate across several candidate dates. */
async function cheapestOver(fromIata: string, toIata: string, dates: string[]) {
  let best: { estimate: PriceEstimate; date: string } | null = null;
  for (const date of dates) {
    const estimate = await flightProvider.estimate(fromIata, toIata, date);
    if (estimate && (!best || estimate.priceUsd < best.estimate.priceUsd)) best = { estimate, date };
  }
  return best;
}

function sampleDates(startInDays: number, endInDays: number, step: number) {
  const today = new Date();
  const out: string[] = [];
  for (let d = startInDays; d <= endInDays; d += step) out.push(toIsoDate(addDays(today, d)));
  return out;
}

async function dealsFor(origin: Place, list: Destination[], dates: string[], stayNights: number): Promise<Deal[]> {
  const fromIata = origin.airports[0];
  if (!fromIata) return [];
  const results = await Promise.all(
    list.map(async (d): Promise<Deal | null> => {
      const place = geo.resolvePlace(d.place);
      if (!place || place.airports.some((a) => origin.airports.includes(a))) return null;
      if (place.countryCode === origin.countryCode && origin.kind === "country") return null;
      const best = await cheapestOver(fromIata, place.airports[0], dates);
      if (!best) return null;
      const country = geo.getCountry(d.countryCode);
      const returnDate = toIsoDate(addDays(new Date(best.date), stayNights));
      const back = await flightProvider.estimate(place.airports[0], fromIata, returnDate);
      return {
        destination: place,
        name: d.name,
        countryName: country?.name ?? d.countryCode,
        flag: country?.flag,
        image: d.image,
        departDate: best.date,
        returnDate,
        estimate: best.estimate,
        returnPriceUsd: Math.round((best.estimate.priceUsd + (back?.priceUsd ?? best.estimate.priceUsd)) * 0.9),
      };
    }),
  );
  return results.filter((r): r is Deal => r !== null);
}

/** Featured destinations (with photos) priced from the origin, about a month out. */
export function popularDestinations(origin: Place): Promise<Deal[]> {
  return memo(`popular:${origin.id}:${toIsoDate(new Date())}`, () =>
    dealsFor(origin, destinations.filter((d) => d.image), sampleDates(21, 42, 7), 5),
  );
}

/** Cheapest routes from the origin departing in the next 30 days. */
export function cheapestThisMonth(origin: Place, limit = 5): Promise<Deal[]> {
  return memo(`month:${origin.id}:${toIsoDate(new Date())}:${limit}`, async () => {
    const deals = await dealsFor(origin, destinations, sampleDates(5, 30, 5), 4);
    return deals.sort((a, b) => a.returnPriceUsd - b.returnPriceUsd).slice(0, limit);
  });
}

export { memo as memoDeals };
