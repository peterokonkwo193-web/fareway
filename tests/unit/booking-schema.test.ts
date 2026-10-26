import { describe, expect, it } from "vitest";
import { ageError, buildBookingSchema } from "@/lib/booking/schema";

const schema = buildBookingSchema({ travelDate: "2026-12-12", passengers: { adults: 1, children: 1, infants: 1 } });
const valid = {
  contactName: "Ada Byron Lovelace",
  email: "ada@example.com",
  phoneCountry: "GB",
  phoneNumber: "07700 900-123",
  passengers: [
    { type: "ADULT", firstName: "Ada", lastName: "Lovelace", dateOfBirth: "1985-12-10", nationality: "GB" },
    { type: "CHILD", firstName: "Byron", lastName: "Lovelace", dateOfBirth: "2018-05-05", nationality: "GB" },
    { type: "INFANT", firstName: "Annabella", lastName: "Lovelace", dateOfBirth: "2026-01-01", nationality: "GB" },
  ],
  notes: "",
  consent: true,
};

describe("booking schema", () => {
  it("accepts a valid request and normalises the phone number", () => {
    const r = schema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.phoneNumber).toBe("07700900123");
  });

  it("accepts accented passport names", () => {
    expect(schema.safeParse({ ...valid, contactName: "Zoë Ñúñez-O'Brien" }).success).toBe(true);
  });

  it("rejects digits in names, missing consent and bad email", () => {
    const r = schema.safeParse({ ...valid, contactName: "Ada 2", consent: false, email: "nope" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path.join("."));
      expect(paths).toEqual(expect.arrayContaining(["contactName", "consent", "email"]));
    }
  });

  it("requires passenger types to match the search", () => {
    const swapped = { ...valid, passengers: [valid.passengers[1], valid.passengers[0], valid.passengers[2]] };
    expect(schema.safeParse(swapped).success).toBe(false);
    expect(schema.safeParse({ ...valid, passengers: valid.passengers.slice(0, 2) }).success).toBe(false);
  });

  it("checks ages at the travel date", () => {
    const tooOld = { ...valid, passengers: [valid.passengers[0], { ...valid.passengers[1], dateOfBirth: "2010-01-01" }, valid.passengers[2]] };
    const r = schema.safeParse(tooOld);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path.join(".")).toBe("passengers.1.dateOfBirth");
  });
});

describe("ageError", () => {
  const today = new Date("2026-10-15");
  it.each([
    ["ADULT", "2014-12-12", null],
    ["ADULT", "2014-12-13", "Adults must be 12 or older on the travel date"],
    ["CHILD", "2024-12-12", null],
    ["CHILD", "2024-12-13", "Children must be 2 to 11 years old on the travel date"],
    ["INFANT", "2024-12-13", null],
    ["INFANT", "2027-01-01", "Date of birth cannot be in the future"],
  ] as const)("%s born %s", (type, dob, expected) => {
    expect(ageError(type, dob, "2026-12-12", today)).toBe(expected);
  });
});
