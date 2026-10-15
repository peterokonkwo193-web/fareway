import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, formatDistanceToNowStrict } from "date-fns";
import { ArrowLeft, Mail, MessageCircle, Phone, StickyNote } from "lucide-react";
import { JourneyTimeline } from "@/components/flight/journey-timeline";
import { StatusBadge } from "@/components/booking/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addNoteAction, changeStatusAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin/require-admin";
import { parseSnapshot } from "@/lib/booking/service";
import { ALLOWED_TRANSITIONS, isBookingStatus, isStale } from "@/lib/booking/status";
import { formatMoney } from "@/lib/currency/format";
import { db } from "@/lib/db";
import { geo } from "@/lib/geo/data";

export const metadata: Metadata = { title: "Request detail" };

const statusLabel: Record<string, string> = {
  NEW: "New",
  PENDING: "Pending",
  CONTACTED: "Contacted",
  AWAITING_PAYMENT: "Awaiting payment",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export default async function AdminBookingDetail({ params }: { params: Promise<{ reference: string }> }) {
  await requireAdmin();
  const { reference } = await params;
  let booking = await db.bookingRequest.findUnique({
    where: { reference: decodeURIComponent(reference).toUpperCase() },
    include: {
      passengers: { orderBy: { position: "asc" } },
      internalNotes: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!booking) notFound();
  if (isStale(booking.status, booking.expiresAt)) {
    await db.bookingRequest.update({
      where: { id: booking.id },
      data: { status: "EXPIRED", statusHistory: { create: { from: "PENDING", to: "EXPIRED", changedBy: "system" } } },
    });
    booking = (await db.bookingRequest.findUnique({
      where: { id: booking.id },
      include: {
        passengers: { orderBy: { position: "asc" } },
        internalNotes: { orderBy: { createdAt: "desc" } },
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    }))!;
  }

  const offer = parseSnapshot(booking.flightSnapshot);
  const status = isBookingStatus(booking.status) ? booking.status : "PENDING";
  const transitions = ALLOWED_TRANSITIONS[status];
  const phoneDigits = booking.contactPhone.replace(/\D/g, "");
  const isReturn = offer.slices.length === 2 && offer.slices[0].from.iata === offer.slices[1].to.iata;

  return (
    <div className="space-y-6">
      <Link href="/admin/bookings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-link hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        All requests
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold">{booking.reference}</h1>
          <p className="text-sm text-muted-foreground">
            Created {format(booking.createdAt, "d MMM yyyy, HH:mm")} ·{" "}
            {status === "PENDING" ? `expires in ${formatDistanceToNowStrict(booking.expiresAt)}` : `expiry ${format(booking.expiresAt, "d MMM, HH:mm")}`}
          </p>
        </div>
        <div className="text-right">
          <StatusBadge status={status} />
          <p className="mt-2 text-2xl font-bold text-price tnum">{formatMoney(booking.quotedPrice, booking.currency)}</p>
          <p className="text-xs text-muted-foreground">
            quoted ({formatMoney(booking.quotedPriceUsd, "USD")}) at {format(new Date(offer.quotedAt), "d MMM, HH:mm")}
          </p>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <section aria-labelledby="contact-title" className="card-surface p-4 sm:p-5">
            <h2 id="contact-title" className="mb-3 font-semibold">
              Contact
            </h2>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[8rem_1fr]">
              <dt className="text-muted-foreground">Name on passport</dt>
              <dd className="font-medium">{booking.contactName}</dd>
              <dt className="text-muted-foreground">Email</dt>
              <dd>{booking.contactEmail}</dd>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="tnum">{booking.contactPhone}</dd>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="outline" size="lg">
                <a href={`tel:${booking.contactPhone}`}>
                  <Phone className="size-4" aria-hidden="true" />
                  Call
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={`https://wa.me/${phoneDigits}?text=${encodeURIComponent(`Hello ${booking.contactName}, this is Fareway customer care about your request ${booking.reference}.`)}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" aria-hidden="true" />
                  WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={`mailto:${booking.contactEmail}?subject=${encodeURIComponent(`Your Fareway request ${booking.reference}`)}`}>
                  <Mail className="size-4" aria-hidden="true" />
                  Email
                </a>
              </Button>
            </div>
            {booking.notes && (
              <div className="mt-4 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
                <p className="mb-1 font-semibold">Customer notes</p>
                <p className="whitespace-pre-wrap">{booking.notes}</p>
              </div>
            )}
          </section>

          <section aria-labelledby="pax-title" className="card-surface overflow-x-auto p-4 sm:p-5">
            <h2 id="pax-title" className="mb-3 font-semibold">
              Passengers ({booking.passengers.length})
            </h2>
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-semibold">Name</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Type</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Date of birth</th>
                  <th scope="col" className="py-2 font-semibold">Nationality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {booking.passengers.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-3 font-medium">
                      {p.firstName} {p.lastName}
                    </td>
                    <td className="py-2 pr-3 capitalize">{p.type.toLowerCase()}</td>
                    <td className="py-2 pr-3 tnum">{format(p.dateOfBirth, "d MMM yyyy")}</td>
                    <td className="py-2">
                      {geo.getCountry(p.nationality)?.flag} {geo.getCountry(p.nationality)?.name ?? p.nationality}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section aria-label="Flight snapshot" className="space-y-4">
            <h2 className="font-semibold">
              Flight snapshot · {offer.carriers.map((c) => c.name).join(", ")} · {offer.conditions.brand}
            </h2>
            {offer.slices.map((s, i) => (
              <JourneyTimeline key={i} slice={s} title={isReturn ? (i === 0 ? "Outbound" : "Return") : `Flight ${i + 1}`} icon={isReturn && i === 1 ? "back" : "out"} />
            ))}
          </section>
        </div>

        <aside className="space-y-6">
          <section aria-labelledby="status-title" className="card-surface p-4 sm:p-5">
            <h2 id="status-title" className="mb-3 font-semibold">
              Change status
            </h2>
            {transitions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No further changes.</p>
            ) : (
              <form action={changeStatusAction} className="space-y-3">
                <input type="hidden" name="bookingId" value={booking.id} />
                <label htmlFor="new-status" className="sr-only">
                  New status
                </label>
                <select id="new-status" name="status" className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm" defaultValue={transitions[0]}>
                  {transitions.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel[s]}
                    </option>
                  ))}
                </select>
                <Button type="submit" variant="brand" size="lg" className="w-full">
                  Update status
                </Button>
              </form>
            )}
            <h3 className="mt-5 mb-2 text-sm font-semibold">History</h3>
            <ol className="space-y-2 text-sm">
              {booking.statusHistory.map((h) => (
                <li key={h.id} className="flex justify-between gap-2">
                  <span>
                    {statusLabel[h.from] ?? h.from} → <span className="font-semibold">{statusLabel[h.to] ?? h.to}</span>
                    <span className="block text-xs text-muted-foreground">{h.changedBy}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground tnum">{format(h.createdAt, "d MMM, HH:mm")}</span>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="notes-title" className="card-surface p-4 sm:p-5">
            <h2 id="notes-title" className="mb-3 flex items-center gap-2 font-semibold">
              <StickyNote className="size-4" aria-hidden="true" />
              Internal notes
            </h2>
            <form action={addNoteAction} className="space-y-2">
              <input type="hidden" name="bookingId" value={booking.id} />
              <label htmlFor="note-body" className="sr-only">
                New internal note
              </label>
              <Textarea id="note-body" name="body" rows={3} required maxLength={2000} placeholder="Visible to staff only. Never record card details." />
              <Button type="submit" variant="outline" size="lg" className="w-full">
                Add note
              </Button>
            </form>
            <ul className="mt-4 space-y-3">
              {booking.internalNotes.map((n) => (
                <li key={n.id} className="rounded-lg bg-muted/60 p-3 text-sm">
                  <p className="whitespace-pre-wrap">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {n.author} · {format(n.createdAt, "d MMM, HH:mm")}
                  </p>
                </li>
              ))}
              {booking.internalNotes.length === 0 && <li className="text-sm text-muted-foreground">No notes yet.</li>}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
