"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Compass, LifeBuoy, Plane, Search, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/flights");
  return pathname.startsWith(href);
}

export function MainNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const links = [
    { href: "/", label: t("flights"), icon: Plane },
    { href: "/explore", label: t("explore"), icon: Compass },
  ];
  return (
    <nav aria-label={t("primary")} className="hidden items-center gap-1 md:flex">
      {links.map(({ href, label }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
      <span className="px-3 py-2 text-sm text-muted-foreground" aria-disabled="true">
        {t("hotels")}
        <span className="sr-only"> ({t("comingSoon")})</span>
      </span>
      <span className="px-3 py-2 text-sm text-muted-foreground" aria-disabled="true">
        {t("carHire")}
        <span className="sr-only"> ({t("comingSoon")})</span>
      </span>
    </nav>
  );
}

export function MobileBottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const items = [
    { href: "/", label: t("search"), icon: Search },
    { href: "/explore", label: t("explore"), icon: Compass },
    { href: "/booking/lookup", label: t("myBooking"), icon: Ticket },
    { href: "/contact", label: t("help"), icon: LifeBuoy },
  ];
  if (pathname.startsWith("/admin")) return null;
  return (
    <nav
      aria-label={t("primary")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground",
                  active && "text-primary",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
