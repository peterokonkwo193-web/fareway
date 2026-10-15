import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { StatusBadge } from "@/components/booking/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { destinationCountries, listBookings, parseAdminFilters, toQueryString, type AdminSort } from "@/lib/admin/bookings";
import { requireAdmin } from "@/lib/admin/require-admin";
import { BOOKING_STATUSES, isBookingStatus } from "@/lib/booking/status";
import { formatMoney } from "@/lib/currency/format";
import { geo } from "@/lib/geo/data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Booking requests" };

const selectClass = "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm";
const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  CONTACTED: "Contacted",
  AWAITING_PAYMENT: "Awaiting payment",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const filters = parseAdminFilters(await searchParams);
  const [{ rows, total, pages }, countryCodes] = await Promise.all([listBookings(filters), destinationCountries()]);

  const sortHeader = (label: string, asc: AdminSort, desc: AdminSort) => {
    const active = filters.sort === asc || filters.sort === desc;
    const next = filters.sort === desc ? asc : desc;
    return (
      <th scope="col" aria-sort={filters.sort === asc ? "ascending" : filters.sort === desc ? "descending" : "none"} className="px-3 py-3 text-left font-semibold">
        <Link href={`/admin/bookings${toQueryString(filters, { sort: next, page: 1 })}`} className="inline-flex items-center gap-1 hover:text-primary">
          {label}
          {active && (filters.sort === asc ? <ArrowUp className="size-3.5" aria-hidden="true" /> : <ArrowDown className="size-3.5" aria-hidden="true" />)}
        </Link>
      </th>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Booking requests</h1>
          <p className="text-muted-foreground">{total} matching</p>
        </div>
        <a href={`/api/admin/export${toQueryString(filters, { page: undefined })}`} className={buttonVariants({ variant: "outline", size: "lg" })}>
          <Download className="size-4" aria-hidden="true" />
          Export CSV
        </a>
      </div>

      <form method="GET" className="card-surface grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6" role="search" aria-label="Filter requests">
        <div className="space-y-1 lg:col-span-2">
          <Label htmlFor="q">Search</Label>
          <Input id="q" name="q" defaultValue={filters.q} placeholder="Reference, name, email, phone, airport" className="h-10" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" defaultValue={filters.status ?? ""} className={selectClass}>
            <option value="">All statuses</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="country">Destination country</Label>
          <select id="country" name="country" defaultValue={filters.country ?? ""} className={selectClass}>
            <option value="">All countries</option>
            {countryCodes.map((c) => (
              <option key={c} value={c}>
                {geo.getCountry(c)?.name ?? c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="from">Created from</Label>
          <Input id="from" name="from" type="date" defaultValue={filters.from} className="h-10" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="to">Created to</Label>
          <Input id="to" name="to" type="date" defaultValue={filters.to} className="h-10" />
        </div>
        <input type="hidden" name="sort" value={filters.sort} />
        <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
          <Button type="submit" variant="brand" size="lg">
            <Search className="size-4" aria-hidden="true" />
            Apply
          </Button>
          <Link href="/admin/bookings" className={buttonVariants({ variant: "ghost", size: "lg" })}>
            Clear
          </Link>
        </div>
      </form>

      <div className="card-surface overflow-x-auto">
        <table className="w-full min-w-[56rem] text-sm">
          <caption className="sr-only">Booking requests, {filters.sort.replace("_", " ")}</caption>
          <thead className="border-b border-border bg-muted/60 text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-3 text-left font-semibold">Reference</th>
              <th scope="col" className="px-3 py-3 text-left font-semibold">Status</th>
              <th scope="col" className="px-3 py-3 text-left font-semibold">Customer</th>
              <th scope="col" className="px-3 py-3 text-left font-semibold">Route</th>
              {sortHeader("Departs", "depart_asc", "depart_desc")}
              {sortHeader("Quoted", "price_asc", "price_desc")}
              {sortHeader("Created", "created_asc", "created_desc")}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                  No requests match these filters.
                </td>
              </tr>
            )}
            {rows.map((b) => (
              <tr key={b.id} className="hover:bg-muted/40">
                <td className="px-3 py-3">
                  <Link href={`/admin/bookings/${b.reference}`} className="font-mono font-semibold text-link hover:underline">
                    {b.reference}
                  </Link>
                </td>
                <td className="px-3 py-3">{isBookingStatus(b.status) && <StatusBadge status={b.status} className="text-xs" />}</td>
                <td className="px-3 py-3">
                  <p className="font-medium">{b.contactName}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.contactEmail} · {b._count.passengers} pax
                  </p>
                </td>
                <td className="px-3 py-3 tnum">
                  {b.originCode} → {b.destinationCode}
                  <span className="ml-1 text-xs text-muted-foreground">{geo.getCountry(b.destCountryCode)?.flag}</span>
                </td>
                <td className="px-3 py-3 tnum">{format(b.departDate, "d MMM yyyy")}</td>
                <td className="px-3 py-3 font-semibold tnum">{formatMoney(b.quotedPrice, b.currency)}</td>
                <td className="px-3 py-3 text-muted-foreground tnum">{format(b.createdAt, "d MMM, HH:mm")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between">
          <Link
            aria-disabled={filters.page <= 1}
            href={`/admin/bookings${toQueryString(filters, { page: Math.max(1, filters.page - 1) })}`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), filters.page <= 1 && "pointer-events-none opacity-50")}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Previous
          </Link>
          <p className="text-sm text-muted-foreground">
            Page {filters.page} of {pages}
          </p>
          <Link
            aria-disabled={filters.page >= pages}
            href={`/admin/bookings${toQueryString(filters, { page: Math.min(pages, filters.page + 1) })}`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), filters.page >= pages && "pointer-events-none opacity-50")}
          >
            Next
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </nav>
      )}
    </div>
  );
}
