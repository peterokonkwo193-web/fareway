import "server-only";
import { NextResponse } from "next/server";
import { isJson, isSameOrigin } from "./csrf";
import { clientIp, rateLimit } from "./rate-limit";

/**
 * Common checks for public form endpoints. Returns a response to send back
 * when the request must be rejected, otherwise null.
 */
export async function guardFormRequest(req: Request, bucket: string, limit: number, windowMs: number) {
  if (!isSameOrigin(req) || !isJson(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const rl = await rateLimit(`${bucket}:${clientIp(req.headers)}`, limit, windowMs);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }
  return null;
}
