import { NextResponse } from "next/server";
import { getDeriveInstruments } from "@/lib/derive/instruments";


export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() ?? "";

  try {
    const allInstruments = await getDeriveInstruments();
    const instruments = query
      ? allInstruments.filter((item) => item.symbol.toLowerCase().includes(query) || item.name.toLowerCase().includes(query))
      : allInstruments;
    return NextResponse.json({ instruments }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (error) {
    console.error("GET /api/instruments/derive error:", error);
    return NextResponse.json({ error: "Unable to load Deriv instruments" }, { status: 502 });
  }
}
