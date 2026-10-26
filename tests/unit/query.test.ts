import { describe, expect, it } from "vitest";
import { parseSearchParams, parseSearchQuery, searchQueryToParams } from "@/lib/search/query";

const today = new Date("2026-10-15T12:00:00Z");
const base = { adults: "1", children: "0", infants: "0", cabin: "economy" };

describe("parseSearchParams", () => {
  it("parses a return search", () => {
    const r = parseSearchParams(
      new URLSearchParams({ trip: "return", from: "LHR", to: "city:NYC", depart: "2026-12-12", return: "2026-12-19", ...base }),
      today,
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.query).toMatchObject({ trip: "return", legs: [{ from: "LHR", to: "city:NYC", date: "2026-12-12" }], returnDate: "2026-12-19" });
  });

  it("parses multi-city legs and round-trips them", () => {
    const params = new URLSearchParams({ trip: "multi", ...base });
    params.append("leg", "JFK,LHR,2026-11-20");
    params.append("leg", "LHR,country:IN,2026-11-25");
    const r = parseSearchParams(params, today);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.query.legs).toHaveLength(2);
      expect(parseSearchParams(searchQueryToParams(r.query), today)).toEqual(r);
    }
  });

  it.each([
    [{ trip: "return", from: "LHR", to: "JFK", depart: "2026-12-12", return: "2026-12-01" }, "returnDate"],
    [{ trip: "oneway", from: "LHR", to: "LHR", depart: "2026-12-12" }, "legs.0.to"],
    [{ trip: "oneway", from: "anywhere", to: "JFK", depart: "2026-12-12" }, "legs.0.from"],
    [{ trip: "oneway", from: "lhr", to: "JFK", depart: "2026-12-12" }, "legs.0.from"],
    [{ trip: "oneway", from: "LHR", to: "JFK", depart: "2026-01-01" }, "legs.0.date"],
    [{ trip: "oneway", from: "LHR", to: "JFK", depart: "2028-01-01" }, "legs.0.date"],
  ])("rejects invalid search %#", (params, field) => {
    const r = parseSearchParams(new URLSearchParams({ ...base, ...params }), today);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors)).toContain(field);
  });

  it("enforces traveller limits", () => {
    const leg = [{ from: "LHR", to: "JFK", date: "2026-12-12" }];
    expect(parseSearchQuery({ trip: "oneway", legs: leg, adults: 5, children: 5, infants: 0, cabin: "economy" }, today).ok).toBe(false);
    const infants = parseSearchQuery({ trip: "oneway", legs: leg, adults: 1, children: 0, infants: 2, cabin: "economy" }, today);
    expect(infants.ok).toBe(false);
    if (!infants.ok) expect(infants.errors.infants).toMatch(/adult/);
  });
});
