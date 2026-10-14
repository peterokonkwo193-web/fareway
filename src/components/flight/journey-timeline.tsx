import { format, parseISO } from "date-fns";
import { useTranslations } from "next-intl";
import { Armchair, Clock, MoonStar, Plane, PlugZap, Utensils, Wifi } from "lucide-react";
import { AirlineBadge } from "@/components/flight/airline-badge";
import { formatDuration } from "@/lib/flights/time";
import type { Slice } from "@/lib/flights/types";
import { cn } from "@/lib/utils";

const fmtDay = (local: string) => format(parseISO(local), "EEE, d MMM");

function Stop({ time, dayNote, airport, terminal, tone = "end" }: { time: string; dayNote?: string; airport: string; terminal?: string; tone?: "start" | "end" }) {
  const t = useTranslations("details");
  return (
    <div className="relative grid grid-cols-[1.25rem_1fr] gap-3">
      <span
        aria-hidden="true"
        className={cn("relative z-10 mt-1.5 size-3.5 rounded-full border-[3px] bg-card", tone === "start" ? "border-primary" : "border-sky")}
      />
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div>
          <p className="text-lg font-bold tnum">
            {time}
            {dayNote && <span className="ml-2 rounded-md bg-warning-soft px-1.5 py-0.5 text-xs font-semibold text-warning">{dayNote}</span>}
          </p>
          <p className="text-sm text-muted-foreground">{airport}</p>
        </div>
        {terminal && (
          <span className="rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground">{t("terminal", { terminal })}</span>
        )}
      </div>
    </div>
  );
}

export function JourneyTimeline({ slice, title, icon = "out" }: { slice: Slice; title: string; icon?: "out" | "back" }) {
  const t = useTranslations("details");
  const headingId = `journey-${title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <section aria-labelledby={headingId} className="card-surface p-4 sm:p-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-secondary text-primary">
            <Plane className={cn("size-5", icon === "back" && "rotate-180")} aria-hidden="true" />
          </span>
          <div>
            <h2 id={headingId} className="font-semibold">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {fmtDay(slice.departLocal)} · {formatDuration(slice.durationMin)} ·{" "}
              {slice.stops === 0 ? t("direct") : t("stops", { count: slice.stops })}
            </p>
          </div>
        </div>
      </header>

      <ol className="relative space-y-4 before:absolute before:top-3 before:bottom-3 before:left-[0.5625rem] before:w-0.5 before:bg-border">
        {slice.segments.map((seg, i) => {
          const layover = slice.layovers[i];
          const dayOffset = Math.round((Date.parse(seg.arriveLocal.slice(0, 10)) - Date.parse(seg.departLocal.slice(0, 10))) / 86_400_000);
          return (
            <li key={seg.flightNumber + seg.departLocal} className="space-y-4">
              <Stop
                tone="start"
                time={seg.departLocal.slice(11, 16)}
                dayNote={i > 0 ? fmtDay(seg.departLocal) : undefined}
                airport={`${seg.from.name} (${seg.from.iata})`}
                terminal={seg.from.terminal}
              />
              <div className="ml-8 rounded-xl border border-border bg-muted/50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <AirlineBadge carrier={seg.carrier} size="sm" />
                    {seg.carrier.name} · {seg.flightNumber}
                  </p>
                  <p className="text-sm font-semibold text-link tnum">{formatDuration(seg.durationMin)}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {seg.aircraft} · {t("distance", { km: seg.distanceKm.toLocaleString("en") })}
                </p>
                <ul className="mt-2 flex flex-wrap gap-2 text-xs" aria-label={t("onboard")}>
                  <li className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-1">
                    <Armchair className="size-3.5" aria-hidden="true" />
                    {t("seatIncluded")}
                  </li>
                  {seg.amenities.wifi && (
                    <li className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-1">
                      <Wifi className="size-3.5" aria-hidden="true" />
                      {t("wifi")}
                    </li>
                  )}
                  {seg.amenities.power && (
                    <li className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-1">
                      <PlugZap className="size-3.5" aria-hidden="true" />
                      {t("power")}
                    </li>
                  )}
                  {seg.amenities.meal && (
                    <li className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-1">
                      <Utensils className="size-3.5" aria-hidden="true" />
                      {t("meal")}
                    </li>
                  )}
                </ul>
              </div>
              <Stop
                time={seg.arriveLocal.slice(11, 16)}
                dayNote={dayOffset > 0 ? t("plusDay", { count: dayOffset }) : undefined}
                airport={`${seg.to.name} (${seg.to.iata})`}
                terminal={seg.to.terminal}
              />
              {layover && (
                <div
                  className={cn(
                    "ml-8 flex items-start gap-2 rounded-xl border border-dashed px-3 py-2.5 text-sm",
                    layover.overnight ? "border-warning bg-warning-soft" : "border-border",
                  )}
                >
                  {layover.overnight ? (
                    <MoonStar className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                  ) : (
                    <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  )}
                  <p>
                    <span className="font-semibold">
                      {t("layover", { duration: formatDuration(layover.durationMin), city: layover.airport.city, code: layover.airport.iata })}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {layover.overnight ? t("overnightNote") : layover.durationMin < 75 ? t("shortConnection") : t("changePlanes")}
                    </span>
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
