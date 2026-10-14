import { format, parseISO } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { AirlineBadge } from "@/components/flight/airline-badge";
import { SliceRow } from "@/components/flight/slice-row";
import { formatMoney } from "@/lib/currency/format";
import type { FlightOffer } from "@/lib/flights/types";

/** Compact flight summary for the booking form sidebar and the confirmation page. */
export function OfferSummary({ offer, total, currency, title }: { offer: FlightOffer; total: number; currency: string; title?: string }) {
  const t = useTranslations("booking");
  const tr = useTranslations("results");
  const locale = useLocale();
  const travellers = offer.passengers.adults + offer.passengers.children + offer.passengers.infants;
  const isReturn = offer.slices.length === 2 && offer.slices[0].from.iata === offer.slices[1].to.iata;
  return (
    <section aria-labelledby="summary-title" className="card-surface space-y-4 p-4 sm:p-5">
      <h2 id="summary-title" className="font-semibold">
        {title ?? t("yourFlight")}
      </h2>
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {offer.carriers.slice(0, 3).map((c) => (
            <AirlineBadge key={c.code} carrier={c} size="sm" className="ring-2 ring-card" />
          ))}
        </div>
        <p className="text-sm">
          <span className="font-semibold">{offer.carriers.map((c) => c.name).join(" · ")}</span>
          <span className="block text-xs text-muted-foreground">
            {offer.conditions.brand} · {tr(`cabin.${offer.cabin}`)}
          </span>
        </p>
      </div>
      <div className="space-y-3">
        {offer.slices.map((s, i) => (
          <div key={i} className="rounded-lg bg-muted/60 px-3 py-2.5">
            <p className="mb-1 text-xs font-semibold text-muted-foreground">
              {isReturn ? (i === 0 ? tr("outbound") : tr("inbound")) : offer.slices.length > 1 ? tr("flightN", { n: i + 1 }) : tr("outbound")} ·{" "}
              {format(parseISO(s.departLocal), "EEE d MMM yyyy")}
            </p>
            <SliceRow slice={s} />
          </div>
        ))}
      </div>
      <dl className="flex items-baseline justify-between border-t border-border pt-3">
        <dt className="text-sm">
          <span className="font-semibold">{t("indicativeTotal")}</span>
          <span className="block text-xs text-muted-foreground">{tr("travellers", { count: travellers })}</span>
        </dt>
        <dd className="text-2xl font-bold text-price tnum">{formatMoney(total, currency, locale)}</dd>
      </dl>
      <p className="flex gap-2 rounded-xl bg-secondary p-3 text-xs text-secondary-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {t("priceNotice")}
      </p>
    </section>
  );
}
