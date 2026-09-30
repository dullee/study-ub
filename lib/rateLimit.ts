import "server-only";
import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// /api/maps/* хамгаалалт. Эдгээр нь OpenStreetMap (Nominatim/Overpass), Google руу манай сайтын нэрээр хүсэлт дамжуулдаг —
// хэн нэгэн давталтаар дуудвал Nominatim сайтыг бүхэлд нь хааж болзошгүй.
//   1) Өөр сайтын хөтчөөс дуудахыг хаана (Sec-Fetch-Site).
//   2) IP тус бүр: 10 минутад 30 хүсэлт — газар нэмэхэд холбоос бүрт 2–3 хүсэлт тул жирийн хэрэглэгчид хүрэхгүй.
//   3) OpenStreetMap руу нийт сайтын хэмжээнд минутад 30 — олон IP-ээс тараасан ч Nominatim-ийн хязгаараас хол.
// Тоолуур Supabase-д (supabase/migrations/20260930000004_api_rate_limits.sql) — Vercel-ийн бүх instance хуваалцана.
// Supabase холбогдохгүй бол instance-ийн санах ойд тоолно (нээлттэй орхихгүй).

const PER_IP = { limit: 30, windowSeconds: 600 };
const OSM_GLOBAL = { limit: 30, windowSeconds: 60 };

const memory = new Map<string, { windowStart: number; count: number }>();
// Migration ажиллаагүй үед хүсэлт бүрт биш, нэг л удаа бичнэ.
let loggedDbError = false;

function memoryHit(key: string, limit: number, windowSeconds: number) {
  const windowStart = Math.floor(Date.now() / 1000 / windowSeconds) * windowSeconds;
  const entry = memory.get(key);
  const count = entry && entry.windowStart === windowStart ? entry.count + 1 : 1;
  memory.set(key, { windowStart, count });
  if (memory.size > 5000) {
    for (const [k, v] of memory) if (v.windowStart < windowStart) memory.delete(k);
  }
  return count <= limit;
}

async function hit(key: string, { limit, windowSeconds }: { limit: number; windowSeconds: number }) {
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin.rpc("rate_limit_hit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (!error && typeof data === "boolean") return data;
    if (!loggedDbError) {
      loggedDbError = true;
      console.error("Rate limit (санах ойд тоолж байна):", error?.message ?? "unexpected response");
    }
  }
  return memoryHit(key, limit, windowSeconds);
}

// Vercel x-forwarded-for-ийн эхний утгыг бодит хэрэглэгчийн IP болгож өгнө. Түүхий IP хадгалахгүй — hash.
function clientKey(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 24);
}

function tooMany(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "rate-limited" },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

// null — үргэлжлүүлж болно; эс бөгөөс буцаах хариу (403/429).
export async function guardMapsRequest(
  request: NextRequest,
  { usesOpenStreetMap }: { usesOpenStreetMap: boolean }
): Promise<NextResponse | null> {
  // Хөтөч өөр сайтаас дуудахад "cross-site" гэж илгээнэ. curl гэх мэт нь илгээдэггүй — тэднийг доорх хязгаар барина.
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!(await hit(`maps:ip:${clientKey(request)}`, PER_IP))) return tooMany(PER_IP.windowSeconds);
  if (usesOpenStreetMap && !(await hit("maps:osm:global", OSM_GLOBAL))) return tooMany(OSM_GLOBAL.windowSeconds);
  return null;
}
