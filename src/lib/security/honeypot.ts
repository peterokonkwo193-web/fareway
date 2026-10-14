/**
 * Honeypot field: hidden from people (and from assistive tech), but bots that
 * fill every input will populate it. Requests with a value are dropped quietly.
 */
export const HONEYPOT_FIELD = "website";

export function isHoneypotFilled(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
