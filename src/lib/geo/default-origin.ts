import "server-only";
import { headers } from "next/headers";
import { geo } from "./data";
import type { Place } from "./types";

/**
 * Best-guess origin from the visitor's country (set by Vercel / Cloudflare at the edge).
 * Returns null when unknown; the user simply fills in "From".
 */
export async function getDefaultOrigin(): Promise<Place | null> {
  const h = await headers();
  const country = (h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) return null;
  const [gateway] = geo.gatewayAirports(country, 1);
  if (!gateway) return null;
  const metro = geo.cities.find((c) => c.id.startsWith("city:") && c.airports.includes(gateway) && c.airports.length > 1);
  return metro ?? geo.resolvePlace(gateway) ?? null;
}
