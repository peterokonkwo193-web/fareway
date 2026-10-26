import { describe, expect, it } from "vitest";
import {
  activeFilterCount,
  applyFilters,
  computeFacets,
  emptyFilters,
  parseFilters,
  timeWindowOf,
  writeFilters,
  type FlightFilters,
} from "@/lib/flights/filter";
import { makeOffer } from "../support/offers";

const offers = [
  makeOffer({ price: 300, duration: 420, stops: 0, depart: "2026-12-12T06:30", carriers: ["BA"], checkedBags: 1 }),
  makeOffer({ price: 250, duration: 600, stops: 1, depart: "2026-12-12T09:15", carriers: ["KL"] }),
  makeOffer({ price: 200, duration: 900, stops: 2, depart: "2026-12-12T14:00", carriers: ["TK", "KL"], cabinBagKg: null }),
  makeOffer({ price: 450, duration: 460, stops: 0, depart: "2026-12-12T19:45", carriers: ["VS"], checkedBags: 1 }),
];
const f = (patch: Partial<FlightFilters>): FlightFilters => ({ ...emptyFilters, ...patch });

describe("applyFilters", () => {
  it("returns everything with no filters", () => {
    expect(applyFilters(offers, emptyFilters)).toHaveLength(4);
  });

  it("filters by stops, treating 2 as two or more", () => {
    expect(applyFilters(offers, f({ stops: [0] })).map((o) => o.display.total)).toEqual([300, 450]);
    expect(applyFilters(offers, f({ stops: [1, 2] })).map((o) => o.display.total)).toEqual([250, 200]);
  });

  it("filters by max price inclusively", () => {
    expect(applyFilters(offers, f({ maxPrice: 300 })).map((o) => o.display.total)).toEqual([300, 250, 200]);
  });

  it("filters by departure time window of the first slice", () => {
    expect(applyFilters(offers, f({ depTimes: ["early"] })).map((o) => o.display.total)).toEqual([300]);
    expect(applyFilters(offers, f({ depTimes: ["morning", "evening"] })).map((o) => o.display.total)).toEqual([250, 450]);
  });

  it("requires every carrier on an itinerary to be selected", () => {
    expect(applyFilters(offers, f({ airlines: ["KL"] })).map((o) => o.display.total)).toEqual([250]);
    expect(applyFilters(offers, f({ airlines: ["KL", "TK"] })).map((o) => o.display.total)).toEqual([250, 200]);
  });

  it("filters by max journey time in hours", () => {
    expect(applyFilters(offers, f({ maxDurationH: 8 })).map((o) => o.display.total)).toEqual([300, 450]);
  });

  it("filters by included baggage", () => {
    expect(applyFilters(offers, f({ bags: ["checked"] })).map((o) => o.display.total)).toEqual([300, 450]);
    expect(applyFilters(offers, f({ bags: ["cabin"] }))).toHaveLength(3);
  });

  it("combines filters with AND", () => {
    expect(applyFilters(offers, f({ stops: [0], maxPrice: 400 })).map((o) => o.display.total)).toEqual([300]);
  });
});

describe("timeWindowOf", () => {
  it("assigns window boundaries to the later window", () => {
    expect(timeWindowOf("2026-01-01T07:59")).toBe("early");
    expect(timeWindowOf("2026-01-01T08:00")).toBe("morning");
    expect(timeWindowOf("2026-01-01T12:00")).toBe("afternoon");
    expect(timeWindowOf("2026-01-01T23:59")).toBe("evening");
  });
});

describe("URL params", () => {
  it("round-trips filters through URL params", () => {
    const filters = f({ stops: [1, 0], maxPrice: 400, depTimes: ["morning"], airlines: ["BA", "VS"], maxDurationH: 12, bags: ["checked"] });
    const params = writeFilters(new URLSearchParams("trip=oneway&from=LHR"), filters);
    expect(params.get("trip")).toBe("oneway");
    expect(params.get("stops")).toBe("0,1");
    expect(parseFilters(params)).toEqual({ ...filters, stops: [0, 1] });
  });

  it("drops invalid values instead of failing", () => {
    expect(parseFilters(new URLSearchParams("stops=0,7,x&maxPrice=-5&dep=noon,early&airlines=BA,toolong&bags=hold"))).toEqual({
      stops: [0],
      maxPrice: undefined,
      depTimes: ["early"],
      airlines: ["BA"],
      maxDurationH: undefined,
      bags: [],
    });
  });

  it("removes empty filters from the URL", () => {
    const params = writeFilters(new URLSearchParams("stops=0&maxPrice=100"), emptyFilters);
    expect(params.toString()).toBe("");
  });

  it("counts active filter groups", () => {
    expect(activeFilterCount(emptyFilters)).toBe(0);
    expect(activeFilterCount(f({ stops: [0, 1], airlines: ["BA"] }))).toBe(2);
  });
});

describe("computeFacets", () => {
  it("reports options with from-prices and ranges", () => {
    const facets = computeFacets(offers);
    expect(facets.stops).toEqual([
      { value: 0, minPrice: 300, count: 2 },
      { value: 1, minPrice: 250, count: 1 },
      { value: 2, minPrice: 200, count: 1 },
    ]);
    expect(facets.price).toEqual({ min: 200, max: 450 });
    expect(facets.durationH).toEqual({ min: 7, max: 15 });
    expect(facets.airlines.map((a) => [a.code, a.minPrice])).toEqual([
      ["KL", 200],
      ["TK", 200],
      ["BA", 300],
      ["VS", 450],
    ]);
  });

  it("handles an empty list", () => {
    expect(computeFacets([]).price).toEqual({ min: 0, max: 0 });
  });
});
