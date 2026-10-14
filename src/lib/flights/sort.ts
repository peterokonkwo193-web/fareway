import type { DisplayOffer } from "./types";

export const SORT_MODES = ["cheapest", "fastest", "best"] as const;
export type SortMode = (typeof SORT_MODES)[number];

export function parseSort(value: string | null | undefined): SortMode {
  return (SORT_MODES as readonly string[]).includes(value ?? "") ? (value as SortMode) : "best";
}

/**
 * "Best" balances price (60%), total travel time (30%) and number of stops (10%),
 * each normalised to 0..1 across the current result set. Lower is better.
 */
export function bestScores(offers: DisplayOffer[]): Map<string, number> {
  const scores = new Map<string, number>();
  if (offers.length === 0) return scores;
  const prices = offers.map((o) => o.display.total);
  const durations = offers.map((o) => o.totalDurationMin);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const minD = Math.min(...durations);
  const maxD = Math.max(...durations);
  const norm = (v: number, min: number, max: number) => (max === min ? 0 : (v - min) / (max - min));
  for (const o of offers) {
    const stops = o.slices.reduce((n, s) => n + s.stops, 0) / o.slices.length;
    scores.set(o.id, 0.6 * norm(o.display.total, minP, maxP) + 0.3 * norm(o.totalDurationMin, minD, maxD) + 0.1 * Math.min(stops / 2, 1));
  }
  return scores;
}

export function sortOffers(offers: DisplayOffer[], mode: SortMode): DisplayOffer[] {
  const copy = [...offers];
  const byPrice = (a: DisplayOffer, b: DisplayOffer) => a.display.total - b.display.total;
  const byDuration = (a: DisplayOffer, b: DisplayOffer) => a.totalDurationMin - b.totalDurationMin;
  if (mode === "cheapest") return copy.sort((a, b) => byPrice(a, b) || byDuration(a, b) || a.id.localeCompare(b.id));
  if (mode === "fastest") return copy.sort((a, b) => byDuration(a, b) || byPrice(a, b) || a.id.localeCompare(b.id));
  const scores = bestScores(copy);
  return copy.sort((a, b) => scores.get(a.id)! - scores.get(b.id)! || byPrice(a, b) || a.id.localeCompare(b.id));
}

export type SortSummary = { mode: SortMode; price: number; avgDurationMin: number } | null;

/**
 * Figures for the sort tabs: the top offer's price under each mode, and its
 * average journey time (mean of outbound/return/legs), e.g. "$389 · 8h 10m avg".
 */
export function sortSummaries(offers: DisplayOffer[]): Record<SortMode, SortSummary> {
  const out = {} as Record<SortMode, SortSummary>;
  for (const mode of SORT_MODES) {
    const top = sortOffers(offers, mode)[0];
    out[mode] = top
      ? { mode, price: top.display.total, avgDurationMin: Math.round(top.totalDurationMin / top.slices.length) }
      : null;
  }
  return out;
}

/** Badges: cheapest and fastest offers in the set. */
export function highlightIds(offers: DisplayOffer[]) {
  return {
    cheapest: sortOffers(offers, "cheapest")[0]?.id,
    fastest: sortOffers(offers, "fastest")[0]?.id,
    best: sortOffers(offers, "best")[0]?.id,
  };
}
