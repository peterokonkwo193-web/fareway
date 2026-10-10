import type { Place } from "./types";

/** Compact field label: "London (LHR)", "London (Any)", "Japan", "Everywhere". */
export function placeLabel(place: Place): string {
  switch (place.kind) {
    case "airport":
      return `${place.city ?? place.name} (${place.code})`;
    case "city":
      return place.airports.length > 1 ? `${place.name} (Any)` : `${place.name} (${place.airports[0]})`;
    default:
      return place.name;
  }
}

/** Short code for summaries: LHR, LON, JP, ANY. */
export function placeCode(place: Place): string {
  return place.code;
}
