import { NextResponse, type NextRequest } from "next/server";
import { geo } from "@/lib/geo/data";

/** Autocomplete: GET /api/places?q=lon&everywhere=1 -> grouped suggestions. */
export function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").slice(0, 60);
  const allowEverywhere = req.nextUrl.searchParams.get("everywhere") === "1";
  const results = geo.searchPlaces(q, { allowEverywhere }).map(({ score: _score, ...place }) => place);
  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=86400" } },
  );
}
