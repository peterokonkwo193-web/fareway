"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { ArrowLeftRight, ArrowRight, CalendarDays, Pencil, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchWidget } from "@/components/search/search-widget";
import { FlightCard, type OfferHighlight } from "@/components/results/flight-card";
import { FilterChips, FilterPanel } from "@/components/results/filter-panel";
import { SortTabs } from "@/components/results/sort-tabs";
import { PriceAlert } from "@/components/results/price-alert";
import { NoFlights, NoMatches, ResultsError, ResultsSkeleton } from "@/components/results/results-states";
import { usePreferences } from "@/components/preferences-provider";
import { applyFilters, computeFacets, emptyFilters, parseFilters, writeFilters, type FlightFilters } from "@/lib/flights/filter";
import { highlightIds, parseSort, sortOffers, sortSummaries, type SortMode } from "@/lib/flights/sort";
import type { DisplayOffer } from "@/lib/flights/types";
import type { Place } from "@/lib/geo/types";
import { placeLabel } from "@/lib/geo/labels";
import { travellerCount, type SearchQuery } from "@/lib/search/query";

const PAGE_SIZE = 15;

type SearchResponse = { currency: string; offers: DisplayOffer[] };

async function fetchOffers(searchString: string, currency: string): Promise<SearchResponse> {
  const res = await fetch(`/api/flights/search?${searchString}&currency=${currency}`);
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  return res.json();
}

export function ResultsView({ query, searchString, places }: { query: SearchQuery; searchString: string; places: Record<string, Place> }) {
  const t = useTranslations("results");
  const locale = useLocale();
  const { currency } = usePreferences();
  const params = useSearchParams();
  const [modifyOpen, setModifyOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filters = useMemo(() => parseFilters(params), [params]);
  const sort = parseSort(params.get("sort"));

  const updateUrl = useCallback(
    (nextFilters: FlightFilters, nextSort: SortMode) => {
      const p = writeFilters(new URLSearchParams(params.toString()), nextFilters);
      if (nextSort === "best") p.delete("sort");
      else p.set("sort", nextSort);
      // Shallow update: no server round trip, but useSearchParams stays in sync.
      window.history.replaceState(null, "", `/flights?${p.toString()}`);
      setVisible(PAGE_SIZE);
    },
    [params],
  );

  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ["flights", searchString, currency],
    queryFn: () => fetchOffers(searchString, currency),
    staleTime: 2 * 60_000,
  });

  const offers = useMemo(() => data?.offers ?? [], [data]);
  const displayCurrency = data?.currency ?? currency;
  const facets = useMemo(() => computeFacets(offers), [offers]);
  const filtered = useMemo(() => applyFilters(offers, filters), [offers, filters]);
  const sorted = useMemo(() => sortOffers(filtered, sort), [filtered, sort]);
  const summaries = useMemo(() => sortSummaries(filtered), [filtered]);
  const highlights = useMemo(() => highlightIds(filtered), [filtered]);

  const first = query.legs[0];
  const last = query.legs[query.legs.length - 1];
  const fromPlace = places[first.from];
  const toPlace = places[query.trip === "multi" ? last.to : first.to];
  const travellers = travellerCount(query);
  const fmtDate = (d: string) => format(parseISO(d), "EEE d MMM");
  const dates =
    query.trip === "return" && query.returnDate
      ? `${fmtDate(first.date)} – ${fmtDate(query.returnDate)}`
      : query.trip === "multi"
        ? `${fmtDate(first.date)} – ${fmtDate(last.date)}`
        : fmtDate(first.date);
  const routeLabel = `${fromPlace ? placeLabel(fromPlace) : first.from} → ${toPlace ? placeLabel(toPlace) : first.to}`;

  const panelProps = {
    facets,
    filters,
    onChange: (f: FlightFilters) => updateUrl(f, sort),
    currency: displayCurrency,
  };

  const highlightFor = (id: string): OfferHighlight[] =>
    (["cheapest", "fastest", "best"] as const).filter((h) => highlights[h] === id);

  return (
    <>
      {/* Sticky route summary */}
      <div className="sticky top-16 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="container-page flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 truncate text-base font-bold sm:text-lg">
              <span className="truncate">{fromPlace ? placeLabel(fromPlace) : first.from}</span>
              {query.trip === "return" ? (
                <ArrowLeftRight className="size-4 shrink-0 text-sky" aria-label={t("returnTo")} />
              ) : (
                <ArrowRight className="size-4 shrink-0 text-sky" aria-label={t("to")} />
              )}
              <span className="truncate">{toPlace ? placeLabel(toPlace) : last.to}</span>
            </h1>
            <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground sm:text-sm">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {dates}
                {query.trip === "multi" && ` · ${t("flightsCount", { count: query.legs.length })}`}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="size-3.5" aria-hidden="true" />
                {t("travellers", { count: travellers })}, {t(`cabin.${query.cabin}`)}
              </span>
            </p>
          </div>
          <Button variant="outline" size="lg" onClick={() => setModifyOpen(true)}>
            <Pencil className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t("modify")}</span>
            <span className="sr-only sm:hidden">{t("modify")}</span>
          </Button>
        </div>
      </div>

      <Dialog open={modifyOpen} onOpenChange={setModifyOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{t("modify")}</DialogTitle>
            <DialogDescription>{t("modifyDescription")}</DialogDescription>
          </DialogHeader>
          <SearchWidget variant="panel" initialQuery={query} initialPlaces={places} onSubmitted={() => setModifyOpen(false)} />
        </DialogContent>
      </Dialog>

      <div className="container-page grid gap-6 py-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="hidden space-y-4 lg:block" aria-label={t("filters.title")}>
          <PriceAlert searchQuery={searchString} routeLabel={routeLabel} currency={displayCurrency} cheapest={summaries.cheapest?.price} />
          {offers.length > 0 && (
            <div className="card-surface p-4">
              <FilterPanel {...panelProps} />
            </div>
          )}
        </aside>

        <section aria-labelledby="results-heading" className="min-w-0 space-y-4">
          <h2 id="results-heading" className="sr-only">
            {t("resultsHeading")}
          </h2>
          {offers.length > 0 && <FilterChips {...panelProps} resultCount={filtered.length} />}
          <div className="lg:hidden">
            <PriceAlert searchQuery={searchString} routeLabel={routeLabel} currency={displayCurrency} cheapest={summaries.cheapest?.price} />
          </div>
          {offers.length > 0 && (
            <SortTabs value={sort} onChange={(m) => updateUrl(filters, m)} summaries={summaries} currency={displayCurrency} />
          )}

          {isPending ? (
            <ResultsSkeleton />
          ) : isError ? (
            <ResultsError onRetry={() => refetch()} />
          ) : offers.length === 0 ? (
            <NoFlights onModify={() => setModifyOpen(true)} />
          ) : filtered.length === 0 ? (
            <NoMatches onReset={() => updateUrl(emptyFilters, sort)} />
          ) : (
            <>
              <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                {isFetching ? t("updating") : t("showingCount", { shown: Math.min(visible, sorted.length), total: sorted.length })}
                {filtered.length < offers.length && ` · ${t("filteredFrom", { count: offers.length })}`}
              </p>
              <ol className="space-y-4">
                {sorted.slice(0, visible).map((offer) => (
                  <li key={offer.id}>
                    <FlightCard offer={offer} highlights={highlightFor(offer.id)} trip={query.trip} travellers={travellers} />
                  </li>
                ))}
              </ol>
              {visible < sorted.length && (
                <div className="flex justify-center">
                  <Button variant="outline" size="lg" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    {t("showMore", { count: Math.min(PAGE_SIZE, sorted.length - visible) })}
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {t("disclaimer", { currency: displayCurrency, locale })}
              </p>
            </>
          )}
        </section>
      </div>
    </>
  );
}
