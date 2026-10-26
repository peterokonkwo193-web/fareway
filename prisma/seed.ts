/**
 * Demo data for the admin area: booking requests in every status.
 *   npm run db:seed
 * Safe to re-run: previous demo rows (emails ending @demo.fareway.test) are replaced.
 */
import "dotenv/config";
import { addDays, addHours, subDays, subHours } from "date-fns";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import countries from "../data/countries.json";
import airports from "../data/airports.json";
import metros from "../data/metro-codes.json";
import airlines from "../data/airlines.json";
import { createGeoIndex } from "../src/lib/geo/geo-index";
import type { Airport, Country, MetroCode } from "../src/lib/geo/types";
import { createMockProvider, type AirlineRecord } from "../src/lib/flights/mock-provider";
import { generateReference } from "../src/lib/booking/reference";
import type { BookingStatus } from "../src/lib/booking/status";
import { toIsoDate } from "../src/lib/search/query";

const url = (process.env.DATABASE_URL ?? "file:./prisma/dev.db").replace(/^file:/, "");
const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
const geo = createGeoIndex({ countries: countries as Country[], airports: airports as Airport[], metros: metros as MetroCode[] });
const provider = createMockProvider({ geo, airlines: airlines as AirlineRecord[] });

const DEMO_DOMAIN = "demo.fareway.test";

const samples: {
  name: string;
  phone: string;
  dial: string;
  from: string;
  to: string;
  inDays: number;
  ret?: number;
  status: BookingStatus;
  createdHoursAgo: number;
  pax: { type: "ADULT" | "CHILD" | "INFANT"; first: string; last: string; dob: string; nat: string }[];
  notes?: string;
  internal?: string;
}[] = [
  { name: "Amara Okafor", phone: "+2348031234567", dial: "+234", from: "LOS", to: "city:LON", inDays: 30, ret: 14, status: "PENDING", createdHoursAgo: 2, pax: [{ type: "ADULT", first: "Amara", last: "Okafor", dob: "1990-04-12", nat: "NG" }], notes: "Window seat if possible." },
  { name: "Luis Fernández García", phone: "+34612345678", dial: "+34", from: "MAD", to: "country:MX", inDays: 45, ret: 21, status: "PENDING", createdHoursAgo: 40, pax: [{ type: "ADULT", first: "Luis", last: "Fernández García", dob: "1982-09-30", nat: "ES" }, { type: "ADULT", first: "Elena", last: "Ruiz", dob: "1985-02-14", nat: "ES" }, { type: "CHILD", first: "Mateo", last: "Fernández Ruiz", dob: "2018-06-01", nat: "ES" }] },
  { name: "Priya Raman", phone: "+919812345678", dial: "+91", from: "DEL", to: "SIN", inDays: 12, status: "CONTACTED", createdHoursAgo: 20, pax: [{ type: "ADULT", first: "Priya", last: "Raman", dob: "1994-11-03", nat: "IN" }], internal: "Called at 10:15, customer comparing two dates. Follow up tomorrow." },
  { name: "Kenji Watanabe", phone: "+819012345678", dial: "+81", from: "city:TYO", to: "city:NYC", inDays: 60, ret: 10, status: "AWAITING_PAYMENT", createdHoursAgo: 30, pax: [{ type: "ADULT", first: "Kenji", last: "Watanabe", dob: "1978-01-22", nat: "JP" }], internal: "Price confirmed by email. Bank transfer details sent." },
  { name: "Sofia Rossi", phone: "+393471234567", dial: "+39", from: "FCO", to: "country:KE", inDays: 90, ret: 12, status: "CONFIRMED", createdHoursAgo: 72, pax: [{ type: "ADULT", first: "Sofia", last: "Rossi", dob: "1988-07-07", nat: "IT" }, { type: "INFANT", first: "Giulia", last: "Rossi", dob: "2025-12-01", nat: "IT" }], internal: "Paid in full. E-ticket issued." },
  { name: "Ahmed Hassan", phone: "+201001234567", dial: "+20", from: "CAI", to: "DXB", inDays: 20, status: "CANCELLED", createdHoursAgo: 96, pax: [{ type: "ADULT", first: "Ahmed", last: "Hassan", dob: "1975-03-18", nat: "EG" }], internal: "Customer changed plans." },
  { name: "Mele Tupou", phone: "+6767712345", dial: "+676", from: "TBU", to: "AKL", inDays: 25, ret: 7, status: "EXPIRED", createdHoursAgo: 80, pax: [{ type: "ADULT", first: "Mele", last: "Tupou", dob: "1999-10-10", nat: "TO" }] },
  { name: "Lucas Silva", phone: "+5511912345678", dial: "+55", from: "GRU", to: "LIS", inDays: 50, ret: 15, status: "PENDING", createdHoursAgo: 45, pax: [{ type: "ADULT", first: "Lucas", last: "Silva", dob: "1992-05-25", nat: "BR" }] },
];

async function main() {
  const removed = await db.bookingRequest.deleteMany({ where: { contactEmail: { endsWith: `@${DEMO_DOMAIN}` } } });
  let created = 0;
  for (const s of samples) {
    const depart = toIsoDate(addDays(new Date(), s.inDays));
    const query = {
      trip: s.ret ? ("return" as const) : ("oneway" as const),
      legs: [{ from: s.from, to: s.to, date: depart }],
      returnDate: s.ret ? toIsoDate(addDays(new Date(), s.inDays + s.ret)) : undefined,
      adults: s.pax.filter((p) => p.type === "ADULT").length,
      children: s.pax.filter((p) => p.type === "CHILD").length,
      infants: s.pax.filter((p) => p.type === "INFANT").length,
      cabin: "economy" as const,
    };
    const [offer] = await provider.search(query);
    if (!offer) {
      console.warn(`No offer for ${s.from} -> ${s.to}, skipped`);
      continue;
    }
    const createdAt = subHours(new Date(), s.createdHoursAgo);
    const first = offer.slices[0];
    const last = offer.slices[offer.slices.length - 1];
    const dest = s.ret ? first.to : last.to;
    const history: { from: string; to: string; changedBy: string; createdAt: Date }[] = [
      { from: "NEW", to: "PENDING", changedBy: "customer", createdAt },
    ];
    if (s.status !== "PENDING") {
      history.push({ from: "PENDING", to: s.status, changedBy: s.status === "EXPIRED" ? "system" : "admin@example.com", createdAt: addHours(createdAt, 3) });
    }
    await db.bookingRequest.create({
      data: {
        reference: generateReference(createdAt),
        status: s.status,
        contactName: s.name,
        contactEmail: `${s.name.split(" ")[0].toLowerCase()}@${DEMO_DOMAIN}`,
        contactPhone: s.phone,
        contactDialCode: s.dial,
        notes: s.notes ?? null,
        flightSnapshot: JSON.stringify(offer),
        originCode: first.from.iata,
        destinationCode: dest.iata,
        destCountryCode: dest.countryCode,
        departDate: new Date(`${depart}T00:00:00Z`),
        quotedPrice: offer.price.totalUsd,
        currency: "USD",
        quotedPriceUsd: offer.price.totalUsd,
        createdAt,
        expiresAt: s.status === "EXPIRED" ? subDays(new Date(), 1) : addHours(createdAt, 48),
        passengers: {
          create: s.pax.map((p, position) => ({
            type: p.type,
            firstName: p.first,
            lastName: p.last,
            dateOfBirth: new Date(`${p.dob}T00:00:00Z`),
            nationality: p.nat,
            position,
          })),
        },
        statusHistory: { create: history },
        internalNotes: s.internal ? { create: { body: s.internal, author: "admin@example.com", createdAt: addHours(createdAt, 3) } } : undefined,
      },
    });
    created++;
  }
  console.log(`Seeded ${created} demo booking requests (replaced ${removed.count}).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
