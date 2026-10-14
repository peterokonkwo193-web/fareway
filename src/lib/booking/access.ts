import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * A booking page is only shown to the browser that created the request or that
 * looked it up with reference + email. Access is a signed, httpOnly cookie per
 * booking, so knowing a reference alone reveals nothing.
 */
const COOKIE_PREFIX = "fw_bk_";
const MAX_AGE = 60 * 60 * 24 * 60; // 60 days

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function sign(reference: string) {
  return createHmac("sha256", secret()).update(`booking:${reference}`).digest("base64url");
}

export async function grantBookingAccess(reference: string) {
  const store = await cookies();
  store.set(`${COOKIE_PREFIX}${reference}`, sign(reference), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function hasBookingAccess(reference: string): Promise<boolean> {
  const store = await cookies();
  const value = store.get(`${COOKIE_PREFIX}${reference}`)?.value;
  if (!value) return false;
  const expected = Buffer.from(sign(reference));
  const given = Buffer.from(value);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
