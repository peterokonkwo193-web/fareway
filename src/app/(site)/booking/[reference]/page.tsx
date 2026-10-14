import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { getTranslations } from "next-intl/server";
import { CheckCircle2, Info, ShieldAlert } from "lucide-react";
import { CopyReference, CustomerCarePanel } from "@/components/booking/customer-care";
import { OfferSummary } from "@/components/booking/offer-summary";
import { StatusBadge } from "@/components/booking/status-badge";
import { hasBookingAccess } from "@/lib/booking/access";
import { buildContactLinks } from "@/lib/booking/contact-links";
import { getBooking, parseSnapshot } from "@/lib/booking/service";
import { isBookingStatus } from "@/lib/booking/status";
import { flightSummaryLine } from "@/lib/booking/summary";
import { customerCare } from "@/lib/env";

export const metadata: Metadata = { title: "Your booking request", robots: { index: false, follow: false } };

export default async function BookingPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const ref = decodeURIComponent(reference).toUpperCase();
  // Only the browser that made the request (or verified it by email) may see it.
  if (!(await hasBookingAccess(ref))) redirect(`/booking/lookup?ref=${encodeURIComponent(ref)}`);
  const booking = await getBooking(ref);
  if (!booking) redirect(`/booking/lookup?ref=${encodeURIComponent(ref)}`);

  const t = await getTranslations("confirmation");
  const offer = parseSnapshot(booking.flightSnapshot);
  const care = customerCare();
  const links = buildContactLinks(care, booking.reference, flightSummaryLine(offer));
  const status = isBookingStatus(booking.status) ? booking.status : "PENDING";

  return (
    <div className="container-page max-w-5xl space-y-6 py-8">
      <section aria-labelledby="saved-title" className="card-surface space-y-5 p-5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-9 shrink-0 text-success" aria-hidden="true" />
            <h1 id="saved-title" className="text-2xl font-bold tracking-tight">
              {status === "EXPIRED" ? t("expiredTitle") : status === "CANCELLED" ? t("cancelledTitle") : t("title")}
            </h1>
          </div>
          <StatusBadge status={status} />
        </div>
        <p className="text-lg font-semibold">{t("savedMessage")}</p>
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">{t("referenceLabel")}</p>
          <CopyReference reference={booking.reference} />
        </div>
        {status === "PENDING" && (
          <p className="text-sm text-muted-foreground">{t("heldUntil", { date: `${format(booking.expiresAt, "EEE d MMM yyyy, HH:mm")}` })}</p>
        )}
        <p className="text-sm text-muted-foreground">{t("emailSent", { email: booking.contactEmail })}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <CustomerCarePanel
            links={links}
            phone={care.phone}
            email={care.email}
            whatsapp={care.whatsapp}
            hours={care.hours}
            responseTime={care.responseTime}
          />
          <div className="space-y-3 rounded-xl border border-border bg-card p-4 text-sm">
            <p className="flex gap-2">
              <Info className="mt-0.5 size-4 shrink-0 text-link" aria-hidden="true" />
              {t("noticeIndicative")}
            </p>
            <p className="flex gap-2">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
              {t("noticeConfirmed")}
            </p>
          </div>
          <section aria-labelledby="pax-title" className="card-surface p-4 sm:p-5">
            <h2 id="pax-title" className="mb-3 font-semibold">
              {t("travellers")}
            </h2>
            <ul className="divide-y divide-border text-sm">
              {booking.passengers.map((p) => (
                <li key={p.id} className="flex justify-between gap-3 py-2">
                  <span className="font-medium">
                    {p.firstName} {p.lastName}
                  </span>
                  <span className="text-muted-foreground">{t(`paxType.${p.type}`)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside>
          <OfferSummary offer={offer} total={booking.quotedPrice} currency={booking.currency} title={t("flightSummary")} />
        </aside>
      </div>
    </div>
  );
}
