"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { CURRENCY_COOKIE } from "@/lib/currency/currencies";
import { LOCALE_COOKIE } from "@/i18n/config";

type Preferences = {
  currency: string;
  setCurrency: (code: string) => void;
  setLocale: (locale: string) => void;
};

const PreferencesContext = createContext<Preferences | null>(null);

const ONE_YEAR = 60 * 60 * 24 * 365;

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

export function PreferencesProvider({
  initialCurrency,
  children,
}: {
  initialCurrency: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [currency, setCurrencyState] = useState(initialCurrency);

  const setCurrency = useCallback(
    (code: string) => {
      writeCookie(CURRENCY_COOKIE, code);
      setCurrencyState(code);
      router.refresh();
    },
    [router],
  );

  const setLocale = useCallback(
    (locale: string) => {
      writeCookie(LOCALE_COOKIE, locale);
      router.refresh();
    },
    [router],
  );

  return (
    <PreferencesContext.Provider value={{ currency, setCurrency, setLocale }}>{children}</PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used inside PreferencesProvider");
  return ctx;
}
