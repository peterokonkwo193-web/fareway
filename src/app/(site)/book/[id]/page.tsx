import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { BookingForm } from "@/components/booking/booking-form";
import { OfferSummary } from "@/components/booking/offer-summary";
import { fareBreakdown } from "@/lib/flights/fare";
import { flightProvider } from "@/lib/flights/provider";
import { countryOptions } from "@/lib/geo/country-options";
import { getCurrency } from "@/lib/preferences";

export const metadata: Metadata = { title: "Request this flight", robots: { index: false, follow: false } };

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offerId = decodeURIComponent(id);
  const offer = await flightProvider.getOffer(offerId);
  if (!offer) notFound();
  const [t, currency] = await Promise.all([getTranslations("booking"), getCurrency()]);
  const fare = fareBreakdown(offer, currency);

  return (
    <div className="container-page max-w-6xl py-6">
      <Link
        href={`/flights/${encodeURIComponent(offer.id)}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-link hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t("backToFlight")}
      </Link>
      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-[1.75rem]">{t("title")}</h1>
        <p className="mt-1 flex items-start gap-2 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
          {t("intro")}
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="order-2 lg:order-1">
          <BookingForm
            offerId={offer.id}
            travelDate={offer.slices[0].departLocal.slice(0, 10)}
            passengers={offer.passengers}
            countries={countryOptions()}
          />
        </div>
        <aside className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-24">
            <OfferSummary offer={offer} total={fare.total} currency={fare.currency} />
          </div>
        </aside>
      </div>
    </div>
  );
}
