import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { expireStaleBookings } from "@/lib/booking/service";
import { BOOKING_STATUSES } from "@/lib/booking/status";

export const ADMIN_SORTS = ["created_desc", "created_asc", "depart_asc", "depart_desc", "price_desc", "price_asc"] as const;
export type AdminSort = (typeof ADMIN_SORTS)[number];
export const PAGE_SIZE = 25;

const filterSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  status: z.enum(BOOKING_STATUSES).optional().catch(undefined),
  country: z.string().regex(/^[A-Z]{2}$/).optional().catch(undefined),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  sort: z.enum(ADMIN_SORTS).default("created_desc").catch("created_desc"),
  page: z.coerce.number().int().min(1).max(10_000).default(1).catch(1),
});

export type AdminFilters = z.infer<typeof filterSchema>;

export function parseAdminFilters(raw: Record<string, string | string[] | undefined>): AdminFilters {
  const flat = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v || undefined]));
  return filterSchema.parse(flat);
}

function whereFor(f: AdminFilters): Prisma.BookingRequestWhereInput {
  const where: Prisma.BookingRequestWhereInput = {};
  if (f.status) where.status = f.status;
  if (f.country) where.destCountryCode = f.country;
  if (f.from || f.to) {
    where.createdAt = {
      ...(f.from ? { gte: new Date(`${f.from}T00:00:00Z`) } : {}),
      ...(f.to ? { lt: new Date(new Date(`${f.to}T00:00:00Z`).getTime() + 86_400_000) } : {}),
    };
  }
  if (f.q) {
    const q = f.q;
    where.OR = [
      { reference: { contains: q.toUpperCase() } },
      { contactName: { contains: q } },
      { contactEmail: { contains: q.toLowerCase() } },
      { contactPhone: { contains: q.replace(/[^\d+]/g, "") || q } },
      { destinationCode: { equals: q.toUpperCase() } },
      { originCode: { equals: q.toUpperCase() } },
    ];
  }
  return where;
}

function orderFor(sort: AdminSort): Prisma.BookingRequestOrderByWithRelationInput {
  switch (sort) {
    case "created_asc":
      return { createdAt: "asc" };
    case "depart_asc":
      return { departDate: "asc" };
    case "depart_desc":
      return { departDate: "desc" };
    case "price_desc":
      return { quotedPriceUsd: "desc" };
    case "price_asc":
      return { quotedPriceUsd: "asc" };
    default:
      return { createdAt: "desc" };
  }
}

export async function listBookings(f: AdminFilters) {
  await expireStaleBookings();
  const where = whereFor(f);
  const [total, rows] = await Promise.all([
    db.bookingRequest.count({ where }),
    db.bookingRequest.findMany({
      where,
      orderBy: orderFor(f.sort),
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { passengers: true } } },
    }),
  ]);
  return { total, rows, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** All matching rows (for CSV export), capped. */
export async function exportBookings(f: AdminFilters, cap = 10_000) {
  return db.bookingRequest.findMany({
    where: whereFor(f),
    orderBy: orderFor(f.sort),
    take: cap,
    include: { passengers: { orderBy: { position: "asc" } } },
  });
}

export async function statusCounts() {
  await expireStaleBookings();
  const groups = await db.bookingRequest.groupBy({ by: ["status"], _count: { _all: true } });
  const counts = Object.fromEntries(BOOKING_STATUSES.map((s) => [s, 0])) as Record<(typeof BOOKING_STATUSES)[number], number>;
  for (const g of groups) if (g.status in counts) counts[g.status as keyof typeof counts] = g._count._all;
  return counts;
}

export async function destinationCountries() {
  const rows = await db.bookingRequest.findMany({ distinct: ["destCountryCode"], select: { destCountryCode: true } });
  return rows.map((r) => r.destCountryCode).sort();
}

export function toQueryString(f: Partial<AdminFilters>, overrides: Partial<Record<keyof AdminFilters, string | number | undefined>> = {}) {
  const merged = { ...f, ...overrides } as Record<string, string | number | undefined>;
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v === undefined || v === "" || (k === "page" && v === 1) || (k === "sort" && v === "created_desc")) continue;
    p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Pending requests that expire within the next `hours`. */
export function expiringSoon(hours = 12, take = 5) {
  return db.bookingRequest.findMany({
    where: { status: "PENDING", expiresAt: { lte: new Date(Date.now() + hours * 3600 * 1000) } },
    orderBy: { expiresAt: "asc" },
    take,
  });
}
