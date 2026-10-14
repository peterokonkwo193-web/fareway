"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { AlertCircle, Loader2, Lock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildBookingSchema, type BookingFormInput, type BookingFormValues, type PassengerType } from "@/lib/booking/schema";
import type { CountryOption } from "@/lib/geo/country-options";
import { HONEYPOT_FIELD } from "@/lib/security/honeypot";
import { cn } from "@/lib/utils";

const selectClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-sky focus-visible:ring-3 focus-visible:ring-sky/20 aria-[invalid=true]:border-destructive";

function Field({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1 text-xs font-medium text-destructive">
          <AlertCircle className="size-3.5" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (id: string, error?: string, hint?: boolean) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

export function BookingForm({
  offerId,
  travelDate,
  passengers,
  countries,
}: {
  offerId: string;
  travelDate: string;
  passengers: { adults: number; children: number; infants: number };
  countries: CountryOption[];
}) {
  const t = useTranslations("booking");
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const schema = useMemo(() => buildBookingSchema({ travelDate, passengers }), [travelDate, passengers]);

  const types: PassengerType[] = [
    ...Array<PassengerType>(passengers.adults).fill("ADULT"),
    ...Array<PassengerType>(passengers.children).fill("CHILD"),
    ...Array<PassengerType>(passengers.infants).fill("INFANT"),
  ];

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormInput, unknown, BookingFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      contactName: "",
      email: "",
      phoneCountry: "",
      phoneNumber: "",
      passengers: types.map((type) => ({ type, firstName: "", lastName: "", dateOfBirth: "", nationality: "" })),
      notes: "",
      consent: undefined as unknown as true,
      [HONEYPOT_FIELD]: "",
    },
  });
  const { fields } = useFieldArray({ control, name: "passengers" });

  const dialCountries = useMemo(() => countries.filter((c) => c.dial), [countries]);
  const typeCounters: Record<PassengerType, number> = { ADULT: 0, CHILD: 0, INFANT: 0 };

  async function onSubmit(values: BookingFormValues) {
    setSubmitError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, form: values }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 422 && data.fields) {
        for (const [path, message] of Object.entries(data.fields as Record<string, string>)) {
          setError(path as keyof BookingFormInput, { message });
        }
        setSubmitError(t("errors.checkFields"));
        return;
      }
      if (res.status === 410) {
        setSubmitError(t("errors.offerGone"));
        return;
      }
      if (res.status === 429) {
        setSubmitError(t("errors.tooMany"));
        return;
      }
      if (!res.ok) throw new Error();
      if (data.reference) router.push(`/booking/${data.reference}`);
    } catch {
      setSubmitError(t("errors.generic"));
    }
  }

  const err = (path: string): string | undefined => {
    const parts = path.split(".");
    let node: unknown = errors;
    for (const p of parts) node = (node as Record<string, unknown> | undefined)?.[p];
    return (node as { message?: string } | undefined)?.message;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6" aria-describedby="booking-no-payment">
      <section aria-labelledby="contact-title" className="card-surface space-y-4 p-4 sm:p-6">
        <div>
          <h2 id="contact-title" className="text-lg font-semibold">
            {t("contactTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("contactBody")}</p>
        </div>
        <Field id="contactName" label={t("fullName")} hint={t("fullNameHint")} error={err("contactName")}>
          <Input
            id="contactName"
            autoComplete="name"
            className="h-11"
            aria-invalid={!!err("contactName")}
            aria-describedby={describedBy("contactName", err("contactName"), true)}
            {...register("contactName")}
          />
        </Field>
        <Field id="email" label={t("email")} hint={t("emailHint")} error={err("email")}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            className="h-11"
            aria-invalid={!!err("email")}
            aria-describedby={describedBy("email", err("email"), true)}
            {...register("email")}
          />
        </Field>
        <fieldset className="space-y-1.5">
          <legend className="text-sm font-semibold">{t("phone")}</legend>
          <div className="grid grid-cols-[minmax(0,9rem)_1fr] gap-2">
            <div>
              <label htmlFor="phoneCountry" className="sr-only">
                {t("phoneCountry")}
              </label>
              <select
                id="phoneCountry"
                autoComplete="tel-country-code"
                className={selectClass}
                aria-invalid={!!err("phoneCountry")}
                aria-describedby={describedBy("phoneCountry", err("phoneCountry"))}
                {...register("phoneCountry")}
              >
                <option value="">{t("code")}</option>
                {dialCountries.map((c) => (
                  <option key={c.iso2} value={c.iso2}>
                    {c.flag} {c.name} ({c.dial})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="phoneNumber" className="sr-only">
                {t("phoneNumber")}
              </label>
              <Input
                id="phoneNumber"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                className="h-11"
                placeholder={t("phonePlaceholder")}
                aria-invalid={!!err("phoneNumber")}
                aria-describedby={describedBy("phoneNumber", err("phoneNumber"))}
                {...register("phoneNumber")}
              />
            </div>
          </div>
          {(err("phoneCountry") || err("phoneNumber")) && (
            <p id={err("phoneCountry") ? "phoneCountry-error" : "phoneNumber-error"} className="flex items-center gap-1 text-xs font-medium text-destructive">
              <AlertCircle className="size-3.5" aria-hidden="true" />
              {err("phoneCountry") ?? err("phoneNumber")}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{t("phoneHint")}</p>
        </fieldset>
      </section>

      <section aria-labelledby="passengers-title" className="space-y-4">
        <div>
          <h2 id="passengers-title" className="text-lg font-semibold">
            {t("passengersTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("passengersBody")}</p>
        </div>
        {fields.map((field, i) => {
          const type = types[i];
          typeCounters[type] += 1;
          const p = `passengers.${i}`;
          return (
            <fieldset key={field.id} className="card-surface space-y-4 p-4 sm:p-6">
              <legend className="sr-only">{t(`passengerLegend.${type}`, { n: typeCounters[type] })}</legend>
              <p aria-hidden="true" className="flex items-center justify-between font-semibold">
                {t(`passengerLegend.${type}`, { n: typeCounters[type] })}
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">{t(`ageHint.${type}`)}</span>
              </p>
              <input type="hidden" {...register(`passengers.${i}.type`)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id={`${p}.firstName`} label={t("firstName")} hint={t("firstNameHint")} error={err(`${p}.firstName`)}>
                  <Input
                    id={`${p}.firstName`}
                    autoComplete={i === 0 ? "given-name" : "off"}
                    className="h-11"
                    aria-invalid={!!err(`${p}.firstName`)}
                    aria-describedby={describedBy(`${p}.firstName`, err(`${p}.firstName`), true)}
                    {...register(`passengers.${i}.firstName`)}
                  />
                </Field>
                <Field id={`${p}.lastName`} label={t("lastName")} error={err(`${p}.lastName`)}>
                  <Input
                    id={`${p}.lastName`}
                    autoComplete={i === 0 ? "family-name" : "off"}
                    className="h-11"
                    aria-invalid={!!err(`${p}.lastName`)}
                    aria-describedby={describedBy(`${p}.lastName`, err(`${p}.lastName`))}
                    {...register(`passengers.${i}.lastName`)}
                  />
                </Field>
                <Field id={`${p}.dateOfBirth`} label={t("dateOfBirth")} error={err(`${p}.dateOfBirth`)}>
                  <Input
                    id={`${p}.dateOfBirth`}
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    min="1900-01-01"
                    className="h-11"
                    aria-invalid={!!err(`${p}.dateOfBirth`)}
                    aria-describedby={describedBy(`${p}.dateOfBirth`, err(`${p}.dateOfBirth`))}
                    {...register(`passengers.${i}.dateOfBirth`)}
                  />
                </Field>
                <Field id={`${p}.nationality`} label={t("nationality")} error={err(`${p}.nationality`)}>
                  <select
                    id={`${p}.nationality`}
                    className={selectClass}
                    aria-invalid={!!err(`${p}.nationality`)}
                    aria-describedby={describedBy(`${p}.nationality`, err(`${p}.nationality`))}
                    {...register(`passengers.${i}.nationality`)}
                  >
                    <option value="">{t("chooseNationality")}</option>
                    {countries.map((c) => (
                      <option key={c.iso2} value={c.iso2}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </fieldset>
          );
        })}
      </section>

      <div className="card-surface space-y-4 p-4 sm:p-6">
        <Field id="notes" label={t("notes")} hint={t("notesHint")} error={err("notes")}>
          <Textarea id="notes" rows={4} aria-describedby={describedBy("notes", err("notes"), true)} {...register("notes")} />
        </Field>

        {/* Honeypot: hidden from people and assistive tech; bots fill it in. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" {...register(HONEYPOT_FIELD)} />
          </label>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-start gap-3">
            <Controller
              control={control}
              name="consent"
              render={({ field }) => (
                <Checkbox
                  id="consent"
                  ref={field.ref}
                  name={field.name}
                  checked={field.value === true}
                  onCheckedChange={(v) => field.onChange(v === true ? true : undefined)}
                  onBlur={field.onBlur}
                  aria-invalid={!!err("consent")}
                  aria-describedby={err("consent") ? "consent-error" : undefined}
                  className="mt-0.5"
                />
              )}
            />
            <Label htmlFor="consent" className="block text-sm leading-snug font-normal">
              {t.rich("consent", {
                terms: (chunks) => (
                  <a href="/terms" target="_blank" className="text-link underline">
                    {chunks}
                  </a>
                ),
                privacy: (chunks) => (
                  <a href="/privacy" target="_blank" className="text-link underline">
                    {chunks}
                  </a>
                ),
              })}
            </Label>
          </div>
          {err("consent") && (
            <p id="consent-error" className="flex items-center gap-1 text-xs font-medium text-destructive">
              <AlertCircle className="size-3.5" aria-hidden="true" />
              {err("consent")}
            </p>
          )}
        </div>
      </div>

      {submitError && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-card p-4 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          {submitError}
        </div>
      )}

      <div className="space-y-3">
        <Button type="submit" variant="cta" size="xl" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Send className="size-5" aria-hidden="true" />}
          {isSubmitting ? t("sending") : t("submit")}
        </Button>
        <p id="booking-no-payment" className="flex items-start justify-center gap-2 text-center text-sm text-muted-foreground">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t("noPayment")}
        </p>
      </div>
    </form>
  );
}
