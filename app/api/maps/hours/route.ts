import { NextRequest, NextResponse } from "next/server";
import { distanceKm } from "@/lib/distance";
import { osmHoursToText } from "@/lib/osmHours";

// Google Maps холбоосны координат (ба нэр)-оос OpenStreetMap дээрх ажлын цагийг хайна — газар нэмэх цонхны "Цагийн хуваарь".
// Түлхүүр шаардахгүй. Хямдаас нь эхэлж гурван аргаар оролдоно:
//   1) Nominatim нэрээр хайх (цэгийн ойролцоо) — хурдан, найдвартай, гэхдээ нэр ойролцоо таарах ёстой.
//   2) Nominatim яг тэр цэг дээрх газар — нэргүй эсвэл нэрээр олдоогүй үед.
//   3) Overpass (ойролцоох бүх цагтай газар) — илүү өргөн боловч нийтийн сервер ихэвчлэн удаан/унадаг тул богино хугацаатай.
// Nominatim-ийн бодлого: секундэд ≤1 хүсэлт, апп-аа User-Agent-аар танилцуулах, хариуг кэшлэх.
// Улаанбаатарт цөөн газар цагтай (~12%) тул олдохгүй байх нь энгийн.
const USER_AGENT = "StudySpotsUB/1.0 (+https://study-ub-omega.vercel.app)";
const NOMINATIM = "https://nominatim.openstreetmap.org";
const OVERPASS = "https://overpass-api.de/api/interpreter";
// Нэрээр хайх хүрээ, нэр таарахгүй бол газар цэгээс хэр ойр байх ёстой (м).
const SEARCH_RADIUS_M = 200;
const UNNAMED_MATCH_M = 25;

type Found = { opening_hours: string; name: string | null };
type Point = { lat: number; lng: number };

async function getJson<T>(url: string, timeoutMs: number): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      cache: "force-cache",
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

const meters = (a: Point, lat: string | number, lon: string | number) =>
  distanceKm(a, { lat: Number(lat), lng: Number(lon) }) * 1000;

// Үсэг, тоо л үлдээнэ: "Cafe Bene" ↔ "cafe bene", "Жүр Үр" ↔ "Жүр-Үр".
const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

function nameMatches(tags: Record<string, string>, wanted: string) {
  const target = normalize(wanted);
  if (target.length < 3) return false;
  return ["name", "name:en", "name:mn", "alt_name", "brand"].some((key) => {
    const candidate = tags[key] ? normalize(tags[key]) : "";
    return candidate.length >= 3 && (candidate.includes(target) || target.includes(candidate));
  });
}

type NominatimPlace = { lat: string; lon: string; name?: string; extratags?: Record<string, string> | null };

async function searchByName(point: Point, name: string): Promise<Found | null> {
  // viewbox: ойролцоогоор ±200 м.
  const dLat = SEARCH_RADIUS_M / 111_320;
  const dLng = dLat / Math.cos((point.lat * Math.PI) / 180);
  const params = new URLSearchParams({
    q: name,
    viewbox: [point.lng - dLng, point.lat + dLat, point.lng + dLng, point.lat - dLat].map((n) => n.toFixed(5)).join(","),
    bounded: "1",
    format: "jsonv2",
    extratags: "1",
    limit: "5",
  });
  const results = await getJson<NominatimPlace[]>(`${NOMINATIM}/search?${params}`, 5000);
  const best = (results ?? [])
    .filter((place) => place.extratags?.opening_hours)
    .sort((a, b) => meters(point, a.lat, a.lon) - meters(point, b.lat, b.lon))[0];
  return best ? { opening_hours: best.extratags!.opening_hours, name: best.name ?? null } : null;
}

async function placeAtPoint(point: Point): Promise<Found | null> {
  const params = new URLSearchParams({
    lat: point.lat.toFixed(5),
    lon: point.lng.toFixed(5),
    zoom: "18",
    format: "jsonv2",
    extratags: "1",
  });
  const place = await getJson<NominatimPlace>(`${NOMINATIM}/reverse?${params}`, 5000);
  const hours = place?.extratags?.opening_hours;
  if (!place || !hours || meters(point, place.lat, place.lon) > UNNAMED_MATCH_M) return null;
  return { opening_hours: hours, name: place.name ?? null };
}

type OverpassElement = { lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

async function overpassNearby(point: Point, name: string): Promise<Found | null> {
  const query = `[out:json][timeout:5];nwr(around:${SEARCH_RADIUS_M},${point.lat.toFixed(5)},${point.lng.toFixed(5)})["opening_hours"];out tags center;`;
  const data = await getJson<{ elements?: OverpassElement[] }>(`${OVERPASS}?data=${encodeURIComponent(query)}`, 6000);
  const candidates = (data?.elements ?? [])
    .map((element) => {
      const at = element.center ?? (element.lat !== undefined ? { lat: element.lat, lon: element.lon as number } : null);
      return at && element.tags?.opening_hours ? { tags: element.tags, meters: meters(point, at.lat, at.lon) } : null;
    })
    .filter((candidate): candidate is { tags: Record<string, string>; meters: number } => candidate !== null)
    .sort((a, b) => a.meters - b.meters);
  const match =
    (name ? candidates.find((candidate) => nameMatches(candidate.tags, name)) : undefined) ??
    candidates.find((candidate) => candidate.meters <= UNNAMED_MATCH_M);
  return match ? { opening_hours: match.tags.opening_hours, name: match.tags.name ?? null } : null;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const point = { lat: Number(params.get("lat")), lng: Number(params.get("lng")) };
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng) || Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180) {
    return NextResponse.json({ error: "bad-coordinates" }, { status: 400 });
  }
  const name = (params.get("name") ?? "").trim().slice(0, 200);
  const locale = params.get("lang") === "en" ? "en" : "mn";

  let found = name ? await searchByName(point, name) : null;
  if (!found) {
    // Nominatim-д дараалсан хоёр хүсэлтийн хооронд 1 секунд.
    if (name) await wait(1100);
    found = await placeAtPoint(point);
  }
  found ??= await overpassNearby(point, name);

  const hours = found ? osmHoursToText(found.opening_hours, locale) : null;
  if (!found || !hours) return NextResponse.json({ error: "no-hours" }, { status: 404 });
  return NextResponse.json({ hours, source: found.opening_hours, place: found.name });
}
