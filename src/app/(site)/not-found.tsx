import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex max-w-xl flex-col items-center gap-4 py-20 text-center">
      <Compass className="size-12 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-2xl font-bold">We could not find that page</h1>
      <p className="text-muted-foreground">The link may be old or mistyped. Try a new search or explore destinations.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonVariants({ variant: "cta", size: "xl" })}>
          Search flights
        </Link>
        <Link href="/explore" className={buttonVariants({ variant: "outline", size: "xl" })}>
          Explore
        </Link>
      </div>
    </div>
  );
}
