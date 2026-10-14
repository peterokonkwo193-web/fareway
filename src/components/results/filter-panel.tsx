"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, Moon, SlidersHorizontal, Sun, Sunrise, Sunset, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { formatMoney } from "@/lib/currency/format";
import {
  activeFilterCount,
  emptyFilters,
  TIME_WINDOWS,
  type BagOption,
  type FilterFacets,
  type FlightFilters,
  type StopsOption,
  type TimeWindow,
} from "@/lib/flights/filter";
import { cn } from "@/lib/utils";

type SectionProps = {
  facets: FilterFacets;
  filters: FlightFilters;
  onChange: (next: FlightFilters) => void;
  currency: string;
};

const timeIcons: Record<TimeWindow, typeof Sun> = { early: Sunrise, morning: Sun, afternoon: Sunset, evening: Moon };
const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-sm font-semibold">{children}</h3>
      {action}
    </div>
  );
}

function CheckRow({ id, checked, onChange, label, aside }: { id: string; checked: boolean; onChange: () => void; label: string; aside?: string }) {
  return (
    <div className="flex min-h-11 items-center gap-3 rounded-lg px-2 hover:bg-muted">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="flex-1 cursor-pointer py-2 text-sm font-normal">
        {label}
      </Label>
      {aside && <span className="text-xs text-muted-foreground tnum">{aside}</span>}
    </div>
  );
}

export function StopsFilter({ facets, filters, onChange, currency, idPrefix = "f" }: SectionProps & { idPrefix?: string }) {
  const t = useTranslations("results");
  const locale = useLocale();
  return (
    <div>
      <SectionTitle>{t("filters.stops")}</SectionTitle>
      {facets.stops.map((s) => (
        <CheckRow
          key={s.value}
          id={`${idPrefix}-stops-${s.value}`}
          checked={filters.stops.includes(s.value)}
          onChange={() => onChange({ ...filters, stops: toggle<StopsOption>(filters.stops, s.value) })}
          label={t(`filters.stopsOption.${s.value}`)}
          aside={t("fromPrice", { price: formatMoney(s.minPrice, currency, locale) })}
        />
      ))}
    </div>
  );
}

export function PriceFilter({ facets, filters, onChange, currency }: SectionProps) {
  const t = useTranslations("results");
  const locale = useLocale();
  const { min, max } = facets.price;
  const current = Math.min(filters.maxPrice ?? max, max);
  const [draft, setDraft] = useState<number | null>(null);
  const value = draft ?? current;
  if (max <= min) return null;
  return (
    <div>
      <SectionTitle action={<span className="text-sm font-bold text-price tnum">{formatMoney(value, currency, locale)}</span>}>
        {t("filters.maxPrice")}
      </SectionTitle>
      <Slider
        min={min}
        max={max}
        step={Math.max(1, Math.round((max - min) / 100))}
        value={[value]}
        onValueChange={([v]) => setDraft(v)}
        onValueCommit={([v]) => {
          setDraft(null);
          onChange({ ...filters, maxPrice: v >= max ? undefined : v });
        }}
        aria-label={t("filters.maxPrice")}
        className="py-3"
      />
      <div className="flex justify-between text-xs text-muted-foreground tnum">
        <span>{formatMoney(min, currency, locale)}</span>
        <span>{formatMoney(max, currency, locale)}</span>
      </div>
    </div>
  );
}

export function DepartureFilter({ facets, filters, onChange }: SectionProps) {
  const t = useTranslations("results");
  return (
    <div>
      <SectionTitle>{t("filters.departure")}</SectionTitle>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label={t("filters.departure")}>
        {TIME_WINDOWS.map((w) => {
          const Icon = timeIcons[w];
          const active = filters.depTimes.includes(w);
          const count = facets.depTimes.find((d) => d.value === w)?.count ?? 0;
          return (
            <button
              key={w}
              type="button"
              aria-pressed={active}
              disabled={count === 0 && !active}
              onClick={() => onChange({ ...filters, depTimes: toggle(filters.depTimes, w) })}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-lg border border-border px-2 py-2 text-xs disabled:opacity-40",
                active ? "border-primary bg-primary text-primary-foreground" : "hover:border-sky",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="font-semibold">{t(`filters.time.${w}`)}</span>
              <span className={cn("tnum", active ? "opacity-90" : "text-muted-foreground")}>{t(`filters.timeRange.${w}`)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AirlinesFilter({ facets, filters, onChange, currency, idPrefix = "f" }: SectionProps & { idPrefix?: string }) {
  const t = useTranslations("results");
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const all = facets.airlines.map((a) => a.code);
  const selected = filters.airlines.length ? filters.airlines : all;
  const visible = expanded ? facets.airlines : facets.airlines.slice(0, 6);
  const set = (codes: string[]) => onChange({ ...filters, airlines: codes.length === all.length ? [] : codes });
  return (
    <div>
      <SectionTitle
        action={
          filters.airlines.length > 0 && (
            <button type="button" className="text-xs font-semibold text-link hover:underline" onClick={() => set(all)}>
              {t("filters.selectAll")}
            </button>
          )
        }
      >
        {t("filters.airlines")}
      </SectionTitle>
      {visible.map((a) => (
        <CheckRow
          key={a.code}
          id={`${idPrefix}-airline-${a.code}`}
          checked={selected.includes(a.code)}
          onChange={() => {
            const next = toggle(selected, a.code);
            set(next.length ? next : all);
          }}
          label={a.name}
          aside={formatMoney(a.minPrice, currency, locale)}
        />
      ))}
      {facets.airlines.length > 6 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-1 inline-flex items-center gap-1 px-2 text-sm font-semibold text-link hover:underline"
        >
          {expanded ? t("filters.showFewer") : t("filters.showAll", { count: facets.airlines.length })}
          <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function DurationFilter({ facets, filters, onChange }: SectionProps) {
  const t = useTranslations("results");
  const { min, max } = facets.durationH;
  const current = Math.min(filters.maxDurationH ?? max, max);
  const [draft, setDraft] = useState<number | null>(null);
  const value = draft ?? current;
  if (max <= min) return null;
  return (
    <div>
      <SectionTitle action={<span className="text-sm font-semibold tnum">{t("hoursShort", { h: value })}</span>}>
        {t("filters.maxDuration")}
      </SectionTitle>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={([v]) => setDraft(v)}
        onValueCommit={([v]) => {
          setDraft(null);
          onChange({ ...filters, maxDurationH: v >= max ? undefined : v });
        }}
        aria-label={t("filters.maxDuration")}
        className="py-3"
      />
      <div className="flex justify-between text-xs text-muted-foreground tnum">
        <span>{t("hoursShort", { h: min })}</span>
        <span>{t("hoursShort", { h: max })}</span>
      </div>
    </div>
  );
}

export function BagsFilter({ filters, onChange, idPrefix = "f" }: SectionProps & { idPrefix?: string }) {
  const t = useTranslations("results");
  return (
    <div>
      <SectionTitle>{t("filters.baggage")}</SectionTitle>
      {(["cabin", "checked"] as BagOption[]).map((b) => (
        <CheckRow
          key={b}
          id={`${idPrefix}-bags-${b}`}
          checked={filters.bags.includes(b)}
          onChange={() => onChange({ ...filters, bags: toggle(filters.bags, b) })}
          label={t(`filters.bagsOption.${b}`)}
        />
      ))}
    </div>
  );
}

export function FilterPanel(props: SectionProps & { idPrefix?: string }) {
  const t = useTranslations("results");
  const count = activeFilterCount(props.filters);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          {t("filters.title")}
        </h2>
        {count > 0 && (
          <button type="button" onClick={() => props.onChange(emptyFilters)} className="text-sm font-semibold text-link hover:underline">
            {t("filters.reset")}
          </button>
        )}
      </div>
      <StopsFilter {...props} />
      <PriceFilter {...props} />
      <DepartureFilter {...props} />
      <AirlinesFilter {...props} />
      <DurationFilter {...props} />
      <BagsFilter {...props} />
    </div>
  );
}

/** Mobile/tablet: chips that open single-filter popovers, plus an "All filters" sheet. */
export function FilterChips(props: SectionProps & { resultCount: number }) {
  const t = useTranslations("results");
  const locale = useLocale();
  const { filters, onChange } = props;
  const count = activeFilterCount(filters);
  const directOnly = filters.stops.length === 1 && filters.stops[0] === 0;

  const chip = (key: string, label: string, active: boolean, content: React.ReactNode) => (
    <Popover key={key}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold",
            active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-sky",
          )}
        >
          {label}
          <ChevronDown className="size-4" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] rounded-xl p-4 shadow-float">
        {content}
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-semibold hover:border-sky"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            {t("filters.title")}
            {count > 0 && <span className="grid size-5 place-items-center rounded-full bg-primary text-xs text-primary-foreground">{count}</span>}
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[90dvh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{t("filters.title")}</SheetTitle>
            <SheetDescription>{t("resultsCount", { count: props.resultCount })}</SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto px-4 pb-4">
            <FilterPanel {...props} idPrefix="sheet" />
          </div>
          <SheetFooter>
            <SheetTrigger asChild>
              <Button variant="brand" size="lg">
                {t("filters.showResults", { count: props.resultCount })}
              </Button>
            </SheetTrigger>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <button
        type="button"
        aria-pressed={directOnly}
        onClick={() => onChange({ ...filters, stops: directOnly ? [] : [0] })}
        className={cn(
          "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold",
          directOnly ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-sky",
        )}
      >
        {t("filters.directOnly")}
        {directOnly && <X className="size-4" aria-hidden="true" />}
      </button>
      {chip("stops", t("filters.stops"), filters.stops.length > 0 && !directOnly, <StopsFilter {...props} idPrefix="chip" />)}
      {chip(
        "price",
        filters.maxPrice ? t("filters.under", { price: formatMoney(filters.maxPrice, props.currency, locale) }) : t("filters.price"),
        filters.maxPrice !== undefined,
        <PriceFilter {...props} />,
      )}
      {chip("dep", t("filters.departure"), filters.depTimes.length > 0, <DepartureFilter {...props} />)}
      {chip("airlines", t("filters.airlines"), filters.airlines.length > 0, <AirlinesFilter {...props} idPrefix="chip" />)}
      {chip("duration", t("filters.duration"), filters.maxDurationH !== undefined, <DurationFilter {...props} />)}
      {chip("bags", t("filters.baggage"), filters.bags.length > 0, <BagsFilter {...props} idPrefix="chip" />)}
    </div>
  );
}
