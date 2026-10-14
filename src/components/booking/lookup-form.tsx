"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidReference, normalizeReference } from "@/lib/booking/reference";

export function LookupForm({ initialReference }: { initialReference: string }) {
  const t = useTranslations("lookup");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const schema = z.object({
    reference: z
      .string()
      .transform(normalizeReference)
      .refine(isValidReference, t("invalidReference")),
    email: z.email(t("invalidEmail")),
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { reference: initialReference, email: "" },
  });

  async function onSubmit(values: z.output<typeof schema>) {
    setError(null);
    const res = await fetch("/api/bookings/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/booking/${data.reference}`);
      return;
    }
    setError(res.status === 429 ? t("tooMany") : t("notFound"));
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="reference" className="font-semibold">
          {t("reference")}
        </Label>
        <Input
          id="reference"
          className="h-11 font-mono uppercase"
          placeholder="FW-261014-AB3CD"
          autoComplete="off"
          aria-invalid={!!errors.reference}
          aria-describedby={errors.reference ? "reference-error" : "reference-hint"}
          {...register("reference")}
        />
        {errors.reference ? (
          <p id="reference-error" className="text-xs font-medium text-destructive">
            {errors.reference.message}
          </p>
        ) : (
          <p id="reference-hint" className="text-xs text-muted-foreground">
            {t("referenceHint")}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lookup-email" className="font-semibold">
          {t("email")}
        </Label>
        <Input
          id="lookup-email"
          type="email"
          autoComplete="email"
          className="h-11"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="text-xs font-medium text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      <Button type="submit" variant="cta" size="xl" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Search className="size-5" aria-hidden="true" />}
        {t("submit")}
      </Button>
    </form>
  );
}
