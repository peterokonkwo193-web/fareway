"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COOKIE_NOTICE_COOKIE } from "@/lib/cookie-notice";

/**
 * Rendered on the server only when the fw_cookie_ok cookie is absent, so it is
 * part of the first paint instead of popping in after hydration.
 */
export function CookieNotice() {
  const t = useTranslations("cookies");
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  function dismiss() {
    document.cookie = `${COOKIE_NOTICE_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    setVisible(false);
  }

  return (
    <section
      aria-label={t("title")}
      className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-xl rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-float md:bottom-4"
    >
      <div className="flex gap-3">
        <Cookie className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="space-y-3">
          <p className="text-sm">
            <strong className="font-semibold">{t("title")}. </strong>
            {t("body")}{" "}
            <Link href="/privacy#cookies" className="text-link underline">
              {t("learnMore")}
            </Link>
          </p>
          <Button size="lg" variant="brand" onClick={dismiss}>
            {t("accept")}
          </Button>
        </div>
      </div>
    </section>
  );
}
