import { NextResponse } from "next/server";
import { z } from "zod";
import { grantBookingAccess } from "@/lib/booking/access";
import { lookupBooking } from "@/lib/booking/service";
import { guardFormRequest } from "@/lib/security/guard";

const schema = z.object({ reference: z.string().min(5).max(40), email: z.email().max(200) });

/** POST /api/bookings/lookup: reference + email -> access to the booking page. */
export async function POST(req: Request) {
  const blocked = await guardFormRequest(req, "lookup", 10, 15 * 60 * 1000);
  if (blocked) return blocked;
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const booking = await lookupBooking(body.data.reference, body.data.email);
  if (!booking) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await grantBookingAccess(booking.reference);
  return NextResponse.json({ reference: booking.reference });
}
