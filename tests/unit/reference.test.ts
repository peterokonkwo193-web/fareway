import { describe, expect, it } from "vitest";
import { generateReference, isValidReference, normalizeReference, REFERENCE_ALPHABET, REFERENCE_PATTERN } from "@/lib/booking/reference";

describe("generateReference", () => {
  it("uses the FW-YYMMDD-XXXXX format with the UTC creation date", () => {
    const ref = generateReference(new Date("2026-10-14T23:30:00Z"));
    expect(ref).toMatch(REFERENCE_PATTERN);
    expect(ref.startsWith("FW-261014-")).toBe(true);
  });

  it("uses UTC, not local time, for the date part", () => {
    expect(generateReference(new Date("2026-01-01T00:00:00Z")).slice(0, 10)).toBe("FW-260101-");
    expect(generateReference(new Date("2026-12-31T23:59:59Z")).slice(0, 10)).toBe("FW-261231-");
  });

  it("never uses look-alike characters", () => {
    for (const ch of "01OIL") expect(REFERENCE_ALPHABET).not.toContain(ch);
    for (let i = 0; i < 500; i++) expect(generateReference().slice(10)).not.toMatch(/[01OIL]/);
  });

  it("maps random bytes onto the alphabet and rejects biased bytes", () => {
    // 248..255 must be skipped (rejection sampling); 0 -> first char, 31 -> wraps to first char.
    const bytes = [255, 250, 248, 0, 1, 2, 30, 31, 247];
    let calls = 0;
    const ref = generateReference(new Date("2026-10-14T00:00:00Z"), (n) => {
      calls++;
      return Uint8Array.from(bytes.slice(0, n));
    });
    const a = REFERENCE_ALPHABET;
    expect(ref).toBe(`FW-261014-${a[0]}${a[1]}${a[2]}${a[30]}${a[0]}`);
    expect(calls).toBe(1);
  });

  it("produces distinct references in practice", () => {
    const seen = new Set(Array.from({ length: 2000 }, () => generateReference(new Date("2026-10-14T00:00:00Z"))));
    expect(seen.size).toBeGreaterThan(1995);
  });
});

describe("normalizeReference / isValidReference", () => {
  it("accepts sloppy user input", () => {
    expect(normalizeReference(" fw 261014 ab3cd ")).toBe("FW-261014-AB3CD");
    expect(normalizeReference("fw-261014-ab3cd")).toBe("FW-261014-AB3CD");
  });

  it("rejects malformed references", () => {
    expect(isValidReference("FW-261014-AB3CD")).toBe(true);
    expect(isValidReference("FW-261014-AB3C")).toBe(false);
    expect(isValidReference("FW-26101-AB3CD")).toBe(false);
    expect(isValidReference("FW-261014-AB0CD")).toBe(false); // 0 is not in the alphabet
    expect(isValidReference("XX-261014-AB3CD")).toBe(false);
  });
});
