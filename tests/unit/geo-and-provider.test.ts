import { describe, expect, it } from "vitest";
import countries from "../../data/countries.json";
import airports from "../../data/airports.json";
import metros from "../../data/metro-codes.json";
import airlines from "../../data/airlines.json";
import { createGeoIndex } from "@/lib/geo/geo-index";
import type { Airport, Country, MetroCode } from "@/lib/geo/types";
import { createMockProvider, type AirlineRecord } from "@/lib/flights/mock-provider";
import type { SearchQuery } from "@/lib/search/query";

const geo = createGeoIndex({ countries: countries as Country[], airports: airports as Airport[], metros: metros as MetroCode[] });
const now = () => new Date("2026-10-15T12:00:00Z");
const provider = createMockProvider({ geo, airlines: airlines as AirlineRecord[], now });
const q = (patch: Partial<SearchQuery>): SearchQuery => ({
  trip: "oneway",
  legs: [{ from: "LHR", to: "JFK", date: "2026-12-12" }],
  adults: 1,
  children: 0,
  infants: 0,
  cabin: "economy",
  ...patch,
});

describe("country and airport data", () => {
  it("covers all 193 UN members plus the two observer states", () => {
    expect(countries.filter((c) => c.status === "un-member")).toHaveLength(193);
    expect(countries.filter((c) => c.status === "un-observer").map((c) => c.iso2).sort()).toEqual(["PS", "VA"]);
  });

  it("gives every country (except Antarctic territories) a way to fly", () => {
    const unreachable = countries.filter((c) => c.continent !== "Antarctica" && geo.gatewayAirports(c.iso2).length === 0);
    expect(unreachable.map((c) => c.iso2)).toEqual([]);
  });

  it("has valid, unique IATA codes", () => {
    const codes = airports.map((a) => a.iata);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.every((c) => /^[A-Z]{3}$/.test(c))).toBe(true);
  });
});

describe("place search", () => {
  it("groups countries, cities and airports", () => {
    const r = geo.searchPlaces("london");
    expect(r[0]).toMatchObject({ id: "city:LON", group: "city" });
    expect(r.filter((p) => p.group === "airport").map((p) => p.code)).toContain("LHR");
  });

  it("matches exact IATA codes first", () => {
    expect(geo.searchPlaces("JFK")[0].id).toBe("JFK");
  });

  it("tolerates typos and accents", () => {
    expect(geo.searchPlaces("barcelna").map((p) => p.code)).toContain("BCN");
    expect(geo.searchPlaces("sao paulo")[0].id).toBe("city:SAO");
  });

  it("offers Everywhere only when allowed", () => {
    expect(geo.searchPlaces("", { allowEverywhere: true })[0].id).toBe("anywhere");
    expect(geo.searchPlaces("every").some((p) => p.id === "anywhere")).toBe(false);
  });

  it("resolves places without an airport to nearby airports", () => {
    expect(geo.resolvePlace("country:VA")?.airports).toEqual(expect.arrayContaining(["FCO"]));
    expect(geo.resolvePlace("nonsense")).toBeUndefined();
  });
});

describe("MockProvider", () => {
  it("is deterministic for the same query and day", async () => {
    const a = await provider.search(q({}));
    const b = await provider.search(q({}));
    expect(a.map((o) => o.id)).toEqual(b.map((o) => o.id));
    expect(a.length).toBeGreaterThan(3);
  });

  it("rebuilds offers from their id", async () => {
    const [offer] = await provider.search(q({ trip: "return", returnDate: "2026-12-19" }));
    expect(await provider.getOffer(offer.id)).toEqual(offer);
    expect(await provider.getOffer("m1.garbage")).toBeNull();
  });

  it("produces connected, plausible itineraries", async () => {
    for (const legs of [
      [{ from: "FUN", to: "city:LON", date: "2026-12-12" }],
      [{ from: "country:NG", to: "country:JP", date: "2026-12-12" }],
      [{ from: "LHR", to: "BCN", date: "2026-12-12" }],
    ]) {
      const offers = await provider.search(q({ legs }));
      expect(offers.length).toBeGreaterThan(0);
      for (const o of offers) {
        expect(o.price.totalUsd).toBeGreaterThan(0);
        for (const s of o.slices) {
          s.segments.forEach((seg, i) => {
            expect(seg.distanceKm).toBeLessThanOrEqual(14500);
            expect(seg.durationMin).toBeGreaterThan(0);
            if (i > 0) expect(seg.from.iata).toBe(s.segments[i - 1].to.iata);
          });
          expect(s.layovers).toHaveLength(s.segments.length - 1);
          expect(s.stops).toBe(s.segments.length - 1);
        }
      }
    }
  });

  it("prices premium cabins and larger parties higher", async () => {
    const eco = (await provider.search(q({})))[0].price.totalUsd;
    const biz = (await provider.search(q({ cabin: "business" })))[0].price.totalUsd;
    const family = (await provider.search(q({ adults: 2, children: 1 })))[0].price.totalUsd;
    expect(biz).toBeGreaterThan(eco * 2);
    expect(family).toBeGreaterThan(eco * 2);
  });
});
