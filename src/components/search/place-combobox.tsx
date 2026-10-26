"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Building2, Globe2, History, Loader2, MapPin, Plane, X, type LucideIcon } from "lucide-react";
import type { Place } from "@/lib/geo/types";
import { placeLabel } from "@/lib/geo/labels";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

type Suggestion = Place & { group: "anywhere" | "country" | "city" | "airport" | "recent" };

const groupIcons: Record<Suggestion["group"], LucideIcon> = {
  anywhere: Globe2,
  country: MapPin,
  city: Building2,
  airport: Plane,
  recent: History,
};

async function fetchPlaces(q: string, everywhere: boolean): Promise<Suggestion[]> {
  const res = await fetch(`/api/places?q=${encodeURIComponent(q)}${everywhere ? "&everywhere=1" : ""}`);
  if (!res.ok) throw new Error("Search failed");
  return (await res.json()).results;
}

export function PlaceCombobox({
  label,
  value,
  onChange,
  allowEverywhere = false,
  recentPlaces = [],
  icon: Icon = Plane,
  error,
  placeholder,
  className,
  id: idProp,
}: {
  label: string;
  value: Place | null;
  onChange: (place: Place | null) => void;
  allowEverywhere?: boolean;
  recentPlaces?: Place[];
  icon?: LucideIcon;
  error?: string;
  placeholder?: string;
  className?: string;
  id?: string;
}) {
  const t = useTranslations("search");
  const autoId = useId();
  const id = idProp ?? autoId;
  const listId = `${id}-listbox`;
  const errorId = `${id}-error`;
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const [active, setActive] = useState(0);
  const debounced = useDebouncedValue(text.trim(), 120);

  const { data = [], isFetching, isPlaceholderData } = useQuery({
    queryKey: ["places", debounced, allowEverywhere],
    queryFn: () => fetchPlaces(debounced, allowEverywhere),
    enabled: open && debounced.length > 0,
    placeholderData: (prev) => prev,
    staleTime: 5 * 60_000,
  });

  const options: Suggestion[] = useMemo(() => {
    if (!debounced) {
      const base: Suggestion[] = allowEverywhere
        ? [{ id: "anywhere", kind: "anywhere", name: t("everywhere"), code: "ANY", detail: t("everywhereDetail"), airports: [], group: "anywhere" }]
        : [];
      return [
        ...base,
        ...recentPlaces
          .filter((p) => p.kind !== "anywhere")
          .map((p) => ({ ...p, group: "recent" as const })),
      ];
    }
    return data.map((p) => (p.kind === "anywhere" ? { ...p, name: t("everywhere"), detail: t("everywhereDetail") } : p));
  }, [debounced, data, allowEverywhere, recentPlaces, t]);

  // Reset the highlighted option whenever the result list changes.
  const optionsKey = options.map((o) => o.id).join("|");
  const [prevKey, setPrevKey] = useState(optionsKey);
  if (prevKey !== optionsKey) {
    setPrevKey(optionsKey);
    setActive(0);
  }

  const showList = open && options.length > 0;
  // Options match what is typed (not a debounced/previous result list).
  const query = text.trim();
  const fresh = !editing || query === "" || (debounced === query && !isFetching && !isPlaceholderData);
  // Enter pressed before results caught up: select once they arrive.
  const [pendingEnter, setPendingEnter] = useState(false);
  useEffect(() => {
    if (!pendingEnter || !fresh) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- completes a keypress made while results were loading
    setPendingEnter(false);
    if (options[0]) select(options[0]);
    // select is stable enough here; it only closes the list and reports the choice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingEnter, fresh, options]);
  const showEmpty = open && !!debounced && !isFetching && options.length === 0;

  function select(option: Suggestion) {
    const { group: _group, ...place } = option;
    onChange(place);
    setEditing(false);
    setText("");
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home" && open) {
      setActive(0);
    } else if (e.key === "End" && open) {
      setActive(Math.max(0, options.length - 1));
    } else if (e.key === "Enter") {
      if (!fresh) {
        e.preventDefault();
        setPendingEnter(true);
      } else if (showList && options[active]) {
        e.preventDefault();
        select(options[active]);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setEditing(false);
        setText("");
      }
    } else if (e.key === "Tab") {
      if (fresh && showList && editing && query && options[active]) select(options[active]);
      setOpen(false);
    }
  }

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (!showList) return;
    document.getElementById(`${id}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, showList, id]);

  const displayValue = editing ? text : value ? placeLabel(value) : "";

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex h-16 items-center gap-3 rounded-lg border border-input bg-card px-3 transition-shadow focus-within:border-sky focus-within:ring-3 focus-within:ring-sky/20",
          error && "border-destructive",
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <label htmlFor={id} className="block text-xs font-medium text-muted-foreground">
            {label}
          </label>
          <input
            ref={inputRef}
            id={id}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showList}
            aria-controls={listId}
            aria-activedescendant={showList ? `${id}-opt-${active}` : undefined}
            aria-invalid={!!error || undefined}
            aria-describedby={error ? errorId : undefined}
            autoComplete="off"
            spellCheck={false}
            placeholder={placeholder ?? t("placePlaceholder")}
            value={displayValue}
            onChange={(e) => {
              setText(e.target.value);
              setEditing(true);
              setOpen(true);
            }}
            onFocus={(e) => {
              setOpen(true);
              e.currentTarget.select();
            }}
            onBlur={() => {
              setOpen(false);
              setEditing(false);
              setText("");
            }}
            onKeyDown={onKeyDown}
            className="h-6 w-full truncate bg-transparent text-[0.9375rem] font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
          />
        </div>
        {isFetching && open ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
        ) : value && !editing ? (
          <button
            type="button"
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t("clearField", { field: label })}
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
              inputRef.current?.focus();
            }}
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-xs font-medium text-destructive">
          {error}
        </p>
      )}

      <div
        className={cn(
          "absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-float sm:min-w-[22rem]",
          !(showList || showEmpty) && "hidden",
        )}
      >
        <ul id={listId} role="listbox" aria-label={label} className="max-h-[22rem] overflow-y-auto py-2">
          {options.map((o, i) => {
            const header = i === 0 || options[i - 1].group !== o.group ? o.group : null;
            const GroupIcon = groupIcons[o.group];
            return (
              <li key={`${o.group}-${o.id}`} role="presentation">
                {header && header !== "anywhere" && (
                  <div role="presentation" className="px-4 pt-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {t(`groups.${header}`)}
                  </div>
                )}
                <div
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => select(o)}
                  className={cn(
                    "mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5",
                    i === active && "bg-secondary text-secondary-foreground",
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-base" aria-hidden="true">
                    {o.kind === "country" && o.flag ? o.flag : <GroupIcon className="size-4 text-primary" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{o.kind === "airport" ? o.name : o.kind === "city" ? `${o.name} (${t("anyAirport")})` : o.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {o.flag && o.kind !== "country" ? `${o.flag} ` : ""}
                      {o.detail}
                    </span>
                  </span>
                  {o.kind !== "anywhere" && (
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold tracking-wider text-muted-foreground tnum">
                      {o.code}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {showEmpty && <p className="px-4 py-3 text-sm text-muted-foreground">{t("noPlaces", { query: debounced })}</p>}
      </div>
      <p className="sr-only" aria-live="polite">
        {open && debounced ? t("resultsCount", { count: options.length }) : ""}
      </p>
    </div>
  );
}
