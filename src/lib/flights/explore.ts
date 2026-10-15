import "server-only";
import { addDays, addMonths, format, isBefore, parseISO, startOfMonth } from "date-fns";
import { geo } from "@/lib/geo/data";
import type { Continent, Place } from "@/lib/geo/types";
import { toIsoDate } from "@/lib/search/query";
import { destinations, memoDeals } from "./deals";
import { flightProvider } from "./provider";

export type ExploreItem = {
  countryCode: string;
  countryName: string;
  flag: string;
  continent: Continent;
  /** Destination place id used for the search link (country, so all its airports are searched). */
  placeId: string;
  airport: string;
  city: string;
  priceUsd: number;
  durationMin: number;
  stops: number;
  departDate: string;
  returnDate: string;
  image?: string;
};

/** Next 12 months as "YYYY-MM" (current month first). */
export function exploreMonths(today = new Date()): string[] {
  return Array.from({ length: 12 }, (_, i) => format(addMonths(startOfMonth(today), i), "yyyy-MM"));
}

/** Two sample departure dates in the month, never in the past. */
function sampleDates(month: string, today = new Date()): string[] {
  const start = parseISO(`${month}-01`);
  const earliest = addDays(today, 3);
  return [8, 22]
    .map((d) => addDays(start, d - 1))
    .map((d) => (isBefore(d, earliest) ? earliest : d))
    .filter((d) => format(d, "yyyy-MM") === month || month === format(today, "yyyy-MM"))
    .map(toIsoDate);
}

const imageByCountry = new Map(destinations.filter((d) => d.image).map((d) => [d.countryCode, d.image!]));

/**
 * Cheapest indicative return price from `origin` to every country, for one month.
 * Cached in memory for an hour per origin + month.
 */
export function exploreDestinations(origin: Place, month: string): Promise<ExploreItem[]> {
  return memoDeals(`explore:${origin.id}:${month}:${toIsoDate(new Date())}`, async () => {
    const fromIata = origin.airports[0];
    if (!fromIata) return [];
    const dates = sampleDates(month);
    if (dates.length === 0) return [];
    const items: ExploreItem[] = [];
    for (const c of geo.countries) {
      if (c.continent === "Antarctica") continue;
      if (origin.kind === "country" && c.iso2 === origin.countryCode) continue;
      const [dest] = geo.gatewayAirports(c.iso2, 1);
      if (!dest || origin.airports.includes(dest)) continue;
      let best: { price: number; duration: number; stops: number; date: string } | null = null;
      for (const date of dates) {
        const out = await flightProvider.estimate(fromIata, dest, date);
        if (!out) continue;
        if (!best || out.priceUsd < best.price) best = { price: out.priceUsd, duration: out.durationMin, stops: out.stops, date };
      }
      if (!best) continue;
      const airport = geo.getAirport(dest)!;
      items.push({
        countryCode: c.iso2,
        countryName: c.name,
        flag: c.flag,
        continent: c.continent,
        placeId: `country:${c.iso2}`,
        airport: dest,
        city: airport.city,
        // Return estimate: outbound price doubled with the usual return discount.
        priceUsd: Math.round(best.price * 1.8),
        durationMin: best.duration,
        stops: best.stops,
        departDate: best.date,
        returnDate: toIsoDate(addDays(parseISO(best.date), 6)),
        image: imageByCountry.get(c.iso2),
      });
    }
    return items.sort((a, b) => a.priceUsd - b.priceUsd);
  });
}
