import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Globe2, Headset, MessagesSquare, Plane, ScanSearch, ShieldCheck, Ticket, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SectionHeading({ eyebrow, title, id, action }: { eyebrow: string; title: string; id?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-semibold tracking-wider text-link uppercase">{eyebrow}</p>
        <h2 id={id} className="mt-1 text-2xl leading-tight font-bold tracking-tight md:text-[1.75rem]">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

export async function ExploreBanner() {
  const t = await getTranslations("home");
  return (
    <section aria-labelledby="explore-banner" className="container-page">
      <div className="grid items-center gap-6 overflow-hidden rounded-2xl border border-border bg-secondary p-6 md:grid-cols-[1fr_auto] md:p-8">
        <div>
          <p className="text-xs font-semibold tracking-wider text-link uppercase">{t("exploreEyebrow")}</p>
          <h2 id="explore-banner" className="mt-1 text-2xl font-bold tracking-tight">
            {t("exploreTitle")}
          </h2>
          <p className="mt-2 max-w-xl text-muted-foreground">{t("exploreBody")}</p>
          <Button asChild variant="brand" size="lg" className="mt-5">
            <Link href="/explore">
              {t("exploreCta")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <Image
          src="/images/destinations/world-map.jpg"
          alt=""
          width={280}
          height={180}
          className="hidden h-44 w-72 rounded-xl object-cover shadow-card md:block"
        />
      </div>
    </section>
  );
}

export async function WhyFareway() {
  const t = await getTranslations("home");
  const items = [
    { key: "global", icon: Globe2 },
    { key: "people", icon: Headset },
    { key: "honest", icon: ShieldCheck },
  ] as const;
  return (
    <section aria-labelledby="why" className="container-page">
      <SectionHeading eyebrow={t("whyEyebrow")} title={t("whyTitle")} id="why" />
      <ul className="grid gap-4 md:grid-cols-3">
        {items.map(({ key, icon: Icon }) => (
          <li key={key} className="card-surface p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-semibold">{t(`why.${key}.title`)}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{t(`why.${key}.body`)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function HowBookingWorks() {
  const t = await getTranslations("home");
  const steps = [
    { key: "search", icon: ScanSearch },
    { key: "request", icon: Ticket },
    { key: "contact", icon: MessagesSquare },
    { key: "pay", icon: Wallet },
  ] as const;
  return (
    <section id="how-booking-works" aria-labelledby="how" className="scroll-mt-24 bg-card py-14">
      <div className="container-page">
        <SectionHeading eyebrow={t("howEyebrow")} title={t("howTitle")} id="how" />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ key, icon: Icon }, i) => (
            <li key={key} className="relative rounded-xl border border-border bg-background p-6">
              <span className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground tnum">
                  {i + 1}
                </span>
                <Icon className="size-5 text-link" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold">{t(`how.${key}.title`)}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{t(`how.${key}.body`)}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
          <Plane className="mt-0.5 size-4 shrink-0 text-link" aria-hidden="true" />
          {t("howNote")}
        </p>
      </div>
    </section>
  );
}
