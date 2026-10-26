import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { HowBookingWorks } from "@/components/home/info-sections";
import { getContent } from "@/content";
import { about } from "@/content/en/legal";

export const metadata: Metadata = { title: about.title, description: about.intro.slice(0, 155) };

export default async function AboutPage() {
  const { about: page } = await getContent();
  return (
    <div>
      <section className="container-page max-w-3xl py-10">
        <h1 className="text-3xl font-extrabold tracking-tight">{page.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{page.intro}</p>
        <ul className="mt-8 space-y-4">
          {page.points.map((p) => (
            <li key={p.title} className="card-surface flex gap-4 p-5">
              <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-success" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">{p.title}</h2>
                <p className="mt-1 text-muted-foreground">{p.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className={buttonVariants({ variant: "cta", size: "xl" })}>
            Search flights
          </Link>
          <Link href="/contact" className={buttonVariants({ variant: "outline", size: "xl" })}>
            Contact customer care
          </Link>
        </div>
      </section>
      <HowBookingWorks />
    </div>
  );
}
