import { describe, expect, it } from "vitest";
import { bestScores, highlightIds, parseSort, sortOffers, sortSummaries } from "@/lib/flights/sort";
import { makeOffer } from "../support/offers";

const cheapSlow = makeOffer({ price: 200, duration: 900, stops: 2 });
const midMid = makeOffer({ price: 260, duration: 480, stops: 1 });
const priceyFast = makeOffer({ price: 500, duration: 420, stops: 0 });
const offers = [priceyFast, cheapSlow, midMid];

describe("sortOffers", () => {
  it("sorts cheapest first", () => {
    expect(sortOffers(offers, "cheapest").map((o) => o.display.total)).toEqual([200, 260, 500]);
  });

  it("sorts fastest first", () => {
    expect(sortOffers(offers, "fastest").map((o) => o.totalDurationMin)).toEqual([420, 480, 900]);
  });

  it("ranks 'best' by a blend of price, duration and stops", () => {
    // midMid is close to the cheapest and close to the fastest, so it wins.
    expect(sortOffers(offers, "best")[0].id).toBe(midMid.id);
  });

  it("does not mutate the input", () => {
    const copy = [...offers];
    sortOffers(offers, "cheapest");
    expect(offers).toEqual(copy);
  });

  it("breaks price ties by duration, deterministically", () => {
    const a = makeOffer({ price: 300, duration: 600 });
    const b = makeOffer({ price: 300, duration: 400 });
    expect(sortOffers([a, b], "cheapest").map((o) => o.id)).toEqual([b.id, a.id]);
    expect(sortOffers([b, a], "cheapest").map((o) => o.id)).toEqual([b.id, a.id]);
  });
});

describe("bestScores", () => {
  it("normalises to 0..1 and gives identical offers equal scores", () => {
    const scores = bestScores(offers);
    for (const s of scores.values()) {
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
    }
    const x = makeOffer({ price: 100, duration: 100 });
    const y = makeOffer({ price: 100, duration: 100 });
    const s2 = bestScores([x, y]);
    expect(s2.get(x.id)).toBe(s2.get(y.id));
  });
});

describe("sortSummaries", () => {
  it("shows the top price and average journey time per tab", () => {
    const ret = makeOffer({ price: 150, duration: 300, slices: 2 }); // total 600 over 2 slices
    const s = sortSummaries([ret, priceyFast]);
    expect(s.cheapest).toEqual({ mode: "cheapest", price: 150, avgDurationMin: 300 });
    // 420 min one way beats 2 × 300 min, so the fastest tab shows the other offer.
    expect(s.fastest).toEqual({ mode: "fastest", price: 500, avgDurationMin: 420 });
  });

  it("returns nulls for no offers", () => {
    expect(sortSummaries([])).toEqual({ cheapest: null, fastest: null, best: null });
  });
});

describe("highlightIds / parseSort", () => {
  it("finds the cheapest and fastest offers", () => {
    const h = highlightIds(offers);
    expect(h.cheapest).toBe(cheapSlow.id);
    expect(h.fastest).toBe(priceyFast.id);
  });

  it("defaults unknown sort values to best", () => {
    expect(parseSort("fastest")).toBe("fastest");
    expect(parseSort("random")).toBe("best");
    expect(parseSort(null)).toBe("best");
  });
});
