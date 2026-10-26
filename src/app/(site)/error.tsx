"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Only the digest is logged: error messages can contain request data.
    console.error("Page error", error.digest ?? "");
  }, [error]);
  return (
    <div className="container-page flex max-w-xl flex-col items-center gap-4 py-20 text-center" role="alert">
      <AlertTriangle className="size-12 text-destructive" aria-hidden="true" />
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground">Please try again. If it keeps happening, contact customer care.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="cta" size="xl" onClick={reset}>
          Try again
        </Button>
        <Link href="/contact" className={buttonVariants({ variant: "outline", size: "xl" })}>
          Contact customer care
        </Link>
      </div>
    </div>
  );
}
