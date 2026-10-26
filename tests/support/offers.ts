import type { DisplayOffer, Slice } from "@/lib/flights/types";

let n = 0;

/** Minimal DisplayOffer builder for filter/sort tests. */
export function makeOffer(opts: {
  price: number;
  duration: number;
  stops?: number;
  depart?: string;
  carriers?: string[];
  cabinBagKg?: number | null;
  checkedBags?: number;
  slices?: number;
}): DisplayOffer {
  const id = `o${++n}`;
  const stops = opts.stops ?? 0;
  const sliceCount = opts.slices ?? 1;
  const slice = (): Slice => ({
    from: { iata: "LHR", name: "Heathrow", city: "London", countryCode: "GB" },
    to: { iata: "JFK", name: "JFK", city: "New York", countryCode: "US" },
    departLocal: opts.depart ?? "2026-12-12T09:00",
    arriveLocal: "2026-12-12T12:00",
    dayOffset: 0,
    durationMin: opts.duration,
    stops,
    segments: [],
    layovers: [],
  });
  const carriers = (opts.carriers ?? ["BA"]).map((code) => ({ code, name: `Airline ${code}` }));
  return {
    id,
    provider: "test",
    searchQuery: "",
    cabin: "economy",
    slices: Array.from({ length: sliceCount }, slice),
    carriers,
    baggage: { personalItem: true, cabinBagKg: opts.cabinBagKg === undefined ? 8 : opts.cabinBagKg, checkedBags: opts.checkedBags ?? 0, checkedBagKg: 23 },
    conditions: { brand: "Test", refundable: false, changeable: true },
    price: { totalUsd: opts.price, perAdultUsd: opts.price, baseUsd: opts.price - 50, taxesUsd: 50 },
    passengers: { adults: 1, children: 0, infants: 0 },
    totalDurationMin: opts.duration * sliceCount,
    maxStops: stops,
    quotedAt: "2026-10-15T00:00:00.000Z",
    display: { currency: "USD", total: opts.price, perAdult: opts.price },
  };
}
