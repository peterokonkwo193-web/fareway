"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Globe, Moon, Sun, Wallet } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { usePreferences } from "@/components/preferences-provider";
import { localeLabels, locales } from "@/i18n/config";
import type { CurrencyInfo } from "@/lib/currency/currencies";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const t = useTranslations("common");
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon-lg"
      aria-label={t("toggleTheme")}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-5 dark:hidden" />
      <Moon className="hidden size-5 dark:block" />
    </Button>
  );
}

export function LocaleMenu() {
  const t = useTranslations("common");
  const locale = useLocale();
  const { setLocale } = usePreferences();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="lg" aria-label={`${t("language")}: ${localeLabels[locale as keyof typeof localeLabels]}`}>
          <Globe className="size-4" />
          <span className="uppercase">{locale}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("language")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={locale} onValueChange={setLocale}>
          {locales.map((l) => (
            <DropdownMenuRadioItem key={l} value={l}>
              {localeLabels[l]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CurrencyPicker({ currencies, className }: { currencies: CurrencyInfo[]; className?: string }) {
  const t = useTranslations("common");
  const { currency, setCurrency } = usePreferences();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const current = currencies.find((c) => c.code === currency);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return currencies;
    return currencies.filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }, [currencies, query]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="lg" className={className} aria-label={`${t("currency")}: ${currency}`}>
          <Wallet className="size-4" />
          <span className="tnum">
            {current?.symbol && current.symbol !== currency ? `${current.symbol} ` : ""}
            {currency}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("chooseCurrency")}</DialogTitle>
          <DialogDescription>{t("indicativePrices")}</DialogDescription>
        </DialogHeader>
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchCurrencies")}
          aria-label={t("searchCurrencies")}
          className="h-11"
        />
        <ul className="grid max-h-[55vh] grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2 md:grid-cols-3" role="list">
          {filtered.map((c) => {
            const selected = c.code === currency;
            return (
              <li key={c.code}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setCurrency(c.code);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-muted",
                    selected && "bg-secondary text-secondary-foreground",
                  )}
                >
                  <span className="w-10 font-semibold tnum">{c.code}</span>
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  <span className="text-muted-foreground">{c.symbol}</span>
                  {selected && <Check className="size-4" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && <li className="p-3 text-sm text-muted-foreground">{t("noMatches")}</li>}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
