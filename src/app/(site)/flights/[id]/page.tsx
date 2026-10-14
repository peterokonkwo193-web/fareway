import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, Plane } from "lucide-react";
import { AirlineBadge } from "@/components/flight/airline-badge";
import { JourneyTimeline } from "@/components/flight/journey-timeline";
import { BaggageCard, FareSummary } from "@/components/flight/fare-cards";
import { StickyPriceBar } from "@/components/flight/sticky-price-bar";
import { formatMoney } from "@/lib/currency/format";
import { imageForAirport } from "@/lib/flights/deals";
import { fareBreakdown } from "@/lib/flights/fare";
import { flightProvider } from "@/lib/flights/provider";
import { getCurrency } from "@/lib/preferences";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Flight details", robots: { index: false, follow: false } };

export default async function FlightDetailsPage({ params }: Props) {
  const { id } = await params;
  const offer = await flightProvider.getOffer(decodeURIComponent(id));
  if (!offer) notFound();

  const [t, tr, locale, currency] = await Promise.all([getTranslations("details"), getTranslations("results"), getLocale(), getCurrency()]);
  const breakdown = fareBreakdown(offer, currency);
  const first = offer.slices[0];
  const last = offer.slices[offer.slices.length - 1];
  const isReturn = offer.slices.length === 2 && first.from.iata === last.to.iata;
  const image = imageForAirport(first.to.iata);
  const travellers = offer.passengers.adults + offer.passengers.children + offer.passengers.infants;
  const sliceTitle = (i: number) =>
    offer.slices.length === 1 ? t("outboundJourney") : isReturn ? (i === 0 ? t("outboundJourney") : t("returnJourney")) : tr("flightN", { n: i + 1 });

  return (
    <div className="pb-36 md:pb-28">
      <div className="container-page max-w-4xl space-y-4 py-6">
        <Link href={`/flights?${offer.searchQuery}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-link hover:underline">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t("backToResults")}
        </Link>

        <header className="relative overflow-hidden rounded-2xl bg-hero text-white shadow-card">
          {image && (
            <Image src={`/images/destinations/${image}.jpg`} alt="" fill priority sizes="(min-width: 896px) 896px, 100vw" className="object-cover opacity-45" />
          )}
          <div className="relative flex flex-wrap items-end justify-between gap-4 p-5 sm:p-7">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase opacity-90">{t("flightRoute")}</p>
              <h1 className="mt-1 flex items-center gap-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                <span>{first.from.iata}</span>
                <Plane className="size-7 text-cta" aria-hidden="true" />
                <span>{isReturn ? first.to.iata : last.to.iata}</span>
                <span className="sr-only">
                  {t("routeSr", { from: first.from.city, to: isReturn ? first.to.city : last.to.city })}
                </span>
              </h1>
              <p className="mt-1 text-sm opacity-90">
                {first.from.city} → {isReturn ? first.to.city : last.to.city} ·{" "}
                {format(parseISO(first.departLocal), "d MMM")}
                {offer.slices.length > 1 && ` – ${format(parseISO(last.departLocal), "d MMM")}`}
              </p>
            </div>
            <div className="text-right">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                {isReturn ? t("roundTrip") : offer.slices.length > 1 ? t("multiCity") : t("oneWay")}
              </span>
              <p className="mt-2 text-sm opacity-90">
                {tr("travellers", { count: travellers })} · {tr(`cabin.${offer.cabin}`)}
              </p>
            </div>
          </div>
        </header>

        <div className="card-surface flex flex-wrap items-center gap-3 p-4">
          <div className="flex -space-x-2">
            {offer.carriers.map((c) => (
              <AirlineBadge key={c.code} carrier={c} className="ring-2 ring-card" />
            ))}
          </div>
          <div>
            <p className="font-semibold">{offer.carriers.map((c) => c.name).join(" · ")}</p>
            <p className="text-sm text-muted-foreground">
              {offer.conditions.brand} · {tr(`cabin.${offer.cabin}`)}
            </p>
          </div>
        </div>

        {offer.slices.map((slice, i) => (
          <JourneyTimeline key={i} slice={slice} title={sliceTitle(i)} icon={isReturn && i === 1 ? "back" : "out"} />
        ))}

        <div className="grid gap-4 md:grid-cols-2">
          <BaggageCard offer={offer} currency={breakdown.currency} />
          <FareSummary offer={offer} breakdown={breakdown} />
        </div>
      </div>

      <StickyPriceBar
        price={formatMoney(breakdown.total, breakdown.currency, locale)}
        caption={t("barCaption", { count: travellers })}
        href={`/book/${encodeURIComponent(offer.id)}`}
        cta={t("requestFlight")}
      />
    </div>
  );
}
