"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, Minus, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CABINS, MAX_PASSENGERS, type Cabin } from "@/lib/search/query";
import { cn } from "@/lib/utils";

type Counts = { adults: number; children: number; infants: number };

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const t = useTranslations("search");
  return (
    <div className="flex items-center justify-between gap-4 py-3" role="group" aria-label={label}>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="rounded-full"
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label={t("decrease", { label })}
        >
          <Minus className="size-4" />
        </Button>
        <output className="w-5 text-center font-semibold tnum" aria-live="polite">
          {value}
        </output>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="rounded-full"
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          aria-label={t("increase", { label })}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function TravellersPopover({
  counts,
  cabin,
  onCountsChange,
  onCabinChange,
  variant = "field",
  className,
}: {
  counts: Counts;
  cabin: Cabin;
  onCountsChange: (c: Partial<Counts>) => void;
  onCabinChange: (c: Cabin) => void;
  variant?: "field" | "compact";
  className?: string;
}) {
  const t = useTranslations("search");
  const total = counts.adults + counts.children + counts.infants;
  const remaining = MAX_PASSENGERS - total;
  const summary = `${t("travellerCount", { count: total })}, ${t(`cabins.${cabin}`)}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {variant === "field" ? (
          <button
            type="button"
            className={cn(
              "flex h-16 w-full items-center gap-3 rounded-lg border border-input bg-card px-3 text-left outline-none focus-visible:border-sky focus-visible:ring-3 focus-visible:ring-sky/20",
              className,
            )}
            aria-label={`${t("travellersAndCabin")}: ${summary}`}
          >
            <Users className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-muted-foreground">{t("travellersAndCabin")}</span>
              <span className="block truncate text-[0.9375rem] font-semibold">{summary}</span>
            </span>
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
          </button>
        ) : (
          <Button type="button" variant="outline" size="lg" className={cn("rounded-full", className)} aria-label={`${t("travellersAndCabin")}: ${summary}`}>
            <Users className="size-4" aria-hidden="true" />
            {summary}
            <ChevronDown className="size-4" aria-hidden="true" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] rounded-xl p-4 shadow-float">
        <div className="divide-y divide-border">
          <Stepper
            label={t("adults")}
            hint={t("adultsHint")}
            value={counts.adults}
            min={1}
            max={counts.adults + remaining}
            onChange={(adults) => onCountsChange({ adults, infants: Math.min(counts.infants, adults) })}
          />
          <Stepper
            label={t("children")}
            hint={t("childrenHint")}
            value={counts.children}
            min={0}
            max={counts.children + remaining}
            onChange={(children) => onCountsChange({ children })}
          />
          <Stepper
            label={t("infants")}
            hint={t("infantsHint")}
            value={counts.infants}
            min={0}
            max={Math.min(counts.adults, counts.infants + remaining)}
            onChange={(infants) => onCountsChange({ infants })}
          />
        </div>
        <div className="mt-3 border-t border-border pt-4">
          <p id="cabin-class-label" className="mb-2 text-sm font-semibold">
            {t("cabinClass")}
          </p>
          <RadioGroup
            aria-labelledby="cabin-class-label"
            value={cabin}
            onValueChange={(v) => onCabinChange(v as Cabin)}
            className="grid grid-cols-2 gap-2"
          >
            {CABINS.map((c) => (
              <Label
                key={c}
                htmlFor={`cabin-${c}`}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary"
              >
                <RadioGroupItem id={`cabin-${c}`} value={c} />
                {t(`cabins.${c}`)}
              </Label>
            ))}
          </RadioGroup>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t("maxTravellers", { max: MAX_PASSENGERS })}</p>
      </PopoverContent>
    </Popover>
  );
}
