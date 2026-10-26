"use client";

import { useId, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { useTranslations } from "next-intl";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

// The calendar (react-day-picker) loads only when a date picker is opened.
const Calendar = dynamic(() => import("@/components/ui/calendar").then((m) => m.Calendar), {
  ssr: false,
  loading: () => <div className="h-[21rem] w-[19rem] animate-pulse rounded-lg bg-muted md:w-[37rem]" aria-hidden="true" />,
});
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MAX_DAYS_AHEAD, toIsoDate } from "@/lib/search/query";
import { cn } from "@/lib/utils";

const fmt = (iso: string | null) => (iso ? format(parseISO(iso), "EEE, d MMM") : null);

type Phase = "depart" | "return";

export function DateField({
  mode,
  depart,
  ret,
  onChange,
  departError,
  returnError,
  departLabel,
  minDate,
  className,
}: {
  mode: "range" | "single";
  depart: string | null;
  ret?: string | null;
  onChange: (value: { depart: string | null; ret: string | null }) => void;
  departError?: string;
  returnError?: string;
  departLabel?: string;
  /** Earliest selectable date (e.g. previous leg in multi-city). */
  minDate?: string | null;
  className?: string;
}) {
  const t = useTranslations("search");
  const wide = useMediaQuery("(min-width: 768px)", true);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("depart");
  const errorId = useId();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const min = minDate ? parseISO(minDate) : today;
  const max = addDays(today, MAX_DAYS_AHEAD);
  const departDate = depart ? parseISO(depart) : undefined;
  const returnDate = ret ? parseISO(ret) : undefined;

  function openAt(p: Phase) {
    setPhase(p);
    setOpen(true);
  }

  function pick(day: Date) {
    const iso = toIsoDate(day);
    if (mode === "single") {
      onChange({ depart: iso, ret: null });
      setOpen(false);
      return;
    }
    if (phase === "depart" || !depart || iso < depart) {
      onChange({ depart: iso, ret: ret && ret >= iso ? ret : null });
      setPhase("return");
    } else {
      onChange({ depart, ret: iso });
      setOpen(false);
    }
  }

  const half = (p: Phase, label: string, value: string | null, error?: string) => (
    <PopoverTrigger asChild>
      <button
        type="button"
        onClick={() => openAt(p)}
        aria-label={`${label}: ${fmt(value) ?? t("chooseDate")}`}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "flex h-16 min-w-0 flex-1 items-center gap-3 px-3 text-left outline-none focus-visible:bg-secondary/60",
          open && phase === p && "bg-secondary/60",
        )}
      >
        <CalendarDays className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block text-xs font-medium text-muted-foreground">{label}</span>
          <span className={cn("block truncate text-[0.9375rem] font-semibold", !value && "font-normal text-muted-foreground")}>
            {fmt(value) ?? t("addDate")}
          </span>
        </span>
      </button>
    </PopoverTrigger>
  );

  const error = departError ?? returnError;
  const calendarProps = {
    numberOfMonths: wide ? 2 : 1,
    disabled: [{ before: min }, { after: max }],
    startMonth: today,
    endMonth: max,
    weekStartsOn: 1 as const,
    autoFocus: true,
    className: "p-3 [--cell-size:--spacing(10)]",
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <div
          className={cn(
            "flex divide-x divide-border overflow-hidden rounded-lg border border-input bg-card focus-within:border-sky focus-within:ring-3 focus-within:ring-sky/20",
            error && "border-destructive",
          )}
        >
          {half("depart", departLabel ?? t("depart"), depart, departError)}
          {mode === "range" && half("return", t("return"), ret ?? null, returnError)}
        </div>
        <PopoverContent align="start" className="w-auto rounded-xl p-0 shadow-float" sideOffset={8}>
          <div className="border-b border-border px-4 py-3 text-sm font-semibold" aria-live="polite">
            {mode === "single" ? t("chooseDate") : phase === "depart" ? t("chooseDepart") : t("chooseReturn")}
          </div>
          {mode === "range" ? (
            <Calendar
              mode="range"
              // react-day-picker's own range logic is bypassed: `pick` decides which end changes.
              selected={{ from: departDate, to: returnDate }}
              onSelect={(_value, triggerDate) => pick(triggerDate)}
              defaultMonth={(phase === "return" ? (returnDate ?? departDate) : departDate) ?? min}
              {...calendarProps}
            />
          ) : (
            <Calendar
              mode="single"
              selected={departDate}
              onSelect={(_value, triggerDate) => pick(triggerDate)}
              defaultMonth={departDate ?? min}
              {...calendarProps}
            />
          )}
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("calendarHint")}</p>
            <Button type="button" variant="brand" size="lg" onClick={() => setOpen(false)}>
              {t("done")}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {error && (
        <p id={errorId} className="mt-1 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
