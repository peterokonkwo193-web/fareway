import { searchQueryToParams, type Cabin } from "./query";

/** Builds a /flights link for a simple return or one-way search. */
export function flightsHref(opts: {
  from: string;
  to: string;
  depart: string;
  returnDate?: string;
  adults?: number;
  cabin?: Cabin;
}): string {
  const params = searchQueryToParams({
    trip: opts.returnDate ? "return" : "oneway",
    legs: [{ from: opts.from, to: opts.to, date: opts.depart }],
    returnDate: opts.returnDate,
    adults: opts.adults ?? 1,
    children: 0,
    infants: 0,
    cabin: opts.cabin ?? "economy",
  });
  return `/flights?${params}`;
}
