import "server-only";
import { z } from "zod";

/** Server environment, validated lazily so missing values fail loudly where they are used. */
const schema = z.object({
  CUSTOMER_CARE_PHONE: z.string().default(""),
  CUSTOMER_CARE_WHATSAPP: z.string().default(""),
  CUSTOMER_CARE_EMAIL: z.string().default(""),
  CUSTOMER_CARE_HOURS: z.string().default(""),
  CUSTOMER_CARE_RESPONSE_TIME: z.string().default(""),
  ADMIN_EMAIL: z.string().default(""),
  ADMIN_PASSWORD_HASH: z.string().default(""),
  MAIL_PROVIDER: z.enum(["mock", "resend", "sendgrid"]).default("mock"),
  MAIL_FROM: z.string().default("Fareway <bookings@example.com>"),
  RESEND_API_KEY: z.string().default(""),
  SENDGRID_API_KEY: z.string().default(""),
  CRON_SECRET: z.string().default(""),
});

export type ServerEnv = z.infer<typeof schema>;

export function serverEnv(): ServerEnv {
  return schema.parse(process.env);
}

export type CustomerCare = {
  phone: string;
  /** Digits only, for wa.me links */
  whatsapp: string;
  email: string;
  hours: string;
  responseTime: string;
};

export function customerCare(): CustomerCare {
  const env = serverEnv();
  return {
    phone: env.CUSTOMER_CARE_PHONE,
    whatsapp: env.CUSTOMER_CARE_WHATSAPP.replace(/\D/g, ""),
    email: env.CUSTOMER_CARE_EMAIL,
    hours: env.CUSTOMER_CARE_HOURS,
    responseTime: env.CUSTOMER_CARE_RESPONSE_TIME,
  };
}
