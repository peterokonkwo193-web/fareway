import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeReference } from "@/lib/booking/reference";
import { db } from "@/lib/db";
import { getMailer } from "@/lib/mail/mailer";
import { guardFormRequest } from "@/lib/security/guard";
import { HONEYPOT_FIELD, isHoneypotFilled } from "@/lib/security/honeypot";

const schema = z.object({
  email: z.email().max(200),
  reference: z.string().max(40).optional().default(""),
  confirm: z.literal(true),
  [HONEYPOT_FIELD]: z.string().optional(),
});

/**
 * POST /api/data-requests: ask for personal data to be deleted.
 * Staff process requests in /admin/deletion-requests after checking the
 * requester owns the email (the acknowledgement goes only to that address).
 */
export async function POST(req: Request) {
  const blocked = await guardFormRequest(req, "data-requests", 3, 60 * 60 * 1000);
  if (blocked) return blocked;
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (isHoneypotFilled(body.data[HONEYPOT_FIELD])) return NextResponse.json({ ok: true });

  const email = body.data.email.toLowerCase();
  await db.dataDeletionRequest.create({
    data: { email, reference: body.data.reference ? normalizeReference(body.data.reference) : null },
  });
  try {
    await getMailer().send({
      to: email,
      subject: "We received your data deletion request",
      text: "We received a request to delete the personal data linked to this email address on Fareway. Our team will process it within 30 days and may contact you to confirm it was you. If you did not make this request, reply to this email.",
      html: "<p>We received a request to delete the personal data linked to this email address on Fareway.</p><p>Our team will process it within 30 days and may contact you to confirm it was you. If you did not make this request, reply to this email.</p>",
    });
  } catch {
    console.error("[data-requests] acknowledgement email failed");
  }
  // Same response whether or not we hold data for this email.
  return NextResponse.json({ ok: true });
}
