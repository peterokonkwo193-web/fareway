import { NextResponse } from "next/server";
import { expireStaleBookings } from "@/lib/booking/service";
import { serverEnv } from "@/lib/env";

/**
 * GET /api/cron/expire: marks Pending requests older than 48 hours as Expired.
 * Scheduled daily by vercel.json (Hobby plan limit; use hourly on Pro); Vercel sends `Authorization: Bearer $CRON_SECRET`.
 * Requests are also expired lazily whenever they are read.
 */
export async function GET(req: Request) {
  const secret = serverEnv().CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const expired = await expireStaleBookings();
  return NextResponse.json({ expired });
}
