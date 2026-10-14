import { differenceInCalendarDays, getDay, getMonth, parseISO } from "date-fns";
import type { GeoIndex } from "@/lib/geo/geo-index";
import { haversineKm } from "@/lib/geo/distance";
import { parseSearchParams, searchQueryToParams, type Cabin, type SearchQuery } from "@/lib/search/query";
import { createRng, hashString, type Rng } from "./random";
import { dayDiff, formatLocal, localMinutes, utcOffsetHours } from "./time";
import type {
  AirportRef,
  Baggage,
  Carrier,
  FareConditions,
  FlightOffer,
  FlightProvider,
  Layover,
  PriceEstimate,
  Segment,
  Slice,
} from "./types";

/**
 * MockProvider: generates realistic, deterministic flights between any two
 * airports in data/airports.json. Same query => same results (within a day),
 * so links to results and offers stay stable.
 */

export type AirlineRecord = { code: string; name: string; country: string; hubs: string[]; model: "full" | "low-cost" };

/** Carriers with worldwide networks: they can plausibly serve any large airport. */
const GLOBAL_NETWORK = new Set([
  "EK", "QR", "TK", "ET", "EY", "LH", "AF", "KL", "BA", "SQ", "QF", "AA", "DL", "UA", "AC", "CX", "LX", "IB", "KE", "NH", "JL", "AI", "MS", "KQ", "AT",
]);

/** Plan for one direction: the airports visited and who flies each hop. */
type RoutePlan = { hops: string[]; carriers: AirlineRecord[] };

type Ctx = { geo: GeoIndex; airlines: AirlineRecord[]; now: () => Date };

const round5 = (n: number) => Math.round(n / 5) * 5;

const AIRCRAFT = {
  regional: ["ATR 72-600", "De Havilland Dash 8-400", "Embraer E190", "Embraer E195-E2"],
  narrow: ["Airbus A320neo", "Airbus A321neo", "Boeing 737-800", "Boeing 737 MAX 8", "Airbus A220-300"],
  wide: ["Boeing 787-9 Dreamliner", "Airbus A350-900", "Boeing 777-300ER", "Airbus A330-300", "Airbus A350-1000"],
};

export function createMockProvider({ geo, airlines, now = () => new Date() }: { geo: GeoIndex; airlines: AirlineRecord[]; now?: () => Date }): FlightProvider {
  const ctx: Ctx = { geo, airlines, now };
  const allHubs = new Set(airlines.filter((a) => GLOBAL_NETWORK.has(a.code)).flatMap((a) => a.hubs));
  /** Long-haul direct flights only land at hubs or big-country gateways. */
  const isLongHaulGateway = (a: { iata: string; countryCode: string; size: string }) =>
    a.size === "L" && (allHubs.has(a.iata) || (geo.getCountry(a.countryCode)?.airportCount ?? 0) >= 20);
  const hubOwners = airlines.flatMap((a) => a.hubs.filter((h) => geo.getAirport(h)).map((hub) => ({ airline: a, hub })));

  const ap = (iata: string) => {
    const a = geo.getAirport(iata);
    if (!a) throw new Error(`Unknown airport ${iata}`);
    return a;
  };
  const dist = (a: string, b: string) => haversineKm(ap(a), ap(b));
  const continentOf = (cc: string) => geo.getCountry(cc)?.continent;

  /** Can this airline plausibly fly to/from this airport (from one of its hubs)? */
  function serves(airline: AirlineRecord, iata: string): boolean {
    const airport = ap(iata);
    if (airline.country === airport.countryCode || airline.hubs.includes(iata)) return true;
    const nearestHub = Math.min(...airline.hubs.map((h) => (geo.getAirport(h) ? haversineKm(ap(h), airport) : Infinity)));
    if (!Number.isFinite(nearestHub)) return false;
    const sameContinent = continentOf(airline.country) === continentOf(airport.countryCode);
    if (airline.model === "low-cost") return sameContinent && airport.size !== "S" && nearestHub < 3200;
    if (GLOBAL_NETWORK.has(airline.code)) return airport.size === "L" ? nearestHub < 16000 : nearestHub < 3500;
    return (sameContinent && airport.size !== "S" && nearestHub < 4500) || (airport.size === "L" && nearestHub < 3000);
  }

  function planRoutes(from: string, to: string, rng: Rng): RoutePlan[] {
    const A = ap(from);
    const B = ap(to);
    const d = haversineKm(A, B);
    const plans: RoutePlan[] = [];
    const sameContinent = continentOf(A.countryCode) === continentOf(B.countryCode);

    // Direct flights
    if (d < 15500) {
      const direct = airlines.filter((a) => {
        const home = a.country === A.countryCode || a.country === B.countryCode || a.hubs.includes(from) || a.hubs.includes(to);
        if (!serves(a, from) || !serves(a, to)) return false;
        if (d > 3500) {
          const fromHub = a.hubs.includes(from);
          const toHub = a.hubs.includes(to);
          return a.model === "full" && (fromHub || toHub) && isLongHaulGateway(fromHub ? B : A);
        }
        if (A.size === "S" && B.size === "S") return false;
        return home || (a.model === "low-cost" && sameContinent);
      });
      const ranked = direct
        .map((a) => ({ a, score: (a.country === A.countryCode || a.country === B.countryCode ? 0 : 0.5) + rng.next() }))
        .sort((x, y) => x.score - y.score)
        .slice(0, 3);
      for (const { a } of ranked) plans.push({ hops: [from, to], carriers: [a] });
    }

    // One stop through a carrier hub
    const maxRatio = d > 6000 ? 1.25 : d > 2500 ? 1.35 : 1.7;
    const oneStop = hubOwners
      .filter(({ hub }) => hub !== from && hub !== to)
      .map(({ airline, hub }) => {
        const d1 = dist(from, hub);
        const d2 = dist(hub, to);
        return { airline, hub, d1, d2, ratio: (d1 + d2) / Math.max(d, 1) };
      })
      .filter((o) => o.d1 > 150 && o.d2 > 150 && o.ratio < maxRatio && serves(o.airline, from) && serves(o.airline, to))
      .map((o) => ({ ...o, score: o.ratio + rng.range(0, 0.2) + (o.airline.model === "low-cost" ? 0.05 : 0) }))
      .sort((x, y) => x.score - y.score);
    const usedCarriers = new Set(plans.map((p) => p.carriers[0].code));
    for (const o of oneStop) {
      if (plans.length >= 7) break;
      if (usedCarriers.has(o.airline.code) && rng.chance(0.7)) continue;
      usedCarriers.add(o.airline.code);
      plans.push({ hops: [from, o.hub, to], carriers: [o.airline, o.airline] });
    }

    // Two stops for remote airports: nearest hub to each end.
    if (plans.length < 3) {
      const nearestHubs = (iata: string, strict: boolean) =>
        hubOwners
          .filter(({ airline, hub }) => hub !== from && hub !== to && (!strict || serves(airline, iata)))
          .map((o) => ({ ...o, d: dist(iata, o.hub) }))
          .sort((x, y) => x.d - y.d);
      const MAX_LEG_KM = 14000;
      const farEnough = (o: { d: number }) => o.d > 300;
      const starts = (nearestHubs(from, true).length ? nearestHubs(from, true) : nearestHubs(from, false)).filter(farEnough);
      // First hop to a nearby hub, then the shortest sensible hub-to-destination chain.
      const options: { hops: string[]; carriers: AirlineRecord[]; km: number }[] = [];
      for (const s of starts.slice(0, 3)) {
        for (const e of hubOwners) {
          if (e.hub === from || e.hub === to || e.hub === s.hub) continue;
          const mid = dist(s.hub, e.hub);
          const last = dist(e.hub, to);
          if (mid < 300 || mid > MAX_LEG_KM || last < 300 || last > MAX_LEG_KM || !serves(e.airline, to)) continue;
          const middle = serves(e.airline, s.hub) ? e.airline : serves(s.airline, e.hub) ? s.airline : null;
          if (!middle) continue;
          options.push({ hops: [from, s.hub, e.hub, to], carriers: [s.airline, middle, e.airline], km: s.d + mid + last });
        }
        // The nearby hub may connect to the destination directly.
        const directOwner = airlines.find((a) => serves(a, s.hub) && serves(a, to) && (a.hubs.includes(s.hub) || a.hubs.includes(to)));
        if (directOwner && dist(s.hub, to) <= MAX_LEG_KM) {
          options.push({ hops: [from, s.hub, to], carriers: [s.airline, directOwner], km: s.d + dist(s.hub, to) });
        }
      }
      const seen = new Set(plans.map((p) => p.hops.join()));
      for (const o of options.sort((a, b) => a.km - b.km)) {
        if (plans.length >= 5) break;
        const key = o.hops.join();
        if (seen.has(key)) continue;
        seen.add(key);
        plans.push({ hops: o.hops, carriers: o.carriers });
      }
    }
    return plans;
  }

  function airportRef(iata: string, rng: Rng): AirportRef {
    const a = ap(iata);
    return {
      iata: a.iata,
      name: a.name,
      city: a.city,
      countryCode: a.countryCode,
      terminal: a.size === "L" ? String(rng.int(1, 5)) : undefined,
    };
  }

  function blockMinutes(d: number, rng: Rng) {
    const speed = d < 500 ? 520 : d < 1500 ? 680 : d < 4000 ? 780 : 840;
    return Math.max(35, round5(28 + (d / speed) * 60 + rng.range(-6, 12)));
  }

  function aircraftFor(d: number, rng: Rng) {
    if (d < 600) return rng.pick(AIRCRAFT.regional);
    if (d < 4500) return rng.pick(AIRCRAFT.narrow);
    return rng.pick(AIRCRAFT.wide);
  }

  function buildSlice(plan: RoutePlan, date: string, rng: Rng): Slice {
    const segments: Segment[] = [];
    const layovers: Layover[] = [];
    // Departure between 06:00 and 22:30 local.
    let departLocalMin = localMinutes(date, round5(rng.int(6 * 60, 22 * 60 + 30)));
    let departUtcMin = departLocalMin - utcOffsetHours(ap(plan.hops[0]).countryCode, ap(plan.hops[0]).lng) * 60;
    const refs = plan.hops.map((h) => airportRef(h, rng));

    for (let i = 0; i < plan.hops.length - 1; i++) {
      const fromA = ap(plan.hops[i]);
      const toA = ap(plan.hops[i + 1]);
      const d = haversineKm(fromA, toA);
      const duration = blockMinutes(d, rng);
      const arriveUtcMin = departUtcMin + duration;
      const arriveLocalMin = arriveUtcMin + utcOffsetHours(toA.countryCode, toA.lng) * 60;
      const carrier = plan.carriers[i];
      const fullService = carrier.model === "full";
      segments.push({
        carrier: { code: carrier.code, name: carrier.name },
        flightNumber: `${carrier.code} ${rng.int(d > 4000 ? 1 : 100, d > 4000 ? 399 : 2999)}`,
        aircraft: aircraftFor(d, rng),
        from: refs[i],
        to: refs[i + 1],
        departLocal: formatLocal(departLocalMin),
        arriveLocal: formatLocal(arriveLocalMin),
        durationMin: duration,
        distanceKm: Math.round(d),
        amenities: {
          wifi: fullService ? rng.chance(d > 2500 ? 0.85 : 0.4) : rng.chance(0.15),
          power: fullService ? rng.chance(0.8) : rng.chance(0.3),
          meal: fullService && d > 1200,
        },
      });

      if (i < plan.hops.length - 2) {
        const roll = rng.next();
        const wait = roll < 0.6 ? rng.int(55, 150) : roll < 0.92 ? rng.int(150, 330) : rng.int(600, 900);
        const layover = round5(wait);
        const nextDepartLocal = arriveLocalMin + layover;
        layovers.push({
          airport: refs[i + 1],
          durationMin: layover,
          overnight: dayDiff(formatLocal(arriveLocalMin), formatLocal(nextDepartLocal)) > 0 && layover >= 360,
        });
        departLocalMin = nextDepartLocal;
        departUtcMin = arriveUtcMin + layover;
      }
    }

    const first = segments[0];
    const last = segments[segments.length - 1];
    const startUtc = localMinutes(first.departLocal.slice(0, 10), +first.departLocal.slice(11, 13) * 60 + +first.departLocal.slice(14, 16)) -
      utcOffsetHours(ap(first.from.iata).countryCode, ap(first.from.iata).lng) * 60;
    const endUtc = localMinutes(last.arriveLocal.slice(0, 10), +last.arriveLocal.slice(11, 13) * 60 + +last.arriveLocal.slice(14, 16)) -
      utcOffsetHours(ap(last.to.iata).countryCode, ap(last.to.iata).lng) * 60;
    return {
      from: first.from,
      to: last.to,
      departLocal: first.departLocal,
      arriveLocal: last.arriveLocal,
      dayOffset: dayDiff(first.departLocal, last.arriveLocal),
      durationMin: endUtc - startUtc,
      stops: segments.length - 1,
      segments,
      layovers,
    };
  }

  /** One-way economy fare for a great-circle distance, before modifiers (USD). */
  function distanceFare(d: number) {
    return 30 + Math.min(d, 800) * 0.12 + Math.min(Math.max(d - 800, 0), 2200) * 0.075 + Math.max(d - 3000, 0) * 0.04;
  }

  function dateFactor(date: string) {
    const d = parseISO(date);
    const daysAhead = differenceInCalendarDays(d, ctx.now());
    const lead = daysAhead < 7 ? 1.55 : daysAhead < 21 ? 1.22 : daysAhead < 90 ? 1 : daysAhead < 180 ? 0.97 : 1.04;
    const weekday = [1.12, 0.98, 0.92, 0.93, 1.02, 1.12, 0.96][getDay(d)];
    const month = [0.9, 0.88, 0.95, 1.02, 1.0, 1.08, 1.2, 1.22, 1.0, 0.96, 0.9, 1.15][getMonth(d)];
    return lead * weekday * month;
  }

  function cabinFactor(cabin: Cabin, longHaul: boolean) {
    switch (cabin) {
      case "premium":
        return 1.7;
      case "business":
        return longHaul ? 3.6 : 2.2;
      case "first":
        return longHaul ? 6 : 2.6;
      default:
        return 1;
    }
  }

  function slicePrice(slice: Slice, date: string, cabin: Cabin, rng: Rng) {
    const d = haversineKm(ap(slice.from.iata), ap(slice.to.iata));
    const lowCost = slice.segments.every((s) => airlines.find((a) => a.code === s.carrier.code)?.model === "low-cost");
    let fare = distanceFare(d);
    fare *= lowCost ? 0.62 : 1;
    fare *= slice.stops === 0 ? (lowCost ? 1 : 1.04) : slice.stops === 1 ? 0.95 : 0.85;
    if (slice.layovers.some((l) => l.overnight)) fare *= 0.9;
    fare *= dateFactor(date);
    fare *= cabinFactor(cabin, d > 4000);
    fare *= rng.range(0.88, 1.18);
    return fare;
  }

  function baggageFor(carriers: AirlineRecord[], cabin: Cabin, longHaul: boolean): { baggage: Baggage; conditions: FareConditions } {
    const lowCost = carriers.every((c) => c.model === "low-cost");
    if (cabin === "business" || cabin === "first") {
      return {
        baggage: { personalItem: true, cabinBagKg: 10, checkedBags: 2, checkedBagKg: 32 },
        conditions: { brand: cabin === "first" ? "First" : "Business Flex", refundable: true, changeable: true },
      };
    }
    if (cabin === "premium") {
      return {
        baggage: { personalItem: true, cabinBagKg: 10, checkedBags: 2, checkedBagKg: 23 },
        conditions: { brand: "Premium Economy", refundable: false, changeable: true },
      };
    }
    if (lowCost) {
      return {
        baggage: { personalItem: true, cabinBagKg: null, checkedBags: 0, checkedBagKg: 20, cabinBagFeeUsd: 28, checkedBagFeeUsd: 45 },
        conditions: { brand: "Basic", refundable: false, changeable: true, changeFeeUsd: 60 },
      };
    }
    if (!longHaul) {
      return {
        baggage: { personalItem: true, cabinBagKg: 8, checkedBags: 0, checkedBagKg: 23, checkedBagFeeUsd: 45 },
        conditions: { brand: "Economy Light", refundable: false, changeable: false },
      };
    }
    return {
      baggage: { personalItem: true, cabinBagKg: 8, checkedBags: 1, checkedBagKg: 23 },
      conditions: { brand: "Economy Standard", refundable: false, changeable: true, changeFeeUsd: 75 },
    };
  }

  function encodeId(query: SearchQuery, key: string) {
    const payload = JSON.stringify({ q: searchQueryToParams(query).toString(), k: key });
    return `m1.${Buffer.from(payload, "utf8").toString("base64url")}`;
  }

  function decodeId(id: string): { q: string; k: string } | null {
    if (!id.startsWith("m1.")) return null;
    try {
      const parsed = JSON.parse(Buffer.from(id.slice(3), "base64url").toString("utf8"));
      return typeof parsed?.q === "string" && typeof parsed?.k === "string" ? parsed : null;
    } catch {
      return null;
    }
  }

  /** Airport pairs for one leg (multi-airport places expand, capped). */
  function airportPairs(fromId: string, toId: string): [string, string][] {
    const from = geo.resolvePlace(fromId);
    const to = geo.resolvePlace(toId);
    if (!from || !to || to.kind === "anywhere") return [];
    const origins = from.airports.slice(0, 3);
    const dests = to.airports.slice(0, 3);
    const pairs: [string, string][] = [];
    for (const o of origins) for (const d of dests) if (o !== d && dist(o, d) > 60) pairs.push([o, d]);
    return pairs.slice(0, 4);
  }

  type Candidate = { plan: RoutePlan; slice: Slice; rngSeed: string };

  function legCandidates(fromId: string, toId: string, date: string, cap: number): Candidate[] {
    const out: Candidate[] = [];
    for (const [o, d] of airportPairs(fromId, toId)) {
      const rng = createRng(`${o}-${d}-${date}`);
      for (const plan of planRoutes(o, d, rng)) {
        const departures = plan.hops.length === 2 ? rng.int(1, 3) : rng.int(1, 2);
        for (let k = 0; k < departures; k++) {
          const seed = `${plan.hops.join("")}-${plan.carriers.map((c) => c.code).join("")}-${date}-${k}`;
          out.push({ plan, slice: buildSlice(plan, date, createRng(seed)), rngSeed: seed });
        }
      }
    }
    // Interleave so capped results still mix airports/carriers.
    return out.sort((a, b) => hashString(a.rngSeed) - hashString(b.rngSeed)).slice(0, cap);
  }

  function makeOffer(query: SearchQuery, slices: Slice[], plans: RoutePlan[], dates: string[]): FlightOffer {
    const key = slices.map((s) => s.segments.map((seg) => `${seg.flightNumber.replace(" ", "")}@${seg.departLocal}`).join("+")).join("|");
    const rng = createRng(key);
    let perAdult = slices.reduce((sum, s, i) => sum + slicePrice(s, dates[i], query.cabin, rng), 0);
    if (query.trip === "return") perAdult *= 0.9;
    const segmentsCount = slices.reduce((n, s) => n + s.segments.length, 0);
    const base = Math.round(perAdult);
    const taxes = Math.round(22 + 12 * segmentsCount + base * 0.08);
    const perAdultUsd = base + taxes;
    const totalUsd = Math.round(perAdultUsd * query.adults + perAdultUsd * 0.75 * query.children + perAdultUsd * 0.1 * query.infants);

    const carrierRecords = [...new Map(plans.flatMap((p) => p.carriers).map((c) => [c.code, c])).values()];
    const longHaul = slices.some((s) => haversineKm(ap(s.from.iata), ap(s.to.iata)) > 4000);
    const { baggage, conditions } = baggageFor(carrierRecords, query.cabin, longHaul);
    const carriers: Carrier[] = [...new Map(slices.flatMap((s) => s.segments.map((seg) => [seg.carrier.code, seg.carrier] as const))).values()];

    return {
      id: encodeId(query, key),
      provider: "mock",
      searchQuery: searchQueryToParams(query).toString(),
      cabin: query.cabin,
      slices,
      carriers,
      baggage,
      conditions,
      price: { totalUsd, perAdultUsd, baseUsd: base, taxesUsd: taxes },
      passengers: { adults: query.adults, children: query.children, infants: query.infants },
      totalDurationMin: slices.reduce((n, s) => n + s.durationMin, 0),
      maxStops: Math.max(...slices.map((s) => s.stops)),
      quotedAt: ctx.now().toISOString(),
    };
  }

  function reversePlan(plan: RoutePlan): RoutePlan {
    return { hops: [...plan.hops].reverse(), carriers: [...plan.carriers].reverse() };
  }

  function runSearch(query: SearchQuery): FlightOffer[] {
    const offers: FlightOffer[] = [];
    if (query.trip === "multi") {
      const perLeg = query.legs.map((leg) => legCandidates(leg.from, leg.to, leg.date, 12));
      if (perLeg.some((c) => c.length === 0)) return [];
      const count = Math.max(...perLeg.map((c) => c.length));
      for (let i = 0; i < count; i++) {
        const picks = perLeg.map((c, legIndex) => c[(i + legIndex * 3) % c.length]);
        offers.push(makeOffer(query, picks.map((p) => p.slice), picks.map((p) => p.plan), query.legs.map((l) => l.date)));
      }
    } else {
      const leg = query.legs[0];
      for (const c of legCandidates(leg.from, leg.to, leg.date, 40)) {
        if (query.trip === "return" && query.returnDate) {
          const back = reversePlan(c.plan);
          const inbound = buildSlice(back, query.returnDate, createRng(`${c.rngSeed}-ret`));
          offers.push(makeOffer(query, [c.slice, inbound], [c.plan, back], [leg.date, query.returnDate]));
        } else {
          offers.push(makeOffer(query, [c.slice], [c.plan], [leg.date]));
        }
      }
    }
    const unique = [...new Map(offers.map((o) => [o.id, o])).values()];
    return unique.sort((a, b) => a.price.totalUsd - b.price.totalUsd);
  }

  return {
    name: "mock",

    async search(query) {
      return runSearch(query);
    },

    async getOffer(id) {
      const decoded = decodeId(id);
      if (!decoded) return null;
      const parsed = parseSearchParams(new URLSearchParams(decoded.q), ctx.now());
      if (!parsed.ok) return null;
      return runSearch(parsed.query).find((o) => o.id === id) ?? null;
    },

    async estimate(fromIata, toIata, date) {
      if (!geo.getAirport(fromIata) || !geo.getAirport(toIata) || fromIata === toIata) return null;
      const rng = createRng(`${fromIata}-${toIata}-${date}-est`);
      let best: PriceEstimate | null = null;
      for (const plan of planRoutes(fromIata, toIata, rng).slice(0, 5)) {
        const slice = buildSlice(plan, date, rng);
        const price = Math.round(slicePrice(slice, date, "economy", rng) * 1.08 + 22 + 12 * slice.segments.length);
        if (!best || price < best.priceUsd) {
          best = {
            fromIata,
            toIata,
            priceUsd: price,
            durationMin: slice.durationMin,
            stops: slice.stops,
            carrier: slice.segments[0].carrier,
          };
        }
      }
      return best;
    },
  };
}

