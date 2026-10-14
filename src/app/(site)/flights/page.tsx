import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AlertCircle } from "lucide-react";
import { ResultsView } from "@/components/results/results-view";
import { SearchWidget } from "@/components/search/search-widget";
import { geo } from "@/lib/geo/data";
import { placeLabel } from "@/lib/geo/labels";
import type { Place } from "@/lib/geo/types";
import { parseSearchParams, searchQueryToParams } from "@/lib/search/query";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const parsed = parseSearchParams(await searchParams);
  if (!parsed.ok) return { title: "Flight search", robots: { index: false } };
  const from = geo.resolvePlace(parsed.query.legs[0].from);
  const to = geo.resolvePlace(parsed.query.legs[parsed.query.legs.length - 1].to);
  return {
    title: from && to ? `Flights ${placeLabel(from)} to ${placeLabel(to)}` : "Flight search",
    // Result pages are personal and change daily; keep them out of search indexes.
    robots: { index: false, follow: true },
  };
}

export default async function FlightsPage({ searchParams }: Props) {
  const raw = await searchParams;
  const parsed = parseSearchParams(raw);
  const t = await getTranslations("results");

  if (!parsed.ok) {
    return (
      <div className="container-page max-w-5xl py-10">
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/40 bg-card p-4" role="alert">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
          <div>
            <h1 className="font-semibold">{t("invalidTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("invalidBody")}</p>
          </div>
        </div>
        <div className="card-surface p-4 sm:p-6">
          <SearchWidget variant="panel" />
        </div>
      </div>
    );
  }

  const query = parsed.query;
  const places: Record<string, Place> = {};
  for (const leg of query.legs) {
    for (const id of [leg.from, leg.to]) {
      const p = geo.resolvePlace(id);
      if (p) places[id] = p;
    }
  }
  const searchString = searchQueryToParams(query).toString();

  // key: a new search remounts the view (fresh pagination and widget state).
  return <ResultsView key={searchString} query={query} searchString={searchString} places={places} />;
}
