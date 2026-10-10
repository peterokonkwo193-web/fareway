import "server-only";
import { cookies } from "next/headers";
import { CURRENCY_COOKIE, DEFAULT_CURRENCY } from "@/lib/currency/constants";
import { isSupportedCurrency } from "@/lib/currency/currencies";

export async function getCurrency(): Promise<string> {
  const store = await cookies();
  const value = store.get(CURRENCY_COOKIE)?.value?.toUpperCase();
  return value && isSupportedCurrency(value) ? value : DEFAULT_CURRENCY;
}
