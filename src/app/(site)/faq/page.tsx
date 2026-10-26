import type { Metadata } from "next";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getContent } from "@/content";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "How Fareway booking requests, prices, payment and customer care work.",
};

export default async function FaqPage() {
  const { faq } = await getContent();
  // FAQPage structured data for search engines.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Frequently asked questions</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Quick answers about requests, prices and payment. Still stuck?{" "}
        <Link href="/contact" className="text-link underline">
          Contact customer care
        </Link>
        .
      </p>
      <h2 className="sr-only">Questions and answers</h2>
      <Accordion type="single" collapsible className="card-surface mt-8 px-4 sm:px-6">
        {faq.map((f, i) => (
          <AccordionItem key={i} value={`q${i}`}>
            <AccordionTrigger className="py-4 text-base font-semibold">{f.q}</AccordionTrigger>
            <AccordionContent className="text-base text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ ...jsonLd, url: `${siteConfig.url}/faq` }) }} />
    </div>
  );
}
