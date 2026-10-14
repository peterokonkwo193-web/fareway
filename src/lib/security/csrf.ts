import "server-only";

/**
 * CSRF protection for JSON endpoints: state-changing requests must come from
 * our own origin (Origin header, falling back to Referer) and be JSON. Browsers
 * cannot send a cross-site JSON POST without a CORS preflight, which we never
 * grant. Server Actions and Auth.js have their own built-in checks.
 */
export function isSameOrigin(req: Request): boolean {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return false;
  const source = req.headers.get("origin") ?? req.headers.get("referer");
  if (!source) return false;
  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

export function isJson(req: Request): boolean {
  return (req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json");
}
