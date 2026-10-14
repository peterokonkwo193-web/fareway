import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { serverEnv } from "@/lib/env";

/**
 * Email delivery behind a small interface.
 *
 *   MAIL_PROVIDER=mock      (default) writes each email to .mail-outbox/ and logs
 *                           only the subject: personal data never reaches logs.
 *   MAIL_PROVIDER=resend    uses RESEND_API_KEY
 *   MAIL_PROVIDER=sendgrid  uses SENDGRID_API_KEY
 *
 * Adding another provider: implement Mailer and register it in getMailer().
 */
export type EmailMessage = { to: string; subject: string; text: string; html: string; replyTo?: string };

export interface Mailer {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
}

class MockMailer implements Mailer {
  readonly name = "mock";
  async send(message: EmailMessage) {
    const dir = path.join(process.cwd(), ".mail-outbox");
    try {
      await fs.mkdir(dir, { recursive: true });
      const file = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, "-")}.html`);
      await fs.writeFile(file, `<!-- To: ${message.to} | Subject: ${message.subject} -->\n${message.html}`, "utf8");
    } catch {
      // Read-only file systems (e.g. serverless): nothing to persist.
    }
    console.info(`[mail:mock] queued "${message.subject}"`);
  }
}

class ResendMailer implements Mailer {
  readonly name = "resend";
  constructor(
    private apiKey: string,
    private from: string,
  ) {}
  async send(m: EmailMessage) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: this.from, to: [m.to], subject: m.subject, html: m.html, text: m.text, reply_to: m.replyTo }),
    });
    if (!res.ok) throw new Error(`Resend error ${res.status}`);
  }
}

class SendGridMailer implements Mailer {
  readonly name = "sendgrid";
  constructor(
    private apiKey: string,
    private from: string,
  ) {}
  async send(m: EmailMessage) {
    const match = this.from.match(/^(.*)<(.+)>$/);
    const from = match ? { name: match[1].trim(), email: match[2].trim() } : { email: this.from };
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: m.to }] }],
        from,
        reply_to: m.replyTo ? { email: m.replyTo } : undefined,
        subject: m.subject,
        content: [
          { type: "text/plain", value: m.text },
          { type: "text/html", value: m.html },
        ],
      }),
    });
    if (!res.ok) throw new Error(`SendGrid error ${res.status}`);
  }
}

let mailer: Mailer | null = null;

export function getMailer(): Mailer {
  if (mailer) return mailer;
  const env = serverEnv();
  if (env.MAIL_PROVIDER === "resend" && env.RESEND_API_KEY) mailer = new ResendMailer(env.RESEND_API_KEY, env.MAIL_FROM);
  else if (env.MAIL_PROVIDER === "sendgrid" && env.SENDGRID_API_KEY) mailer = new SendGridMailer(env.SENDGRID_API_KEY, env.MAIL_FROM);
  else mailer = new MockMailer();
  return mailer;
}

/** Test hook. */
export function setMailer(m: Mailer | null) {
  mailer = m;
}
