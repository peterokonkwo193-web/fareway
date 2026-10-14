import { NextResponse, type NextRequest } from "next/server";
import { flightProvider } from "@/lib/flights/provider";
import { toDisplayOffer } from "@/lib/flights/display";
import { effectiveCurrency } from "@/lib/currency/convert";
import { getCurrency } from "@/lib/preferences";
import { parseSearchParams } from "@/lib/search/query";

/** GET /api/flights/search?<search params> -> offers priced in the visitor's currency. */
export async function GET(req: NextRequest) {
  const parsed = parseSearchParams(req.nextUrl.searchParams);
  if (!parsed.ok) {
    return NextResponse.json({ error: "invalid_query", fields: parsed.errors }, { status: 400 });
  }
  const currency = effectiveCurrency(req.nextUrl.searchParams.get("currency") ?? (await getCurrency()));
  try {
    const offers = await flightProvider.search(parsed.query);
    return NextResponse.json(
      { currency, provider: flightProvider.name, offers: offers.map((o) => toDisplayOffer(o, currency)) },
      { headers: { "Cache-Control": "private, max-age=120" } },
    );
  } catch (err) {
    console.error("flight search failed", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "provider_error" }, { status: 502 });
  }
}
