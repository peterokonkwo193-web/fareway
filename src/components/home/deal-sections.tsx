import Image from "next/image";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Clock, Plane } from "lucide-react";
import { Carousel } from "@/components/home/carousel-controls";
import { SectionHeading } from "@/components/home/info-sections";
import { formatMoney } from "@/lib/currency/format";
import { effectiveCurrency, fromUsd } from "@/lib/currency/convert";
import { cheapestThisMonth, popularDestinations } from "@/lib/flights/deals";
import { formatDuration } from "@/lib/flights/time";
import type { Place } from "@/lib/geo/types";
import { flightsHref } from "@/lib/search/links";

const gradients = [
  "from-[#0b3d91] to-[#1fa2ff]",
  "from-[#0d4fb8] to-[#38bdf8]",
  "from-[#173a6b] to-[#ff7a3d]",
  "from-[#0f766e] to-[#1fa2ff]",
];

export async function PopularDestinations({ origin, currency }: { origin: Place; currency: string }) {
  const t = await getTranslations("deals");
  const deals = await popularDestinations(origin);
  if (deals.length === 0) return null;
  const code = effectiveCurrency(currency);
  const title = t("popularTitle", { origin: origin.name });
  return (
    <section id="popular" aria-labelledby="popular-title" className="container-page scroll-mt-24">
      <SectionHeading eyebrow={t("popularEyebrow")} title={title} id="popular-title" />
      <Carousel label={title}>
        {deals.map((d, i) => (
          <li key={d.destination.id} className="w-[78%] shrink-0 snap-start sm:w-[45%] lg:w-[calc((100%-2rem)/3)]">
            <Link
              href={flightsHref({ from: origin.id, to: d.destination.id, depart: d.departDate, returnDate: d.returnDate })}
              className="group relative block aspect-[4/3] overflow-hidden rounded-xl shadow-card"
            >
              {d.image ? (
                <Image
                  src={`/images/destinations/${d.image}.jpg`}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 400px, (min-width: 640px) 45vw, 78vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradients[i % gradients.length]}`} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#0f1b2d]">
                <Plane className="size-3.5" aria-hidden="true" />
                {d.estimate.stops === 0 ? t("direct") : t("stops", { count: d.estimate.stops })} · {formatDuration(d.estimate.durationMin)}
              </span>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white">
                <div>
                  <p className="text-xs font-semibold tracking-wider uppercase opacity-90">
                    {d.flag} {d.countryName}
                  </p>
                  <h3 className="text-xl font-bold">{d.name}</h3>
                  <p className="text-xs opacity-90">{t("returnTrip")}</p>
                </div>
                <p className="text-right">
                  <span className="block text-xs opacity-90">{t("from")}</span>
                  <span className="rounded-lg bg-cta px-2 py-0.5 text-xl font-bold text-cta-foreground tnum">
                    {formatMoney(fromUsd(d.returnPriceUsd, code), code)}
                  </span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </Carousel>
    </section>
  );
}

export async function CheapestThisMonth({ origin, currency }: { origin: Place; currency: string }) {
  const t = await getTranslations("deals");
  const deals = await cheapestThisMonth(origin, 5);
  if (deals.length === 0) return null;
  const code = effectiveCurrency(currency);
  return (
    <section id="cheapest" aria-labelledby="cheapest-title" className="container-page scroll-mt-24">
      <SectionHeading
        eyebrow={t("monthEyebrow")}
        title={t("monthTitle", { origin: origin.name })}
        id="cheapest-title"
        action={
          <Link
            href={`/explore?from=${encodeURIComponent(origin.id)}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-link hover:underline"
          >
            {t("seeAll")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        }
      />
      <ul className="card-surface divide-y divide-border overflow-hidden">
        {deals.map((d) => (
          <li key={d.destination.id}>
            <Link
              href={flightsHref({ from: origin.id, to: d.destination.id, depart: d.departDate, returnDate: d.returnDate })}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 hover:bg-muted/60 sm:px-6"
            >
              <span className="grid size-12 place-items-center rounded-xl bg-secondary text-sm font-bold text-secondary-foreground tnum">
                {d.destination.code}
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{d.name}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {d.flag} {d.countryName}
                  </span>
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                  <span>
                    {d.estimate.carrier.name} · {d.estimate.stops === 0 ? t("direct") : t("stops", { count: d.estimate.stops })}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" aria-hidden="true" />
                    {format(parseISO(d.departDate), "d MMM")} – {format(parseISO(d.returnDate), "d MMM")}
                  </span>
                </span>
              </span>
              <span className="text-right">
                <span className="block text-xs text-muted-foreground">{t("returnFrom")}</span>
                <span className="text-xl font-bold text-price tnum">{formatMoney(fromUsd(d.returnPriceUsd, code), code)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">{t("indicative")}</p>
    </section>
  );
}
