import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardFormRequest } from "@/lib/security/guard";
import { HONEYPOT_FIELD, isHoneypotFilled } from "@/lib/security/honeypot";
import { parseSearchParams } from "@/lib/search/query";

const createSchema = z.object({
  email: z.email().max(200),
  searchQuery: z.string().max(2000),
  routeLabel: z.string().max(120),
  maxPrice: z.number().int().positive().max(10_000_000).optional(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  [HONEYPOT_FIELD]: z.string().optional(),
});

/** POST /api/alerts: save a price alert for a search. */
export async function POST(req: Request) {
  const blocked = await guardFormRequest(req, "alerts", 10, 60 * 60 * 1000);
  if (blocked) return blocked;

  const body = createSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (isHoneypotFilled(body.data[HONEYPOT_FIELD])) return NextResponse.json({ ok: true, token: "ignored" });

  // Only store canonical, valid searches.
  const parsed = parseSearchParams(new URLSearchParams(body.data.searchQuery));
  if (!parsed.ok) return NextResponse.json({ error: "invalid_search" }, { status: 400 });

  const alert = await db.priceAlert.create({
    data: {
      email: body.data.email.toLowerCase(),
      searchQuery: body.data.searchQuery,
      routeLabel: body.data.routeLabel,
      maxPrice: body.data.maxPrice,
      currency: body.data.currency,
      unsubscribeToken: randomBytes(18).toString("base64url"),
    },
  });
  return NextResponse.json({ ok: true, token: alert.unsubscribeToken });
}

const deleteSchema = z.object({ token: z.string().min(10).max(64) });

/** DELETE /api/alerts: turn an alert off using its token. */
export async function DELETE(req: Request) {
  const blocked = await guardFormRequest(req, "alerts-off", 30, 60 * 60 * 1000);
  if (blocked) return blocked;
  const body = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await db.priceAlert.updateMany({
    where: { unsubscribeToken: body.data.token, cancelledAt: null },
    data: { cancelledAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
