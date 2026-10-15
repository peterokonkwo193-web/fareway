import { format } from "date-fns";
import { NextResponse, type NextRequest } from "next/server";
import { exportBookings, parseAdminFilters } from "@/lib/admin/bookings";
import { toCsv } from "@/lib/admin/csv";
import { getAdmin } from "@/lib/admin/require-admin";

/** GET /api/admin/export?<same filters as the table> -> CSV download. Admin only. */
export async function GET(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const filters = parseAdminFilters(Object.fromEntries(req.nextUrl.searchParams));
  const rows = await exportBookings(filters);
  const csv = toCsv(
    [
      "Reference",
      "Status",
      "Created (UTC)",
      "Expires (UTC)",
      "Contact name",
      "Email",
      "Phone",
      "Origin",
      "Destination",
      "Destination country",
      "Departure date",
      "Quoted price",
      "Currency",
      "Quoted price USD",
      "Passengers",
      "Customer notes",
    ],
    rows.map((b) => [
      b.reference,
      b.status,
      format(b.createdAt, "yyyy-MM-dd HH:mm"),
      format(b.expiresAt, "yyyy-MM-dd HH:mm"),
      b.contactName,
      b.contactEmail,
      b.contactPhone,
      b.originCode,
      b.destinationCode,
      b.destCountryCode,
      b.departDate.toISOString().slice(0, 10),
      b.quotedPrice,
      b.currency,
      b.quotedPriceUsd,
      b.passengers.map((p) => `${p.firstName} ${p.lastName} (${p.type.toLowerCase()}, ${p.nationality})`).join("; "),
      b.notes ?? "",
    ]),
  );
  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fareway-requests-${format(new Date(), "yyyyMMdd-HHmm")}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
