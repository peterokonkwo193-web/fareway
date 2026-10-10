import "server-only";
import countriesJson from "../../../data/countries.json";
import airportsJson from "../../../data/airports.json";
import metroJson from "../../../data/metro-codes.json";
import { createGeoIndex } from "./geo-index";
import type { Airport, Country, MetroCode } from "./types";

/** Server-side geo index. The datasets never ship to the browser. */
export const geo = createGeoIndex({
  countries: countriesJson as Country[],
  airports: airportsJson as Airport[],
  metros: metroJson as MetroCode[],
});
