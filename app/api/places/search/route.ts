import { NextRequest, NextResponse } from "next/server";
import { getGeocoder } from "@/lib/geocode";

// Очих газрыг нэр, хаягаар хайна. Координатыг зөвхөн geocoder-ийн хариунаас авна.
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 120);
  if (q.length < 2) return NextResponse.json({ results: [] });

  try {
    const results = await getGeocoder().search(q, request.signal);
    return NextResponse.json({ results });
  } catch (error) {
    if (request.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
      return NextResponse.json({ results: [] });
    }
    return NextResponse.json({ error: "search-failed" }, { status: 502 });
  }
}
