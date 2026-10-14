/**
 * Time helpers for mock schedules.
 *
 * The airport dataset has no time zones, so UTC offsets are approximated from
 * longitude, with overrides for countries that use one zone nationwide. Daylight
 * saving is ignored. Real providers return local times directly, so this file
 * is only used by the mock provider.
 */

const COUNTRY_OFFSETS: Record<string, number> = {
  CN: 8, HK: 8, MO: 8, TW: 8, SG: 8, MY: 8, PH: 8, IN: 5.5, LK: 5.5, NP: 5.75, MM: 6.5, BD: 6, BT: 6,
  TH: 7, VN: 7, KH: 7, LA: 7, JP: 9, KR: 9, KP: 9, AF: 4.5, IR: 3.5, AE: 4, OM: 4, QA: 3, SA: 3, BH: 3,
  KW: 3, IQ: 3, JO: 3, SY: 3, TR: 3, IL: 2, PS: 2, LB: 2, EG: 2, CY: 2, GR: 2, BG: 2, RO: 2, FI: 2, EE: 2,
  LV: 2, LT: 2, UA: 2, MD: 2, ZA: 2, ZW: 2, ZM: 2, MZ: 2, BW: 2, NA: 2, KE: 3, ET: 3, TZ: 3, UG: 3, SO: 3,
  GB: 0, IE: 0, PT: 0, IS: 0, MA: 1, ES: 1, FR: 1, BE: 1, NL: 1, LU: 1, DE: 1, CH: 1, AT: 1, IT: 1, MT: 1,
  DK: 1, NO: 1, SE: 1, PL: 1, CZ: 1, SK: 1, HU: 1, SI: 1, HR: 1, BA: 1, RS: 1, ME: 1, AL: 1, MK: 1,
  NG: 1, DZ: 1, TN: 1, GH: 0, SN: 0, CI: 0, AR: -3, UY: -3, CL: -4, PY: -4, BO: -4, VE: -4, CO: -5,
  PE: -5, EC: -5, PA: -5, CU: -5, JM: -5, NZ: 12, FJ: 12,
};

export function utcOffsetHours(countryCode: string, lng: number): number {
  if (countryCode in COUNTRY_OFFSETS) return COUNTRY_OFFSETS[countryCode];
  if (countryCode === "BR") return lng < -55 ? -4 : -3;
  return Math.max(-11, Math.min(13, Math.round(lng / 15)));
}

/** Minutes since epoch for a local date + minute-of-day, treating local time as UTC. */
export function localMinutes(isoDate: string, minuteOfDay: number): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 60000 + minuteOfDay;
}

/** Formats "minutes since epoch (as wall clock)" as "YYYY-MM-DDTHH:mm". */
export function formatLocal(minutes: number): string {
  return new Date(minutes * 60000).toISOString().slice(0, 16);
}

export function dayDiff(aLocal: string, bLocal: string): number {
  const a = Date.UTC(+aLocal.slice(0, 4), +aLocal.slice(5, 7) - 1, +aLocal.slice(8, 10));
  const b = Date.UTC(+bLocal.slice(0, 4), +bLocal.slice(5, 7) - 1, +bLocal.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

export function minuteOfDay(local: string): number {
  return +local.slice(11, 13) * 60 + +local.slice(14, 16);
}

/** "8h 10m" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
