"use server";

import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { requireAdmin } from "@/lib/admin/require-admin";
import { db } from "@/lib/db";
import { BOOKING_STATUSES, canTransition, isBookingStatus } from "@/lib/booking/status";

export type LoginState = { error?: string; email?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin",
    });
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      const code = (err as AuthError & { code?: string }).code;
      // React resets the form after an action; return the email so it can be restored.
      const email = String(formData.get("email") ?? "").slice(0, 200);
      return { email, error: code === "rate_limited" ? "Too many attempts. Try again in 15 minutes." : "Email or password is incorrect." };
    }
    throw err; // NEXT_REDIRECT on success
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}

const statusSchema = z.object({ bookingId: z.string().min(1).max(40), status: z.enum(BOOKING_STATUSES) });

export async function changeStatusAction(formData: FormData) {
  const user = await requireAdmin();
  const parsed = statusSchema.safeParse({ bookingId: formData.get("bookingId"), status: formData.get("status") });
  if (!parsed.success) return;
  const booking = await db.bookingRequest.findUnique({ where: { id: parsed.data.bookingId }, select: { status: true, reference: true } });
  if (!booking || !isBookingStatus(booking.status) || !canTransition(booking.status, parsed.data.status)) return;
  await db.bookingRequest.update({
    where: { id: parsed.data.bookingId },
    data: {
      status: parsed.data.status,
      // Reopening a request gives it a fresh 48 hour window.
      ...(parsed.data.status === "PENDING" ? { expiresAt: new Date(Date.now() + 48 * 3600 * 1000) } : {}),
      statusHistory: { create: { from: booking.status, to: parsed.data.status, changedBy: user.email ?? "admin" } },
    },
  });
  revalidatePath(`/admin/bookings/${booking.reference}`);
  revalidatePath("/admin");
}

const noteSchema = z.object({ bookingId: z.string().min(1).max(40), body: z.string().trim().min(1).max(2000) });

export async function addNoteAction(formData: FormData) {
  const user = await requireAdmin();
  const parsed = noteSchema.safeParse({ bookingId: formData.get("bookingId"), body: formData.get("body") });
  if (!parsed.success) return;
  const booking = await db.bookingRequest.update({
    where: { id: parsed.data.bookingId },
    data: { internalNotes: { create: { body: parsed.data.body, author: user.email ?? "admin" } } },
    select: { reference: true },
  });
  revalidatePath(`/admin/bookings/${booking.reference}`);
}

const deletionSchema = z.object({
  requestId: z.string().min(1).max(40),
  decision: z.enum(["delete", "reject"]),
  verified: z.literal("on").optional(),
});

/** Processes a data deletion request: removes all booking requests and alerts for the email. */
export async function processDeletionAction(formData: FormData) {
  const user = await requireAdmin();
  const parsed = deletionSchema.safeParse({
    requestId: formData.get("requestId"),
    decision: formData.get("decision"),
    verified: formData.get("verified") ?? undefined,
  });
  if (!parsed.success) return;
  const request = await db.dataDeletionRequest.findUnique({ where: { id: parsed.data.requestId } });
  if (!request || request.status !== "RECEIVED") return;

  if (parsed.data.decision === "reject") {
    await db.dataDeletionRequest.update({ where: { id: request.id }, data: { status: "REJECTED", processedAt: new Date() } });
  } else {
    if (parsed.data.verified !== "on") return;
    const [bookings] = await db.$transaction([
      db.bookingRequest.deleteMany({ where: { contactEmail: request.email } }),
      db.priceAlert.deleteMany({ where: { email: request.email } }),
    ]);
    await db.dataDeletionRequest.update({
      where: { id: request.id },
      data: { status: "COMPLETED", processedAt: new Date(), removedCount: bookings.count },
    });
  }
  console.info(`[admin] deletion request ${request.id} ${parsed.data.decision} by ${user.email}`);
  revalidatePath("/admin/deletion-requests");
}
