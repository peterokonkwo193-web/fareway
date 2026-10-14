import { differenceInYears, isValid, parseISO } from "date-fns";
import { z } from "zod";
import { HONEYPOT_FIELD } from "@/lib/security/honeypot";

/**
 * Booking request form, shared by the browser (React Hook Form) and the API.
 * No payment data is collected anywhere: only contact and passenger details.
 */

const NAME = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u;

const nameField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter ${label}`)
    .max(60, `${label[0].toUpperCase()}${label.slice(1)} is too long`)
    .regex(NAME, `Use letters only for ${label}, as on the passport`);

export const PASSENGER_TYPES = ["ADULT", "CHILD", "INFANT"] as const;
export type PassengerType = (typeof PASSENGER_TYPES)[number];

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the date of birth")
  .refine((s) => isValid(parseISO(s)), "Enter a valid date");

export const passengerSchema = z.object({
  type: z.enum(PASSENGER_TYPES),
  firstName: nameField("first name"),
  lastName: nameField("last name"),
  dateOfBirth: isoDate,
  nationality: z.string().regex(/^[A-Z]{2}$/, "Choose the passport nationality"),
});

export type PassengerInput = z.infer<typeof passengerSchema>;

/** Age rules at the date of travel: adult 12+, child 2–11, infant under 2. */
export function ageError(type: PassengerType, dateOfBirth: string, travelDate: string, today = new Date()): string | null {
  const dob = parseISO(dateOfBirth);
  if (dob > today) return "Date of birth cannot be in the future";
  const age = differenceInYears(parseISO(travelDate), dob);
  if (age > 120) return "Check the year of birth";
  if (type === "ADULT" && age < 12) return "Adults must be 12 or older on the travel date";
  if (type === "CHILD" && (age < 2 || age > 11)) return "Children must be 2 to 11 years old on the travel date";
  if (type === "INFANT" && age >= 2) return "Infants must be under 2 on the travel date";
  return null;
}

export function buildBookingSchema(opts: { travelDate: string; passengers: { adults: number; children: number; infants: number } }) {
  const expected = [
    ...Array<PassengerType>(opts.passengers.adults).fill("ADULT"),
    ...Array<PassengerType>(opts.passengers.children).fill("CHILD"),
    ...Array<PassengerType>(opts.passengers.infants).fill("INFANT"),
  ];
  return z
    .object({
      contactName: z
        .string()
        .trim()
        .min(3, "Enter your full name as on your passport")
        .max(120, "Name is too long")
        .regex(NAME, "Use letters only, as on your passport"),
      email: z.email("Enter a valid email address").max(200),
      phoneCountry: z.string().regex(/^[A-Z]{2}$/, "Choose your country code"),
      phoneNumber: z
        .string()
        .trim()
        .transform((v) => v.replace(/[\s().-]/g, ""))
        .pipe(z.string().regex(/^\d{4,15}$/, "Enter a valid phone number (digits only)")),
      passengers: z
        .array(
          // Per-passenger age check runs as soon as that passenger's fields are valid.
          passengerSchema.superRefine((p, ctx) => {
            const err = ageError(p.type, p.dateOfBirth, opts.travelDate);
            if (err) ctx.addIssue({ code: "custom", path: ["dateOfBirth"], message: err });
          }),
        )
        .length(expected.length, "Passenger details are incomplete")
        .superRefine((list, ctx) => {
          list.forEach((p, i) => {
            if (p.type !== expected[i]) ctx.addIssue({ code: "custom", path: [i, "type"], message: "Passenger type does not match the search" });
          });
        }),
      notes: z.string().trim().max(1000, "Keep notes under 1,000 characters").optional().default(""),
      consent: z.literal(true, { error: "Please confirm you have read the terms and privacy policy" }),
      [HONEYPOT_FIELD]: z.string().optional(),
    });
}

export type BookingFormInput = z.input<ReturnType<typeof buildBookingSchema>>;
export type BookingFormValues = z.output<ReturnType<typeof buildBookingSchema>>;
