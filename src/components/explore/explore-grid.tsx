"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { Clock, Plane, Search, SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/currency/format";
import { formatDuration } from "@/lib/flights/time";
import type { ExploreItem } from "@/lib/flights/explore";
import { CONTINENTS, type Continent } from "@/lib/geo/types";
import { flightsHref } from "@/lib/search/links";
import { cn } from "@/lib/utils";

export type ExploreCard = ExploreItem & { price: number };

const LENGTHS = ["short", "medium", "long", "ultra"] as const;
type Length = (typeof LENGTHS)[number];
const lengthRange: Record<Length, [number, number]> = { short: [0, 180], medium: [180, 360], long: [360, 720], ultra: [720, Infinity] };
const SORTS = ["cheapest", "fastest", "name"] as const;
type Sort = (typeof SORTS)[number];

const gradients = ["from-[#0b3d91] to-[#1fa2ff]", "from-[#0d4fb8] to-[#38bdf8]", "from-[#173a6b] to-[#ff7a3d]", "from-[#0f766e] to-[#1fa2ff]"];

/** Round budget steps in the display currency, derived from the price spread. */
function budgetSteps(prices: number[]): number[] {
  if (prices.length === 0) return [];
  const sorted = [...prices].sort((a, b) => a - b);
  const pick = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
  const nice = (n: number) => {
    const mag = 10 ** Math.max(0, Math.floor(Math.log10(n)) - 1);
    return Math.ceil(n / mag) * mag;
  };
  return [...new Set([pick(0.15), pick(0.4), pick(0.75)].map(nice))];
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-sky",
      )}
    >
      {children}
    </button>
  );
}

export function ExploreGrid({ cards, currency, originId }: { cards: ExploreCard[]; currency: string; originId: string }) {
  const t = useTranslations("explore");
  const tDeals = useTranslations("deals");
  const locale = useLocale();
  const params = useSearchParams();

  const continent = (CONTINENTS as string[]).includes(params.get("continent") ?? "") ? (params.get("continent") as Continent) : null;
  const budget = Number(params.get("budget")) || null;
  const length = (LENGTHS as readonly string[]).includes(params.get("length") ?? "") ? (params.get("length") as Length) : null;
  const sort: Sort = (SORTS as readonly string[]).includes(params.get("sort") ?? "") ? (params.get("sort") as Sort) : "cheapest";
  const query = params.get("q") ?? "";

  const set = (key: string, value: string | null) => {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    window.history.replaceState(null, "", `/explore?${p.toString()}`);
  };

  const budgets = useMemo(() => budgetSteps(cards.map((c) => c.price)), [cards]);
  const continents = useMemo(() => CONTINENTS.filter((c) => cards.some((x) => x.continent === c)), [cards]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = cards.filter(
      (c) =>
        (!continent || c.continent === continent) &&
        (!budget || c.price <= budget) &&
        (!length || (c.durationMin >= lengthRange[length][0] && c.durationMin < lengthRange[length][1])) &&
        (!q || c.countryName.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.countryCode.toLowerCase() === q),
    );
    if (sort === "fastest") return [...list].sort((a, b) => a.durationMin - b.durationMin);
    if (sort === "name") return [...list].sort((a, b) => a.countryName.localeCompare(b.countryName));
    return list;
  }, [cards, continent, budget, length, query, sort]);

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="explore-q" className="sr-only">
              {t("searchCountry")}
            </label>
            <Input
              id="explore-q"
              type="search"
              defaultValue={query}
              onChange={(e) => set("q", e.target.value || null)}
              placeholder={t("searchCountry")}
              className="h-11 pl-9"
            />
          </div>
          <div>
            <label htmlFor="explore-sort" className="sr-only">
              {t("sortBy")}
            </label>
            <select
              id="explore-sort"
              value={sort}
              onChange={(e) => set("sort", e.target.value === "cheapest" ? null : e.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm"
            >
              {SORTS.map((s) => (
                <option key={s} value={s}>
                  {t(`sort.${s}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div role="group" aria-label={t("continent")} className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0">
          <Chip active={!continent} onClick={() => set("continent", null)}>
            {t("allContinents")}
          </Chip>
          {continents.map((c) => (
            <Chip key={c} active={continent === c} onClick={() => set("continent", continent === c ? null : c)}>
              {t(`continents.${c.replace(" ", "")}`)}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <div role="group" aria-label={t("budget")} className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">{t("budget")}</span>
            {budgets.map((b) => (
              <Chip key={b} active={budget === b} onClick={() => set("budget", budget === b ? null : String(b))}>
                {t("under", { price: formatMoney(b, currency, locale) })}
              </Chip>
            ))}
            <Chip active={!budget} onClick={() => set("budget", null)}>
              {t("anyBudget")}
            </Chip>
          </div>
          <div role="group" aria-label={t("flightLength")} className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">{t("flightLength")}</span>
            {LENGTHS.map((l) => (
              <Chip key={l} active={length === l} onClick={() => set("length", length === l ? null : l)}>
                {t(`length.${l}`)}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
        {t("count", { count: visible.length })}
      </p>

      {visible.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-2 p-10 text-center">
          <SearchX className="size-10 text-muted-foreground" aria-hidden="true" />
          <p className="font-semibold">{t("emptyTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("emptyBody")}</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((c, i) => (
            <li key={c.countryCode}>
              <Link
                href={flightsHref({ from: originId, to: c.placeId, depart: c.departDate, returnDate: c.returnDate })}
                className="group card-surface block overflow-hidden transition-shadow hover:shadow-raised"
              >
                <div className="relative h-32 overflow-hidden">
                  {c.image ? (
                    <Image src={`/images/destinations/${c.image}.jpg`} alt="" fill sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 90vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className={cn("absolute inset-0 grid place-items-center bg-gradient-to-br text-6xl", gradients[i % gradients.length])} aria-hidden="true">
                      {c.flag}
                    </div>
                  )}
                  <span className="absolute top-2 left-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#0f1b2d]">{t(`continents.${c.continent.replace(" ", "")}`)}</span>
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold">
                        <span aria-hidden="true">{c.flag} </span>
                        {c.countryName}
                      </h2>
                      <p className="truncate text-sm text-muted-foreground">
                        {c.city} ({c.airport})
                      </p>
                    </div>
                    <p className="text-right">
                      <span className="block text-xs text-muted-foreground">{tDeals("from")}</span>
                      <span className="text-xl font-bold text-price tnum">{formatMoney(c.price, currency, locale)}</span>
                    </p>
                  </div>
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-muted/70 px-3 py-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" aria-hidden="true" />
                      {formatDuration(c.durationMin)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Plane className="size-3.5" aria-hidden="true" />
                      {c.stops === 0 ? tDeals("direct") : tDeals("stops", { count: c.stops })}
                    </span>
                    <span>
                      {format(parseISO(c.departDate), "d MMM")} – {format(parseISO(c.returnDate), "d MMM")}
                    </span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">{t("indicative")}</p>
    </div>
  );
}
