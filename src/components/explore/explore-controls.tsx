"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { CalendarDays, PlaneTakeoff } from "lucide-react";
import { PlaceCombobox } from "@/components/search/place-combobox";
import type { Place } from "@/lib/geo/types";

/** Origin (any country, city or airport) and month. Changing either re-prices on the server. */
export function ExploreControls({ origin, month, months }: { origin: Place; month: string; months: string[] }) {
  const t = useTranslations("explore");
  const router = useRouter();
  const go = (from: string, m: string) => router.push(`/explore?from=${encodeURIComponent(from)}&month=${m}`, { scroll: false });

  return (
    <div className="card-surface grid gap-3 p-4 shadow-float sm:grid-cols-[minmax(0,1fr)_14rem] sm:p-5">
      <PlaceCombobox
        id="explore-from"
        label={t("from")}
        icon={PlaneTakeoff}
        value={origin}
        onChange={(p) => p && go(p.id, month)}
      />
      <div className="flex h-16 items-center gap-3 rounded-lg border border-input bg-card px-3 focus-within:border-sky focus-within:ring-3 focus-within:ring-sky/20">
        <CalendarDays className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <label htmlFor="explore-month" className="block text-xs font-medium text-muted-foreground">
            {t("month")}
          </label>
          <select
            id="explore-month"
            value={month}
            onChange={(e) => go(origin.id, e.target.value)}
            className="w-full bg-transparent text-[0.9375rem] font-semibold outline-none"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {format(parseISO(`${m}-01`), "MMMM yyyy")}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
