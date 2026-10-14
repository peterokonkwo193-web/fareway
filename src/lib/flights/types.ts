import type { Cabin, SearchQuery } from "@/lib/search/query";

export type AirportRef = {
  iata: string;
  name: string;
  city: string;
  countryCode: string;
  terminal?: string;
};

export type Carrier = { code: string; name: string };

export type Segment = {
  carrier: Carrier;
  /** e.g. "BA 117" */
  flightNumber: string;
  aircraft: string;
  from: AirportRef;
  to: AirportRef;
  /** Local wall-clock times, "YYYY-MM-DDTHH:mm" (no offset). */
  departLocal: string;
  arriveLocal: string;
  durationMin: number;
  distanceKm: number;
  amenities: { wifi: boolean; power: boolean; meal: boolean };
};

export type Layover = {
  airport: AirportRef;
  durationMin: number;
  overnight: boolean;
};

/** One direction of a journey (outbound, return, or one leg of a multi-city trip). */
export type Slice = {
  from: AirportRef;
  to: AirportRef;
  departLocal: string;
  arriveLocal: string;
  /** Calendar days between departure and arrival local dates (e.g. +1). */
  dayOffset: number;
  durationMin: number;
  stops: number;
  segments: Segment[];
  layovers: Layover[];
};

export type Baggage = {
  personalItem: true;
  /** kg, null = not included (fee applies) */
  cabinBagKg: number | null;
  checkedBags: number;
  checkedBagKg: number;
  cabinBagFeeUsd?: number;
  checkedBagFeeUsd?: number;
};

export type FareConditions = {
  brand: string;
  refundable: boolean;
  changeable: boolean;
  changeFeeUsd?: number;
};

export type PriceUsd = {
  totalUsd: number;
  perAdultUsd: number;
  baseUsd: number;
  taxesUsd: number;
};

export type FlightOffer = {
  /** Opaque id; the provider can rebuild the offer from it. */
  id: string;
  provider: string;
  /** Canonical search query string that produced this offer (for "back to results"). */
  searchQuery: string;
  cabin: Cabin;
  slices: Slice[];
  carriers: Carrier[];
  baggage: Baggage;
  conditions: FareConditions;
  price: PriceUsd;
  passengers: { adults: number; children: number; infants: number };
  /** Total travel time across all slices. */
  totalDurationMin: number;
  maxStops: number;
  /** ISO timestamp when the price was generated. */
  quotedAt: string;
};

/** An offer with prices converted to the visitor's display currency. */
export type DisplayOffer = FlightOffer & {
  display: { currency: string; total: number; perAdult: number };
};

export type PriceEstimate = {
  fromIata: string;
  toIata: string;
  priceUsd: number;
  durationMin: number;
  stops: number;
  carrier: Carrier;
};

/**
 * Contract every flight data source implements. Swap the mock for a real
 * provider (Amadeus, Duffel, ...) by implementing this interface; see README.
 */
export interface FlightProvider {
  readonly name: string;
  /** All offers for a validated query. */
  search(query: SearchQuery): Promise<FlightOffer[]>;
  /** Re-fetches (re-prices) a single offer from its id. Null if no longer available. */
  getOffer(id: string): Promise<FlightOffer | null>;
  /** Cheapest one-way economy estimate for a route/date, for Explore and the home page. */
  estimate(fromIata: string, toIata: string, date: string): Promise<PriceEstimate | null>;
}
