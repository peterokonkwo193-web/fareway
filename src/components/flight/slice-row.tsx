import { useTranslations } from "next-intl";
import { Plane } from "lucide-react";
import type { Slice } from "@/lib/flights/types";
import { formatDuration } from "@/lib/flights/time";
import { cn } from "@/lib/utils";

/** Compact journey line: 13:20 LHR ——— 8h 10m · Direct ——— 16:30 JFK */
export function SliceRow({ slice, label }: { slice: Slice; label?: string }) {
  const t = useTranslations("results");
  const direct = slice.stops === 0;
  const via = slice.layovers.map((l) => l.airport.iata).join(", ");
  const stopsText = direct ? t("direct") : t("stopsVia", { count: slice.stops, via });
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-4">
      <div className="min-w-14">
        {label && <p className="text-[0.6875rem] font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>}
        <p className="text-lg leading-tight font-bold tnum sm:text-xl">{slice.departLocal.slice(11, 16)}</p>
        <p className="text-xs font-semibold tracking-wider text-muted-foreground">{slice.from.iata}</p>
      </div>
      <div className="flex min-w-0 flex-col items-center text-center">
        <span className="text-xs text-muted-foreground tnum">{formatDuration(slice.durationMin)}</span>
        <div className="relative my-1 flex w-full items-center" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          {slice.layovers.map((l) => (
            <span key={l.airport.iata + l.durationMin} className="mx-1 size-2 rounded-full bg-warning" />
          ))}
          <Plane className="mx-1 size-3.5 text-sky" />
          <span className="h-px flex-1 bg-border" />
        </div>
        <span className={cn("max-w-full truncate text-xs font-semibold", direct ? "text-success-foreground" : "text-warning")}>{stopsText}</span>
      </div>
      <div className="min-w-14 text-right">
        {label && <p className="text-[0.6875rem] text-transparent select-none" aria-hidden="true">.</p>}
        <p className="text-lg leading-tight font-bold tnum sm:text-xl">
          {slice.arriveLocal.slice(11, 16)}
          {slice.dayOffset > 0 && (
            <sup className="ml-0.5 text-[0.6875rem] font-semibold text-warning" title={t("plusDays", { count: slice.dayOffset })}>
              +{slice.dayOffset}
            </sup>
          )}
        </p>
        <p className="text-xs font-semibold tracking-wider text-muted-foreground">{slice.to.iata}</p>
      </div>
      <span className="sr-only">
        {t("sliceSummary", {
          from: slice.from.city,
          to: slice.to.city,
          depart: slice.departLocal.slice(11, 16),
          arrive: slice.arriveLocal.slice(11, 16),
          duration: formatDuration(slice.durationMin),
          stops: stopsText,
        })}
      </span>
    </div>
  );
}
