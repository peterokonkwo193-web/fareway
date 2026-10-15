import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/booking/status-badge";
import { expiringSoon as loadExpiringSoon, statusCounts } from "@/lib/admin/bookings";
import { requireAdmin } from "@/lib/admin/require-admin";
import { BOOKING_STATUSES, isBookingStatus } from "@/lib/booking/status";
import { formatMoney } from "@/lib/currency/format";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Dashboard" };

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  CONTACTED: "Contacted",
  AWAITING_PAYMENT: "Awaiting payment",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export default async function AdminDashboard() {
  await requireAdmin();
  const [counts, expiringSoon, recent, deletionOpen] = await Promise.all([
    statusCounts(),
    loadExpiringSoon(12, 5),
    db.bookingRequest.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.dataDeletionRequest.count({ where: { status: "RECEIVED" } }),
  ]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">{total} booking requests in total.</p>
      </div>

      <section aria-labelledby="counts-title">
        <h2 id="counts-title" className="sr-only">
          Requests by status
        </h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {BOOKING_STATUSES.map((s) => (
            <li key={s}>
              <Link href={`/admin/bookings?status=${s}`} className="card-surface block p-4 hover:shadow-raised">
                <p className="text-sm text-muted-foreground">{statusLabel[s]}</p>
                <p className="mt-1 text-3xl font-bold tnum">{counts[s]}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {deletionOpen > 0 && (
        <Link href="/admin/deletion-requests" className="flex items-center justify-between rounded-xl border border-warning bg-warning-soft p-4 text-sm font-semibold">
          {deletionOpen} data deletion {deletionOpen === 1 ? "request needs" : "requests need"} action
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="expiring-title" className="card-surface p-4 sm:p-5">
          <h2 id="expiring-title" className="mb-3 font-semibold">
            Pending, expiring within 12 hours
          </h2>
          {expiringSoon.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing is about to expire.</p>
          ) : (
            <ul className="divide-y divide-border">
              {expiringSoon.map((b) => (
                <li key={b.id}>
                  <Link href={`/admin/bookings/${b.reference}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:underline">
                    <span className="font-mono font-semibold">{b.reference}</span>
                    <span className="truncate">{b.contactName}</span>
                    <span className="text-warning">expires in {formatDistanceToNowStrict(b.expiresAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="recent-title" className="card-surface p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="recent-title" className="font-semibold">
              Latest requests
            </h2>
            <Link href="/admin/bookings" className="text-sm font-semibold text-link hover:underline">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((b) => (
                <li key={b.id}>
                  <Link href={`/admin/bookings/${b.reference}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-2.5 text-sm hover:bg-muted/50">
                    <span className="font-mono font-semibold">{b.reference}</span>
                    <span className="truncate">
                      {b.originCode} → {b.destinationCode} · {formatMoney(b.quotedPrice, b.currency)}
                    </span>
                    {isBookingStatus(b.status) && <StatusBadge status={b.status} className="text-xs" />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
