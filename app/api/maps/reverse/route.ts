import { NextRequest, NextResponse } from "next/server";
import { LIMITS } from "@/lib/limits";
import { guardMapsRequest } from "@/lib/rateLimit";

// Координатаас богино хаяг (гудамж, хороолол, дүүрэг) — газар нэмэх цонхны "Байршил"-ийг бөглөнө.
// OpenStreetMap Nominatim: түлхүүр шаардахгүй, газрын зураг ч OSM. Бодлогын дагуу апп-аа User-Agent-аар танилцуулж,
// ижил цэгийн хариуг кэшлэнэ (секундэд 1-ээс олон хүсэлт илгээхгүй байх).
const USER_AGENT = "StudySpotsUB/1.0 (+https://study-ub-omega.vercel.app)";

type NominatimAddress = Partial<
  Record<"road" | "house_number" | "residential" | "neighbourhood" | "quarter" | "suburb" | "city_district", string>
>;

function shortAddress(address: NominatimAddress): string {
  const street = address.road ? [address.road, address.house_number].filter(Boolean).join(" ") : undefined;
  const area = address.residential ?? address.neighbourhood ?? address.quarter ?? address.suburb;
  const parts = [street, area, address.city_district].filter((part): part is string => Boolean(part));
  // Хороолол, дүүрэг ижил нэртэй байж болно.
  return [...new Set(parts)].join(", ").slice(0, LIMITS.spotLocation);
}

export async function GET(request: NextRequest) {
  const blocked = await guardMapsRequest(request, { usesOpenStreetMap: true });
  if (blocked) return blocked;
  const params = request.nextUrl.searchParams;
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "bad-coordinates" }, { status: 400 });
  }
  const lang = params.get("lang") === "en" ? "en" : "mn";

  // ~1 м нарийвчлал хангалттай — ойролцоо хүсэлтүүд нэг кэш хуваалцана.
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.search = new URLSearchParams({
    format: "jsonv2",
    lat: lat.toFixed(5),
    lon: lng.toFixed(5),
    zoom: "18",
    addressdetails: "1",
    "accept-language": lang,
  }).toString();

  let data: { address?: NominatimAddress; error?: string };
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      cache: "force-cache",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return NextResponse.json({ error: "lookup-failed" }, { status: 502 });
    data = await res.json();
  } catch {
    return NextResponse.json({ error: "lookup-failed" }, { status: 502 });
  }

  const location = data.address ? shortAddress(data.address) : "";
  if (!location) return NextResponse.json({ error: "no-address" }, { status: 404 });
  return NextResponse.json({ location });
}
