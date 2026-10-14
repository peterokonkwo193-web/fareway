"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Clock, Copy, Mail, MessageCircle, MessagesSquare, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ContactLinks } from "@/lib/booking/contact-links";
import { cn } from "@/lib/utils";

export function CopyReference({ reference }: { reference: string }) {
  const t = useTranslations("confirmation");
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyFailed"));
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="rounded-xl border-2 border-dashed border-primary/40 bg-card px-4 py-2 font-mono text-2xl font-extrabold tracking-wider sm:text-3xl" aria-label={t("referenceSr", { reference: reference.split("").join(" ") })}>
        {reference}
      </p>
      <Button type="button" variant="outline" size="lg" onClick={copy} aria-live="polite">
        {copied ? <Check className="size-4 text-success" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
        {copied ? t("copied") : t("copy")}
      </Button>
    </div>
  );
}

function ContactButton({ href, icon: Icon, title, detail, className, external }: { href: string; icon: typeof Phone; title: string; detail: string; className: string; external?: boolean }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn("flex min-h-20 items-center gap-4 rounded-xl px-5 py-4 font-semibold shadow-card transition-transform hover:-translate-y-0.5", className)}
    >
      <Icon className="size-7 shrink-0" aria-hidden="true" />
      <span>
        <span className="block text-base">{title}</span>
        <span className="block text-sm font-normal opacity-90">{detail}</span>
      </span>
    </a>
  );
}

export function CustomerCarePanel({
  links,
  phone,
  email,
  whatsapp,
  hours,
  responseTime,
}: {
  links: ContactLinks;
  phone: string;
  email: string;
  whatsapp: string;
  hours: string;
  responseTime: string;
}) {
  const t = useTranslations("confirmation");
  const [chatOpen, setChatOpen] = useState(false);
  const anyContact = links.whatsapp || links.phone || links.email;
  return (
    <section aria-labelledby="care-title" className="space-y-4">
      <div>
        <h2 id="care-title" className="text-xl font-bold">
          {t("careTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("careBody")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {links.whatsapp && (
          <ContactButton href={links.whatsapp} external icon={MessageCircle} title={t("whatsapp")} detail={`+${whatsapp}`} className="bg-[#157a45] text-white" />
        )}
        {links.phone && <ContactButton href={links.phone} icon={Phone} title={t("call")} detail={phone} className="bg-brand text-brand-foreground" />}
        {links.email && <ContactButton href={links.email} icon={Mail} title={t("email")} detail={email} className="bg-cta text-cta-foreground" />}
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="flex min-h-20 items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 text-left font-semibold shadow-card transition-transform hover:-translate-y-0.5"
        >
          <MessagesSquare className="size-7 shrink-0 text-primary" aria-hidden="true" />
          <span>
            <span className="block text-base">{t("chat")}</span>
            <span className="block text-sm font-normal text-muted-foreground">{t("chatDetail")}</span>
          </span>
        </button>
      </div>
      {!anyContact && <p className="rounded-xl bg-warning-soft p-3 text-sm">{t("noContactConfigured")}</p>}
      {(hours || responseTime) && (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            {hours && <span className="font-semibold text-foreground">{t("hours", { hours })}</span>} {responseTime}
          </span>
        </p>
      )}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("chatTitle")}</DialogTitle>
            <DialogDescription>{t("chatPlaceholder")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {links.whatsapp && (
              <Button asChild variant="brand" size="lg">
                <a href={links.whatsapp} target="_blank" rel="noopener noreferrer">
                  {t("whatsapp")}
                </a>
              </Button>
            )}
            {links.email && (
              <Button asChild variant="outline" size="lg">
                <a href={links.email}>{t("email")}</a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
