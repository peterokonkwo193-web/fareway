"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Briefcase, Luggage, ShoppingBag, Wifi } from "lucide-react";
import { AirlineBadge } from "@/components/flight/airline-badge";
import { SliceRow } from "@/components/flight/slice-row";
import { buttonVariants } from "@/components/ui/button";
import { formatMoney } from "@/lib/currency/format";
import type { DisplayOffer } from "@/lib/flights/types";
import { cn } from "@/lib/utils";

export type OfferHighlight = "cheapest" | "fastest" | "best";

const highlightStyles: Record<OfferHighlight, string> = {
  cheapest: "bg-deal-soft text-price",
  fastest: "bg-sky-soft text-link",
  best: "bg-success-soft text-success-foreground",
};

export function FlightCard({
  offer,
  highlights,
  trip,
  travellers,
}: {
  offer: DisplayOffer;
  highlights: OfferHighlight[];
  trip: "return" | "oneway" | "multi";
  travellers: number;
}) {
  const t = useTranslations("results");
  const locale = useLocale();
  const carriersLabel = offer.carriers.map((c) => c.name).join(" · ");
  const sliceLabel = (i: number) => (trip === "return" ? (i === 0 ? t("outbound") : t("inbound")) : trip === "multi" ? t("flightN", { n: i + 1 }) : undefined);
  const hasWifi = offer.slices.some((s) => s.segments.some((seg) => seg.amenities.wifi));
  const price = formatMoney(offer.display.total, offer.display.currency, locale);
  const titleId = `offer-${offer.id.slice(-12)}`;

  return (
    <article aria-labelledby={titleId} className="card-surface overflow-hidden transition-shadow hover:shadow-raised">
      <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-[1fr_auto] md:gap-6">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex -space-x-2">
              {offer.carriers.slice(0, 2).map((c) => (
                <AirlineBadge key={c.code} carrier={c} className="ring-2 ring-card" />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <h3 id={titleId} className="truncate font-semibold">
                {carriersLabel}
              </h3>
              <p className="text-xs text-muted-foreground">
                {offer.conditions.brand} · {t(`cabin.${offer.cabin}`)}
              </p>
            </div>
            <div className="flex basis-full flex-wrap gap-1.5 empty:hidden sm:basis-auto">
              {highlights.map((h) => (
                <span key={h} className={cn("rounded-full px-2.5 py-1 text-xs font-bold tracking-wide uppercase", highlightStyles[h])}>
                  {t(`highlight.${h}`)}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {offer.slices.map((slice, i) => (
              <div key={i} className={cn(offer.slices.length > 1 && "rounded-lg bg-muted/60 px-3 py-2.5")}>
                <SliceRow slice={slice} label={sliceLabel(i)} />
              </div>
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label={t("includedLabel")}>
            <li className="inline-flex items-center gap-1">
              <ShoppingBag className="size-3.5" aria-hidden="true" />
              {t("personalItem")}
            </li>
            <li className={cn("inline-flex items-center gap-1", offer.baggage.cabinBagKg === null && "line-through opacity-70")}>
              <Briefcase className="size-3.5" aria-hidden="true" />
              {offer.baggage.cabinBagKg === null ? t("noCabinBag") : t("cabinBag", { kg: offer.baggage.cabinBagKg })}
            </li>
            <li className={cn("inline-flex items-center gap-1", offer.baggage.checkedBags === 0 && "line-through opacity-70")}>
              <Luggage className="size-3.5" aria-hidden="true" />
              {offer.baggage.checkedBags === 0
                ? t("noCheckedBag")
                : t("checkedBags", { count: offer.baggage.checkedBags, kg: offer.baggage.checkedBagKg })}
            </li>
            {hasWifi && (
              <li className="inline-flex items-center gap-1">
                <Wifi className="size-3.5" aria-hidden="true" />
                {t("wifi")}
              </li>
            )}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border pt-4 md:w-48 md:flex-col md:items-end md:justify-center md:border-t-0 md:border-l md:pt-0 md:pl-6">
          <div className="md:text-right">
            <p className="text-xs text-muted-foreground">{travellers > 1 ? t("totalFor", { count: travellers }) : t("totalPrice")}</p>
            <p className="text-[1.75rem] leading-8 font-bold tracking-tight text-price tnum">{price}</p>
            <p className="text-xs text-muted-foreground">{t("indicativeShort")}</p>
          </div>
          <Link
            href={`/flights/${encodeURIComponent(offer.id)}`}
            className={cn(buttonVariants({ variant: "cta", size: "lg" }), "md:w-full")}
            aria-label={t("viewDealLabel", { airline: carriersLabel, price })}
          >
            {t("viewDeal")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
