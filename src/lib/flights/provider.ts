import "server-only";
import airlinesJson from "../../../data/airlines.json";
import { geo } from "@/lib/geo/data";
import { createMockProvider, type AirlineRecord } from "./mock-provider";
import type { FlightProvider } from "./types";

export type { FlightProvider } from "./types";

/**
 * The active flight data source. Set FLIGHT_PROVIDER to choose another
 * implementation once one exists (see README "Swapping in a real provider").
 */
function createProvider(): FlightProvider {
  const name = process.env.FLIGHT_PROVIDER ?? "mock";
  switch (name) {
    case "mock":
      return createMockProvider({ geo, airlines: airlinesJson as AirlineRecord[] });
    default:
      throw new Error(`Unknown FLIGHT_PROVIDER "${name}". Implement FlightProvider in src/lib/flights/ and register it here.`);
  }
}

export const flightProvider: FlightProvider = createProvider();
