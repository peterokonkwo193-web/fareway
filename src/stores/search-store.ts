"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Place } from "@/lib/geo/types";
import { MAX_LEGS, type Cabin, type SearchQuery, type TripType } from "@/lib/search/query";

export type DraftLeg = { from: Place | null; to: Place | null; date: string | null };
export type RecentSearch = { label: string; href: string; at: number };

type SearchState = {
  trip: TripType;
  legs: DraftLeg[];
  returnDate: string | null;
  adults: number;
  children: number;
  infants: number;
  cabin: Cabin;
  recent: RecentSearch[];
  recentPlaces: Place[];

  setTrip: (trip: TripType) => void;
  setLeg: (index: number, patch: Partial<DraftLeg>) => void;
  setReturnDate: (date: string | null) => void;
  swap: (index: number) => void;
  addLeg: () => void;
  removeLeg: (index: number) => void;
  setPassengers: (p: { adults?: number; children?: number; infants?: number }) => void;
  setCabin: (cabin: Cabin) => void;
  rememberPlace: (place: Place) => void;
  addRecent: (search: Omit<RecentSearch, "at">) => void;
  loadQuery: (query: SearchQuery, places: Record<string, Place>) => void;
};

const emptyLeg = (): DraftLeg => ({ from: null, to: null, date: null });

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      trip: "return",
      legs: [emptyLeg()],
      returnDate: null,
      adults: 1,
      children: 0,
      infants: 0,
      cabin: "economy",
      recent: [],
      recentPlaces: [],

      setTrip: (trip) =>
        set((s) => {
          if (trip === "multi") {
            const first = s.legs[0] ?? emptyLeg();
            const second: DraftLeg = s.legs[1] ?? { from: first.to?.kind === "anywhere" ? null : first.to, to: null, date: null };
            return { trip, legs: [first.to?.kind === "anywhere" ? { ...first, to: null } : first, second] };
          }
          return { trip, legs: [s.legs[0] ?? emptyLeg()] };
        }),
      setLeg: (index, patch) => set((s) => ({ legs: s.legs.map((leg, i) => (i === index ? { ...leg, ...patch } : leg)) })),
      setReturnDate: (returnDate) => set({ returnDate }),
      swap: (index) =>
        set((s) => ({
          legs: s.legs.map((leg, i) =>
            i === index && leg.to?.kind !== "anywhere" ? { ...leg, from: leg.to, to: leg.from } : leg,
          ),
        })),
      addLeg: () =>
        set((s) => {
          if (s.legs.length >= MAX_LEGS) return s;
          const last = s.legs[s.legs.length - 1];
          return { legs: [...s.legs, { from: last?.to ?? null, to: null, date: null }] };
        }),
      removeLeg: (index) => set((s) => (s.legs.length <= 2 ? s : { legs: s.legs.filter((_, i) => i !== index) })),
      setPassengers: (p) => set(p),
      setCabin: (cabin) => set({ cabin }),
      rememberPlace: (place) =>
        set((s) => ({
          recentPlaces: [place, ...s.recentPlaces.filter((p) => p.id !== place.id)].slice(0, 5),
        })),
      addRecent: (search) =>
        set((s) => ({
          recent: [{ ...search, at: Date.now() }, ...s.recent.filter((r) => r.href !== search.href)].slice(0, 4),
        })),
      loadQuery: (q, places) =>
        set({
          trip: q.trip,
          legs: q.legs.map((leg) => ({ from: places[leg.from] ?? null, to: places[leg.to] ?? null, date: leg.date })),
          returnDate: q.returnDate ?? null,
          adults: q.adults,
          children: q.children,
          infants: q.infants,
          cabin: q.cabin,
        }),
    }),
    {
      name: "fw-search",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        trip: s.trip,
        legs: s.legs,
        returnDate: s.returnDate,
        adults: s.adults,
        children: s.children,
        infants: s.infants,
        cabin: s.cabin,
        recent: s.recent,
        recentPlaces: s.recentPlaces,
      }),
    },
  ),
);
