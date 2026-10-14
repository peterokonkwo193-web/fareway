import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { BadgeCheck } from "lucide-react";
import { SearchWidget } from "@/components/search/search-widget";
import { ExploreBanner, HowBookingWorks, WhyFareway } from "@/components/home/info-sections";
import { CheapestThisMonth, PopularDestinations } from "@/components/home/deal-sections";
import { DealsSkeleton } from "@/components/home/deals-skeleton";
import { getDefaultOrigin } from "@/lib/geo/default-origin";
import { geo } from "@/lib/geo/data";
import { getCurrency } from "@/lib/preferences";

export default async function HomePage() {
  const [t, defaultOrigin, currency] = await Promise.all([getTranslations("home"), getDefaultOrigin(), getCurrency()]);
  // Deals need an origin; London is a neutral fallback when the visitor's country is unknown.
  const dealOrigin = defaultOrigin ?? geo.resolvePlace("city:LON")!;
  return (
    <>
      <section className="bg-hero pb-28 text-white md:pb-32">
        <div className="container-page pt-10 md:pt-16">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold">
            <BadgeCheck className="size-4" aria-hidden="true" />
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 text-[2rem] leading-[2.375rem] font-extrabold tracking-tight md:text-[2.5rem] md:leading-[3rem]">
            {t("title")}
          </h1>
          <p className="mt-3 max-w-2xl text-white/85 md:text-lg">{t("subtitle")}</p>
        </div>
      </section>
      <div className="container-page -mt-24 md:-mt-24">
        <div className="rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-float sm:p-6">
          <SearchWidget defaultOrigin={defaultOrigin} />
        </div>
      </div>
      <div className="mt-14 space-y-14">
        <ExploreBanner />
        <Suspense fallback={<DealsSkeleton />}>
          <PopularDestinations origin={dealOrigin} currency={currency} />
          <div className="h-14" aria-hidden="true" />
          <CheapestThisMonth origin={dealOrigin} currency={currency} />
        </Suspense>
        <WhyFareway />
        <HowBookingWorks />
      </div>
    </>
  );
}
