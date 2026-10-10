"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeftRight, BedDouble, Car, Clock, Plane, PlaneLanding, PlaneTakeoff, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlaceCombobox } from "@/components/search/place-combobox";
import { DateField } from "@/components/search/date-field";
import { TravellersPopover } from "@/components/search/travellers-popover";
import { useSearchStore } from "@/stores/search-store";
import type { Place } from "@/lib/geo/types";
import { MAX_LEGS, parseSearchQuery, searchQueryToParams, toIsoDate, TRIP_TYPES, type SearchQuery } from "@/lib/search/query";
import { cn } from "@/lib/utils";

type Errors = Record<string, string>;

export function SearchWidget({
  initialQuery,
  initialPlaces,
  defaultOrigin,
  variant = "hero",
  onSubmitted,
}: {
  initialQuery?: SearchQuery;
  initialPlaces?: Record<string, Place>;
  defaultOrigin?: Place | null;
  variant?: "hero" | "panel";
  onSubmitted?: () => void;
}) {
  const t = useTranslations("search");
  const router = useRouter();
  const s = useSearchStore();
  const [errors, setErrors] = useState<Errors>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await useSearchStore.persist.rehydrate();
      if (cancelled) return;
      const store = useSearchStore.getState();
      if (initialQuery && initialPlaces) {
        store.loadQuery(initialQuery, initialPlaces);
      } else {
        // Drop stale dates from a previous visit.
        const today = toIsoDate(new Date());
        store.legs.forEach((leg, i) => {
          if (leg.date && leg.date < today) store.setLeg(i, { date: null });
        });
        if (store.returnDate && store.returnDate < today) store.setReturnDate(null);
        if (!store.legs[0]?.from && defaultOrigin) store.setLeg(0, { from: defaultOrigin });
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // Run once on mount; later prop changes come from navigation and remount the widget.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearError(...keys: string[]) {
    setErrors((e) => {
      const next = { ...e };
      for (const k of keys) delete next[k];
      return next;
    });
  }

  function choosePlace(index: number, field: "from" | "to", place: Place | null) {
    s.setLeg(index, { [field]: place });
    if (place) s.rememberPlace(place);
    clearError(`legs.${index}.${field}`, `legs.${index}.to`);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const first = s.legs[0];

    // "Everywhere" goes to the Explore page.
    if (s.trip !== "multi" && first?.to?.kind === "anywhere") {
      if (!first.from) {
        setErrors({ "legs.0.from": t("errors.from") });
        return;
      }
      const params = new URLSearchParams({ from: first.from.id });
      if (first.date) params.set("month", first.date.slice(0, 7));
      router.push(`/explore?${params}`);
      onSubmitted?.();
      return;
    }

    const missing: Errors = {};
    s.legs.forEach((leg, i) => {
      if (!leg.from) missing[`legs.${i}.from`] = t("errors.from");
      if (!leg.to) missing[`legs.${i}.to`] = t("errors.to");
      if (!leg.date) missing[`legs.${i}.date`] = t("errors.date");
    });
    if (s.trip === "return" && !s.returnDate) missing.returnDate = t("errors.return");
    if (Object.keys(missing).length) {
      setErrors(missing);
      return;
    }

    const result = parseSearchQuery({
      trip: s.trip,
      legs: s.legs.map((l) => ({ from: l.from!.id, to: l.to!.id, date: l.date! })),
      returnDate: s.trip === "return" ? s.returnDate ?? undefined : undefined,
      adults: s.adults,
      children: s.children,
      infants: s.infants,
      cabin: s.cabin,
    });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    const href = `/flights?${searchQueryToParams(result.query)}`;
    const label =
      s.trip === "multi"
        ? s.legs.map((l) => l.from!.code).concat(s.legs[s.legs.length - 1].to!.code).join(" → ")
        : `${first.from!.code} ${s.trip === "return" ? "⇄" : "→"} ${first.to!.code}`;
    s.addRecent({ label, href });
    router.push(href);
    onSubmitted?.();
  }

  const tripSelector = (
    <div role="radiogroup" aria-label={t("tripType")} className="inline-flex rounded-full bg-muted p-1">
      {TRIP_TYPES.map((trip) => (
        <label
          key={trip}
          className={cn(
            "relative cursor-pointer rounded-full px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
            s.trip === trip && "bg-primary text-primary-foreground",
          )}
        >
          <input
            type="radio"
            name="trip"
            value={trip}
            checked={s.trip === trip}
            onChange={() => {
              s.setTrip(trip);
              setErrors({});
            }}
            className="sr-only"
          />
          {t(`trip.${trip}`)}
        </label>
      ))}
    </div>
  );

  const travellers = (
    <TravellersPopover
      counts={{ adults: s.adults, children: s.children, infants: s.infants }}
      cabin={s.cabin}
      onCountsChange={(c) => {
        s.setPassengers(c);
        clearError("adults", "infants");
      }}
      onCabinChange={s.setCabin}
      variant="compact"
    />
  );

  const leg0 = s.legs[0] ?? { from: null, to: null, date: null };
  const passengerError = errors.adults ?? errors.infants;

  const flightsForm = (
    <form onSubmit={submit} noValidate aria-busy={!ready} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {tripSelector}
        {travellers}
      </div>

      {s.trip !== "multi" ? (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)_auto]">
          <div className="relative grid gap-3 sm:grid-cols-2 sm:gap-2 lg:col-span-2">
            <PlaceCombobox
              id="search-from"
              label={t("from")}
              icon={PlaneTakeoff}
              value={leg0.from}
              onChange={(p) => choosePlace(0, "from", p)}
              recentPlaces={s.recentPlaces}
              error={errors["legs.0.from"]}
            />
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              onClick={() => s.swap(0)}
              aria-label={t("swap")}
              className="absolute top-[2.5rem] right-4 z-10 rounded-full bg-card shadow-card sm:top-2.5 sm:left-1/2 sm:right-auto sm:-translate-x-1/2"
            >
              <ArrowLeftRight className="size-4 rotate-90 sm:rotate-0" />
            </Button>
            <PlaceCombobox
              id="search-to"
              label={t("to")}
              icon={PlaneLanding}
              value={leg0.to}
              onChange={(p) => choosePlace(0, "to", p)}
              allowEverywhere
              recentPlaces={s.recentPlaces}
              error={errors["legs.0.to"]}
              placeholder={t("toPlaceholder")}
            />
          </div>
          <DateField
            mode={s.trip === "return" ? "range" : "single"}
            depart={leg0.date}
            ret={s.returnDate}
            onChange={({ depart, ret }) => {
              s.setLeg(0, { date: depart });
              s.setReturnDate(ret);
              clearError("legs.0.date", "returnDate");
            }}
            departError={errors["legs.0.date"]}
            returnError={errors.returnDate}
          />
          <Button type="submit" variant="cta" size="xl" className="h-16 w-full rounded-lg px-7 text-base lg:w-auto">
            <Search className="size-5" aria-hidden="true" />
            {t("submit")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <ol className="space-y-3">
            {s.legs.map((leg, i) => (
              <li key={i} className="grid gap-2 rounded-xl border border-border p-3 md:grid-cols-[auto_1fr_1fr_1fr_auto] md:items-start md:border-0 md:p-0">
                <span className="flex h-8 items-center text-sm font-semibold text-muted-foreground md:h-16">
                  {t("flightN", { n: i + 1 })}
                </span>
                <PlaceCombobox
                  id={`leg-${i}-from`}
                  label={t("from")}
                  icon={PlaneTakeoff}
                  value={leg.from}
                  onChange={(p) => choosePlace(i, "from", p)}
                  recentPlaces={s.recentPlaces}
                  error={errors[`legs.${i}.from`]}
                />
                <PlaceCombobox
                  id={`leg-${i}-to`}
                  label={t("to")}
                  icon={PlaneLanding}
                  value={leg.to}
                  onChange={(p) => choosePlace(i, "to", p)}
                  recentPlaces={s.recentPlaces}
                  error={errors[`legs.${i}.to`]}
                />
                <DateField
                  mode="single"
                  depart={leg.date}
                  minDate={i > 0 ? s.legs[i - 1].date : null}
                  onChange={({ depart }) => {
                    s.setLeg(i, { date: depart });
                    clearError(`legs.${i}.date`);
                  }}
                  departError={errors[`legs.${i}.date`]}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  className="h-16 justify-self-end"
                  disabled={s.legs.length <= 2}
                  onClick={() => s.removeLeg(i)}
                  aria-label={t("removeFlight", { n: i + 1 })}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ol>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" size="lg" onClick={s.addLeg} disabled={s.legs.length >= MAX_LEGS}>
              <Plus className="size-4" aria-hidden="true" />
              {t("addFlight")}
            </Button>
            <Button type="submit" variant="cta" size="xl" className="h-14 px-8">
              <Search className="size-5" aria-hidden="true" />
              {t("submit")}
            </Button>
          </div>
          {errors.legs && <p className="text-sm font-medium text-destructive">{errors.legs}</p>}
        </div>
      )}
      {passengerError && <p className="text-sm font-medium text-destructive">{passengerError}</p>}

      {variant === "hero" && ready && s.recent.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="size-4" aria-hidden="true" />
            {t("recent")}
          </span>
          {s.recent.map((r) => (
            <a
              key={r.href}
              href={r.href}
              className="rounded-full bg-muted px-3 py-1 font-semibold text-foreground hover:bg-secondary hover:text-secondary-foreground"
            >
              {r.label}
            </a>
          ))}
        </div>
      )}
    </form>
  );

  if (variant === "panel") return flightsForm;

  return (
    <Tabs defaultValue="flights" className="gap-4">
      <TabsList className="h-auto bg-transparent p-0">
        <TabsTrigger value="flights" className="h-11 gap-2 rounded-full px-4 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground data-[state=active]:shadow-none">
          <Plane className="size-4" aria-hidden="true" />
          {t("tabs.flights")}
        </TabsTrigger>
        <TabsTrigger value="hotels" className="h-11 gap-2 rounded-full px-4 data-[state=active]:bg-secondary data-[state=active]:shadow-none">
          <BedDouble className="size-4" aria-hidden="true" />
          {t("tabs.hotels")}
        </TabsTrigger>
        <TabsTrigger value="cars" className="h-11 gap-2 rounded-full px-4 data-[state=active]:bg-secondary data-[state=active]:shadow-none">
          <Car className="size-4" aria-hidden="true" />
          {t("tabs.cars")}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="flights">{flightsForm}</TabsContent>
      {(["hotels", "cars"] as const).map((tab) => (
        <TabsContent key={tab} value={tab}>
          <div className="rounded-xl border border-dashed border-border bg-muted/50 p-8 text-center">
            <p className="text-lg font-semibold">{t(`comingSoon.${tab}.title`)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t(`comingSoon.${tab}.body`)}</p>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
