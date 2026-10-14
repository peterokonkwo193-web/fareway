import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LookupForm } from "@/components/booking/lookup-form";

export const metadata: Metadata = {
  title: "Find my booking request",
  description: "Look up a Fareway booking request with your reference number and email address.",
};

export default async function LookupPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const t = await getTranslations("lookup");
  return (
    <div className="container-page max-w-xl py-10">
      <h1 className="text-2xl font-bold tracking-tight md:text-[1.75rem]">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("intro")}</p>
      <div className="card-surface mt-6 p-5 sm:p-6">
        <LookupForm initialReference={typeof ref === "string" ? ref.slice(0, 40) : ""} />
      </div>
    </div>
  );
}
