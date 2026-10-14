/**
 * Booking references: FW-YYMMDD-XXXXX
 *  - YYMMDD is the UTC creation date.
 *  - XXXXX uses an alphabet without look-alike characters (no 0/O, 1/I/L),
 *    giving 31^5 ≈ 28.6 million codes per day. Uniqueness is enforced by the
 *    database; the service retries on the rare collision.
 */
export const REFERENCE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const REFERENCE_PATTERN = /^FW-\d{6}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$/;

export function generateReference(now: Date = new Date(), randomBytes: (n: number) => Uint8Array = cryptoRandom): string {
  const yy = String(now.getUTCFullYear() % 100).padStart(2, "0");
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  let suffix = "";
  // Rejection sampling keeps the distribution uniform (248 = 8 * 31).
  while (suffix.length < 5) {
    for (const byte of randomBytes(8)) {
      if (byte < 248 && suffix.length < 5) suffix += REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length];
    }
  }
  return `FW-${yy}${mm}${dd}-${suffix}`;
}

function cryptoRandom(n: number): Uint8Array {
  const bytes = new Uint8Array(n);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

/** Normalises user input such as " fw 261014 ab3cd " to "FW-261014-AB3CD". */
export function normalizeReference(input: string): string {
  const compact = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const m = compact.match(/^FW(\d{6})([A-Z0-9]{5})$/);
  return m ? `FW-${m[1]}-${m[2]}` : input.trim().toUpperCase();
}

export function isValidReference(value: string): boolean {
  return REFERENCE_PATTERN.test(value);
}
