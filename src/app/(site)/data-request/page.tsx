import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DataRequestForm } from "@/components/legal/data-request-form";

export const metadata: Metadata = {
  title: "Delete my data",
  description: "Ask Fareway to delete the personal data linked to your email address.",
};

export default async function DataRequestPage() {
  const t = await getTranslations("dataRequest");
  return (
    <div className="container-page max-w-xl py-10">
      <h1 className="text-2xl font-bold tracking-tight md:text-[1.75rem]">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("intro")}</p>
      <div className="card-surface mt-6 p-5 sm:p-6">
        <DataRequestForm />
      </div>
    </div>
  );
}
