"use client";

import { useEffect, useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatMoney } from "@/lib/currency/format";
import { HONEYPOT_FIELD } from "@/lib/security/honeypot";

const storageKey = (q: string) => `fw-alert:${q}`;

/**
 * Price alert toggle. Alerts are stored server-side with an unsubscribe token;
 * the token is remembered in this browser so the switch can turn it off again.
 */
export function PriceAlert({ searchQuery, routeLabel, currency, cheapest }: { searchQuery: string; routeLabel: string; currency: string; cheapest?: number }) {
  const t = useTranslations("results.alert");
  const locale = useLocale();
  const id = useId();
  const [token, setToken] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only storage read after mount
      setToken(localStorage.getItem(storageKey(searchQuery)));
    } catch {
      /* storage unavailable */
    }
  }, [searchQuery]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(t("invalidEmail"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, searchQuery, routeLabel, currency, maxPrice: cheapest, [HONEYPOT_FIELD]: honeypot }),
      });
      if (res.status === 429) throw new Error(t("tooMany"));
      if (!res.ok) throw new Error(t("failed"));
      const data = await res.json();
      try {
        localStorage.setItem(storageKey(searchQuery), data.token);
      } catch {
        /* ignore */
      }
      setToken(data.token);
      setShowForm(false);
      toast.success(t("created"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!token) return;
    setBusy(true);
    try {
      await fetch("/api/alerts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      try {
        localStorage.removeItem(storageKey(searchQuery));
      } catch {
        /* ignore */
      }
      setToken(null);
      toast(t("removed"));
    } finally {
      setBusy(false);
    }
  }

  const on = !!token;
  return (
    <section aria-labelledby={`${id}-title`} className="card-surface p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-deal-soft text-price">
          <BellRing className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`${id}-title`} className="text-sm font-semibold">
            {t("title")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {on ? t("onBody") : cheapest ? t("offBody", { price: formatMoney(cheapest, currency, locale) }) : t("offBodyNoPrice")}
          </p>
        </div>
        <Switch
          checked={on || showForm}
          disabled={busy}
          onCheckedChange={(v) => (v ? setShowForm(true) : on ? remove() : setShowForm(false))}
          aria-label={t("toggle")}
        />
      </div>
      {showForm && !on && (
        <form onSubmit={create} className="mt-3 space-y-2" noValidate>
          <Label htmlFor={`${id}-email`} className="text-xs">
            {t("emailLabel")}
          </Label>
          <div className="flex gap-2">
            <Input
              id={`${id}-email`}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? `${id}-err` : undefined}
              className="h-11"
              required
            />
            <Button type="submit" variant="brand" size="lg" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" aria-label={t("saving")} /> : t("save")}
            </Button>
          </div>
          {/* Honeypot: hidden from people and assistive tech */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} name={HONEYPOT_FIELD} />
            </label>
          </div>
          {error && (
            <p id={`${id}-err`} className="text-xs font-medium text-destructive">
              {error}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{t("privacy")}</p>
        </form>
      )}
    </section>
  );
}
