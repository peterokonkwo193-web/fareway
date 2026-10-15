"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HONEYPOT_FIELD } from "@/lib/security/honeypot";

export function DataRequestForm() {
  const t = useTranslations("dataRequest");
  const [email, setEmail] = useState("");
  const [reference, setReference] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError(t("invalidEmail"));
    if (!confirm) return setError(t("confirmRequired"));
    setState("busy");
    const res = await fetch("/api/data-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, reference, confirm, [HONEYPOT_FIELD]: honeypot }),
    }).catch(() => null);
    if (res?.ok) setState("done");
    else {
      setState("error");
      setError(res?.status === 429 ? t("tooMany") : t("failed"));
    }
  }

  if (state === "done") {
    return (
      <div role="status" className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-success" aria-hidden="true" />
        <div>
          <p className="font-semibold">{t("doneTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("doneBody")}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="dr-email" className="font-semibold">
          {t("email")}
        </Label>
        <Input id="dr-email" type="email" autoComplete="email" className="h-11" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="dr-ref" className="font-semibold">
          {t("reference")}
        </Label>
        <Input id="dr-ref" className="h-11 font-mono uppercase" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="FW-261014-AB3CD" />
      </div>
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </label>
      </div>
      <div className="flex items-start gap-3">
        <Checkbox id="dr-confirm" checked={confirm} onCheckedChange={(v) => setConfirm(v === true)} className="mt-0.5" />
        <Label htmlFor="dr-confirm" className="block text-sm leading-snug font-normal">
          {t("confirm")}
        </Label>
      </div>
      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      <Button type="submit" variant="brand" size="xl" className="w-full" disabled={state === "busy"}>
        {state === "busy" && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
        {t("submit")}
      </Button>
    </form>
  );
}
