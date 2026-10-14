import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PlaneTakeoff } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default async function OfferNotFound() {
  const t = await getTranslations("details");
  return (
    <div className="container-page flex max-w-xl flex-col items-center gap-4 py-20 text-center">
      <PlaneTakeoff className="size-12 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-2xl font-bold">{t("goneTitle")}</h1>
      <p className="text-muted-foreground">{t("goneBody")}</p>
      <Link href="/" className={buttonVariants({ variant: "cta", size: "xl" })}>
        {t("searchAgain")}
      </Link>
    </div>
  );
}
