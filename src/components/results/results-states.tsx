"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, PlaneLanding, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ResultsSkeleton() {
  const t = useTranslations("results");
  return (
    <div className="space-y-4" aria-busy="true">
      <p className="sr-only" role="status">
        {t("loading")}
      </p>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="card-surface grid gap-4 p-5 md:grid-cols-[1fr_12rem]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="grid grid-cols-[3.5rem_1fr_3.5rem] items-center gap-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-2" />
              <Skeleton className="h-10" />
            </div>
            <Skeleton className="h-3 w-56" />
          </div>
          <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:justify-center">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-11 w-32 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NoMatches({ onReset }: { onReset: () => void }) {
  const t = useTranslations("results");
  return (
    <div className="card-surface flex flex-col items-center gap-3 p-10 text-center" role="status">
      <SearchX className="size-10 text-muted-foreground" aria-hidden="true" />
      <h2 className="text-lg font-semibold">{t("noMatchesTitle")}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{t("noMatchesBody")}</p>
      <Button variant="brand" size="lg" onClick={onReset}>
        {t("filters.reset")}
      </Button>
    </div>
  );
}

export function NoFlights({ onModify }: { onModify: () => void }) {
  const t = useTranslations("results");
  return (
    <div className="card-surface flex flex-col items-center gap-3 p-10 text-center" role="status">
      <PlaneLanding className="size-10 text-muted-foreground" aria-hidden="true" />
      <h2 className="text-lg font-semibold">{t("noFlightsTitle")}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{t("noFlightsBody")}</p>
      <Button variant="brand" size="lg" onClick={onModify}>
        {t("modify")}
      </Button>
    </div>
  );
}

export function ResultsError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("results");
  return (
    <div className="card-surface flex flex-col items-center gap-3 border-destructive/40 p-10 text-center" role="alert">
      <AlertTriangle className="size-10 text-destructive" aria-hidden="true" />
      <h2 className="text-lg font-semibold">{t("errorTitle")}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{t("errorBody")}</p>
      <Button variant="brand" size="lg" onClick={onRetry}>
        {t("retry")}
      </Button>
    </div>
  );
}
