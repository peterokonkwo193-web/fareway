import "server-only";
import { geo } from "./data";

export type CountryOption = { iso2: string; name: string; flag: string; dial: string | null };

/** Slim country list for selects (phone code, nationality). About 15 KB. */
export function countryOptions(): CountryOption[] {
  return geo.countries
    .filter((c) => c.iso2 !== "AQ" && c.iso2 !== "BV" && c.iso2 !== "HM")
    .map((c) => ({ iso2: c.iso2, name: c.name, flag: c.flag, dial: c.dialCode }));
}
