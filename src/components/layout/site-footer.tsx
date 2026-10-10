import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/layout/logo";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const columns = [
    {
      title: t("about"),
      links: [
        { href: "/about", label: t("aboutUs") },
        { href: "/#how-booking-works", label: t("howBookingWorks") },
        { href: "/contact", label: t("contact") },
      ],
    },
    {
      title: t("explore"),
      links: [
        { href: "/explore", label: t("exploreEverywhere") },
        { href: "/#popular", label: t("popularDestinations") },
        { href: "/#cheapest", label: t("cheapestMonth") },
      ],
    },
    {
      title: t("help"),
      links: [
        { href: "/faq", label: t("faq") },
        { href: "/booking/lookup", label: t("findBooking") },
        { href: "/data-request", label: t("dataRequest") },
      ],
    },
    {
      title: t("legal"),
      links: [
        { href: "/terms", label: t("terms") },
        { href: "/privacy", label: t("privacy") },
        { href: "/privacy#cookies", label: t("cookies") },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t border-border bg-card pb-20 md:pb-0">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-10 py-12 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-1">
          <Logo />
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="mb-3 text-sm font-semibold text-foreground">{col.title}</h2>
            <ul className="space-y-1">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-block py-1.5 text-sm text-muted-foreground hover:text-primary hover:underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-3 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
            {t("noPayment")}
          </p>
          <p className="shrink-0">{t("copyright", { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
