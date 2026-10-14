import { useLocale, useTranslations } from "next-intl";
import { BadgeCheck, Briefcase, CircleX, Info, Luggage, Receipt, RefreshCcw, ShoppingBag } from "lucide-react";
import { formatMoney } from "@/lib/currency/format";
import { fromUsd } from "@/lib/currency/convert";
import type { FareBreakdown } from "@/lib/flights/fare";
import type { FlightOffer } from "@/lib/flights/types";

function Row({ icon: Icon, title, detail, value, muted }: { icon: typeof Luggage; title: string; detail: string; value: string; muted?: boolean }) {
  return (
    <li className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      <span className={muted ? "text-sm font-semibold text-muted-foreground tnum" : "text-sm font-semibold text-success-foreground"}>{value}</span>
    </li>
  );
}

export function BaggageCard({ offer, currency }: { offer: FlightOffer; currency: string }) {
  const t = useTranslations("details");
  const locale = useLocale();
  const b = offer.baggage;
  const fee = (usd?: number) => (usd ? t("fromFee", { price: formatMoney(fromUsd(usd, currency), currency, locale) }) : t("notIncluded"));
  return (
    <section aria-labelledby="baggage-title" className="card-surface p-4 sm:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="baggage-title" className="flex items-center gap-2 font-semibold">
          <Luggage className="size-5 text-primary" aria-hidden="true" />
          {t("baggageTitle")}
        </h2>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">{offer.conditions.brand}</span>
      </header>
      <ul className="space-y-2">
        <Row icon={ShoppingBag} title={t("personalItem")} detail={t("personalItemDetail")} value={t("included")} />
        <Row
          icon={Briefcase}
          title={b.cabinBagKg ? t("cabinBagKg", { kg: b.cabinBagKg }) : t("cabinBag")}
          detail={t("cabinBagDetail")}
          value={b.cabinBagKg ? t("included") : fee(b.cabinBagFeeUsd)}
          muted={!b.cabinBagKg}
        />
        <Row
          icon={Luggage}
          title={b.checkedBags ? t("checkedBagsKg", { count: b.checkedBags, kg: b.checkedBagKg }) : t("checkedBagKg", { kg: b.checkedBagKg })}
          detail={t("checkedBagDetail")}
          value={b.checkedBags ? t("included") : fee(b.checkedBagFeeUsd)}
          muted={!b.checkedBags}
        />
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">{t("baggageNote")}</p>
    </section>
  );
}

export function FareSummary({ offer, breakdown }: { offer: FlightOffer; breakdown: FareBreakdown }) {
  const t = useTranslations("details");
  const locale = useLocale();
  const money = (n: number) => formatMoney(n, breakdown.currency, locale);
  const c = offer.conditions;
  return (
    <section aria-labelledby="fare-title" className="card-surface p-4 sm:p-6">
      <h2 id="fare-title" className="mb-4 flex items-center gap-2 font-semibold">
        <Receipt className="size-5 text-primary" aria-hidden="true" />
        {t("fareTitle")}
      </h2>
      <ul className="mb-4 space-y-1.5 text-sm">
        <li className="flex items-center gap-2">
          {c.changeable ? <RefreshCcw className="size-4 text-success" aria-hidden="true" /> : <CircleX className="size-4 text-muted-foreground" aria-hidden="true" />}
          {c.changeable
            ? c.changeFeeUsd
              ? t("changesWithFee", { fee: money(fromUsd(c.changeFeeUsd, breakdown.currency)) })
              : t("changesFree")
            : t("noChanges")}
        </li>
        <li className="flex items-center gap-2">
          {c.refundable ? <BadgeCheck className="size-4 text-success" aria-hidden="true" /> : <CircleX className="size-4 text-muted-foreground" aria-hidden="true" />}
          {c.refundable ? t("refundable") : t("nonRefundable")}
        </li>
      </ul>
      <dl className="space-y-2 border-t border-border pt-4 text-sm">
        {breakdown.lines.map((l) => (
          <div key={l.kind} className="flex justify-between gap-3">
            <dt>{t(`passengerLine.${l.kind}`, { count: l.count, unit: money(l.unit) })}</dt>
            <dd className="tnum">{money(l.amount)}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-3 text-muted-foreground">
          <dt>{t("baseFare")}</dt>
          <dd className="tnum">{money(breakdown.base)}</dd>
        </div>
        <div className="flex justify-between gap-3 text-muted-foreground">
          <dt>{t("taxes")}</dt>
          <dd className="tnum">{money(breakdown.taxes)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-border pt-3">
          <dt className="font-semibold">{t("total")}</dt>
          <dd className="text-2xl font-bold text-price tnum">{money(breakdown.total)}</dd>
        </div>
      </dl>
      <p className="mt-4 flex gap-2 rounded-xl bg-secondary p-3 text-xs text-secondary-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {t("indicativeNotice")}
      </p>
    </section>
  );
}
