"use client";

import { useLocale, useTranslations } from "next-intl";
import { Gauge, Sparkles, Tag } from "lucide-react";
import { formatMoney } from "@/lib/currency/format";
import { SORT_MODES, type SortMode, type SortSummary } from "@/lib/flights/sort";
import { formatDuration } from "@/lib/flights/time";
import { cn } from "@/lib/utils";

const icons = { cheapest: Tag, fastest: Gauge, best: Sparkles } as const;

export function SortTabs({
  value,
  onChange,
  summaries,
  currency,
}: {
  value: SortMode;
  onChange: (mode: SortMode) => void;
  summaries: Record<SortMode, SortSummary>;
  currency: string;
}) {
  const t = useTranslations("results");
  const locale = useLocale();
  return (
    <div role="radiogroup" aria-label={t("sortBy")} className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
      {SORT_MODES.map((mode) => {
        const Icon = icons[mode];
        const s = summaries[mode];
        const active = value === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(mode)}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center rounded-lg px-1 py-2 text-center transition-colors",
              active ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:bg-card/60",
            )}
          >
            <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", active && "text-primary")}>
              <Icon className="size-4" aria-hidden="true" />
              {t(`sort.${mode}`)}
            </span>
            {s && (
              <span className="mt-0.5 text-xs tnum">
                <span className={cn("font-semibold", mode === "cheapest" && "text-price")}>{formatMoney(s.price, currency, locale)}</span>
                <span className="hidden sm:inline"> · {t("avgDuration", { duration: formatDuration(s.avgDurationMin) })}</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
