import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Ticket } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { MainNav } from "@/components/layout/main-nav";
import { CurrencyPicker, LocaleMenu, ThemeToggle } from "@/components/layout/header-controls";
import { currencies } from "@/lib/currency/currencies";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="container-page flex h-16 items-center gap-4">
        <Logo />
        <MainNav />
        <div className="ml-auto flex items-center gap-0.5">
          <CurrencyPicker currencies={currencies} className="px-2 sm:px-3" />
          <div className="hidden sm:block">
            <LocaleMenu />
          </div>
          <ThemeToggle />
          <Link
            href="/booking/lookup"
            className="ml-1 hidden items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:border-sky hover:text-primary lg:inline-flex"
          >
            <Ticket className="size-4" aria-hidden="true" />
            {t("manageBooking")}
          </Link>
        </div>
      </div>
    </header>
  );
}
