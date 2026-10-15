import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Compass } from "lucide-react";
import { ExploreControls } from "@/components/explore/explore-controls";
import { ExploreGrid, type ExploreCard } from "@/components/explore/explore-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { effectiveCurrency, fromUsd } from "@/lib/currency/convert";
import { exploreDestinations, exploreMonths } from "@/lib/flights/explore";
import { geo } from "@/lib/geo/data";
import { getDefaultOrigin } from "@/lib/geo/default-origin";
import type { Place } from "@/lib/geo/types";
import { getCurrency } from "@/lib/preferences";

export const metadata: Metadata = {
  title: "Explore everywhere",
  description: "See the cheapest places to fly from your airport, filtered by continent, budget, month and flight time.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function Results({ origin, month, currency }: { origin: Place; month: string; currency: string }) {
  const items = await exploreDestinations(origin, month);
  const code = effectiveCurrency(currency);
  const cards: ExploreCard[] = items.map((i) => ({ ...i, price: fromUsd(i.priceUsd, code) }));
  return <ExploreGrid cards={cards} currency={code} originId={origin.id} />;
}

function GridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Loading destinations">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-64 rounded-xl" />
      ))}
    </div>
  );
}

export default async function ExplorePage({ searchParams }: Props) {
  const sp = await searchParams;
  const t = await getTranslations("explore");
  const months = exploreMonths();
  const monthParam = typeof sp.month === "string" ? sp.month : undefined;
  const month = monthParam && months.includes(monthParam) ? monthParam : months[0];
  const fromParam = typeof sp.from === "string" ? sp.from : undefined;
  const origin =
    (fromParam && fromParam !== "anywhere" ? geo.resolvePlace(fromParam) : undefined) ??
    (await getDefaultOrigin()) ??
    geo.resolvePlace("city:LON")!;
  const currency = await getCurrency();

  return (
    <div>
      <section className="bg-hero text-white">
        <div className="container-page py-10 md:py-14">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase opacity-90">
            <Compass className="size-4" aria-hidden="true" />
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-[2rem] leading-tight font-extrabold tracking-tight md:text-[2.5rem]">{t("title")}</h1>
          <p className="mt-2 max-w-2xl text-white/85">{t("subtitle")}</p>
        </div>
      </section>
      <div className="container-page -mt-8 space-y-6 pb-6">
        <ExploreControls origin={origin} month={month} months={months} />
        <Suspense key={`${origin.id}-${month}-${currency}`} fallback={<GridSkeleton />}>
          <Results origin={origin} month={month} currency={currency} />
        </Suspense>
      </div>
    </div>
  );
}
