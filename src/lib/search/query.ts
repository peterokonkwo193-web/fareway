import { addDays, differenceInCalendarDays, format, isValid, parseISO } from "date-fns";
import { z } from "zod";

/**
 * Flight search query shared by the widget, the URL and the API.
 *
 * URL format (all values are plain strings so links are shareable):
 *   /flights?trip=return&from=LHR&to=city:NYC&depart=2026-11-12&return=2026-11-19
 *           &adults=1&children=0&infants=0&cabin=economy
 *   /flights?trip=multi&leg=LHR,JFK,2026-11-12&leg=JFK,LAX,2026-11-16&adults=2...
 * Place ids are described in src/lib/geo/types.ts.
 */

export const TRIP_TYPES = ["return", "oneway", "multi"] as const;
export const CABINS = ["economy", "premium", "business", "first"] as const;
export type TripType = (typeof TRIP_TYPES)[number];
export type Cabin = (typeof CABINS)[number];

export const MAX_PASSENGERS = 9;
export const MAX_LEGS = 5;
export const MAX_DAYS_AHEAD = 360;

export type SearchLeg = { from: string; to: string; date: string };

export type SearchQuery = {
  trip: TripType;
  legs: SearchLeg[];
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  cabin: Cabin;
};

export const placeIdSchema = z
  .string()
  .regex(/^([A-Z]{3}|anywhere|country:[A-Z]{2}|city:[A-Z]{3}|city:[A-Z]{2}-[a-z0-9-]+)$/, "Choose a place from the list");

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date")
  .refine((s) => isValid(parseISO(s)), "Choose a valid date");

export const toIsoDate = (d: Date) => format(d, "yyyy-MM-dd");

export function buildSearchSchema(today: Date = new Date()) {
  // Allow "yesterday" to tolerate time-zone differences between browser and server.
  const earliest = addDays(today, -1);
  const latest = addDays(today, MAX_DAYS_AHEAD);
  const inWindow = (s: string) => {
    const d = parseISO(s);
    return differenceInCalendarDays(d, earliest) >= 0 && differenceInCalendarDays(latest, d) >= 0;
  };

  return z
    .object({
      trip: z.enum(TRIP_TYPES),
      legs: z
        .array(z.object({ from: placeIdSchema, to: placeIdSchema, date: dateSchema.refine(inWindow, "Date is outside the bookable window") }))
        .min(1)
        .max(MAX_LEGS),
      returnDate: dateSchema.refine(inWindow, "Date is outside the bookable window").optional(),
      adults: z.coerce.number().int().min(1).max(MAX_PASSENGERS),
      children: z.coerce.number().int().min(0).max(MAX_PASSENGERS - 1),
      infants: z.coerce.number().int().min(0).max(MAX_PASSENGERS - 1),
      cabin: z.enum(CABINS),
    })
    .superRefine((q, ctx) => {
      if (q.adults + q.children + q.infants > MAX_PASSENGERS) {
        ctx.addIssue({ code: "custom", path: ["adults"], message: `Up to ${MAX_PASSENGERS} travellers per request` });
      }
      if (q.infants > q.adults) {
        ctx.addIssue({ code: "custom", path: ["infants"], message: "Each infant must travel with an adult" });
      }
      q.legs.forEach((leg, i) => {
        if (leg.from === "anywhere") ctx.addIssue({ code: "custom", path: ["legs", i, "from"], message: "Choose where you are flying from" });
        if (leg.from === leg.to) ctx.addIssue({ code: "custom", path: ["legs", i, "to"], message: "Origin and destination must differ" });
        if (i > 0 && leg.date < q.legs[i - 1].date) {
          ctx.addIssue({ code: "custom", path: ["legs", i, "date"], message: "Flights must be in date order" });
        }
        if (q.trip === "multi" && leg.to === "anywhere") {
          ctx.addIssue({ code: "custom", path: ["legs", i, "to"], message: "Choose a destination" });
        }
      });
      if (q.trip === "return") {
        if (!q.returnDate) ctx.addIssue({ code: "custom", path: ["returnDate"], message: "Choose a return date" });
        else if (q.returnDate < q.legs[0].date) {
          ctx.addIssue({ code: "custom", path: ["returnDate"], message: "Return must be after departure" });
        }
      }
      if (q.trip !== "multi" && q.legs.length !== 1) {
        ctx.addIssue({ code: "custom", path: ["legs"], message: "Only one outbound flight expected" });
      }
      if (q.trip === "multi" && q.legs.length < 2) {
        ctx.addIssue({ code: "custom", path: ["legs"], message: "Add at least two flights" });
      }
    });
}

type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

function getAll(src: ParamSource, key: string): string[] {
  if (src instanceof URLSearchParams) return src.getAll(key);
  const v = src[key];
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
}
const getOne = (src: ParamSource, key: string) => getAll(src, key)[0];

/** Reads raw (unvalidated) values from URL params. */
export function readSearchParams(src: ParamSource) {
  const trip = (getOne(src, "trip") ?? "return") as TripType;
  const legs =
    trip === "multi"
      ? getAll(src, "leg").map((raw) => {
          const [from = "", to = "", date = ""] = raw.split(",");
          return { from, to, date };
        })
      : [{ from: getOne(src, "from") ?? "", to: getOne(src, "to") ?? "", date: getOne(src, "depart") ?? "" }];
  return {
    trip,
    legs,
    returnDate: trip === "return" ? getOne(src, "return") : undefined,
    adults: getOne(src, "adults") ?? "1",
    children: getOne(src, "children") ?? "0",
    infants: getOne(src, "infants") ?? "0",
    cabin: getOne(src, "cabin") ?? "economy",
  };
}

export type ParseResult = { ok: true; query: SearchQuery } | { ok: false; errors: Record<string, string> };

export function parseSearchQuery(input: unknown, today?: Date): ParseResult {
  const result = buildSearchSchema(today).safeParse(input);
  if (result.success) return { ok: true, query: result.data };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".");
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

export function parseSearchParams(src: ParamSource, today?: Date): ParseResult {
  return parseSearchQuery(readSearchParams(src), today);
}

export function searchQueryToParams(q: SearchQuery): URLSearchParams {
  const p = new URLSearchParams();
  p.set("trip", q.trip);
  if (q.trip === "multi") {
    for (const leg of q.legs) p.append("leg", `${leg.from},${leg.to},${leg.date}`);
  } else {
    p.set("from", q.legs[0].from);
    p.set("to", q.legs[0].to);
    p.set("depart", q.legs[0].date);
    if (q.trip === "return" && q.returnDate) p.set("return", q.returnDate);
  }
  p.set("adults", String(q.adults));
  p.set("children", String(q.children));
  p.set("infants", String(q.infants));
  p.set("cabin", q.cabin);
  return p;
}

export const cabinLabels: Record<Cabin, string> = {
  economy: "Economy",
  premium: "Premium economy",
  business: "Business",
  first: "First",
};

export function travellerCount(q: Pick<SearchQuery, "adults" | "children" | "infants">) {
  return q.adults + q.children + q.infants;
}
