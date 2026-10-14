import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Bottom bar with the total and the main action. Sits above the mobile nav. */
export function StickyPriceBar({
  price,
  caption,
  href,
  cta,
}: {
  price: string;
  caption: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-14 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-float backdrop-blur md:bottom-0">
      <div className="container-page flex items-center justify-between gap-4 py-3">
        <div>
          <p className="text-2xl leading-tight font-bold text-price tnum">{price}</p>
          <p className="text-xs text-muted-foreground">{caption}</p>
        </div>
        <Link href={href} className={cn(buttonVariants({ variant: "cta", size: "xl" }), "px-5 sm:px-8")}>
          {cta}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
