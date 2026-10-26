import "server-only";
import { getLocale } from "next-intl/server";
import * as en from "./en/legal";

const byLocale = { en } as const;

/** Long-form content for the current locale (falls back to English). */
export async function getContent() {
  const locale = (await getLocale()) as keyof typeof byLocale;
  return byLocale[locale] ?? en;
}
