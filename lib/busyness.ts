import { Locale } from "@/lib/i18n/dictionaries";
import { distanceKm, LatLng } from "@/lib/geo";

export type BusynessLevel = 1 | 2 | 3 | 4 | 5;

export interface SpotCheckin {
  id: number;
  spot_id: number;
  user_id: string;
  level: BusynessLevel;
  created_at: string;
}

// supabase/migrations/20260930000001_spot_checkins.sql-тэй тохирно.
export const CHECKIN_WINDOW_MINUTES = 90;
export const CHECKIN_COOLDOWN_MINUTES = 30;
// "Би энд байна" дарахад газраас хэр ойр байх ёстой (м). Байршлын алдааг хамгийн ихдээ 100 м хүртэл хөнгөлнө —
// том барилга, GPS-ийн хэлбэлзэлд. Үүнээс муу нарийвчлалтай бол (компьютерийн Wi-Fi байршил) "нарийвчлал муу" гэнэ.
export const CHECKIN_RADIUS_METERS = 150;
const ACCURACY_ALLOWANCE_METERS = 100;
const IMPRECISE_ACCURACY_METERS = 250;

export const BUSYNESS_LEVELS: {
  level: BusynessLevel;
  icon: string;
  tone: string;
  // Газрын зураг дээрх цэгийн өнгө (tone-той ижил өнгөний 500).
  color: string;
  label: Record<Locale, string>;
}[] = [
  { level: 1, icon: "🟢", tone: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10", color: "#10b981", label: { mn: "Хоосон", en: "Empty" } },
  { level: 2, icon: "🟢", tone: "text-lime-300 border-lime-500/40 bg-lime-500/10", color: "#84cc16", label: { mn: "Сул", en: "Quiet" } },
  { level: 3, icon: "🟡", tone: "text-amber-300 border-amber-500/40 bg-amber-500/10", color: "#f59e0b", label: { mn: "Дунд", en: "Moderate" } },
  { level: 4, icon: "🟠", tone: "text-orange-300 border-orange-500/40 bg-orange-500/10", color: "#f97316", label: { mn: "Их хүнтэй", en: "Busy" } },
  { level: 5, icon: "🔴", tone: "text-rose-300 border-rose-500/40 bg-rose-500/10", color: "#f43f5e", label: { mn: "Суудал алга", en: "No seats" } },
];

export function busynessInfo(level: BusynessLevel) {
  return BUSYNESS_LEVELS[level - 1];
}

export interface BusynessSummary {
  level: BusynessLevel;
  count: number;
  latestAt: string;
}

// Сүүлийн 90 минутын үнэлгээний жинлэсэн дундаж: шинэ үнэлгээ илүү жинтэй (шугаман бууралт).
export function summarizeBusyness(checkins: SpotCheckin[], now: number): BusynessSummary | null {
  const windowMs = CHECKIN_WINDOW_MINUTES * 60_000;
  let weighted = 0;
  let totalWeight = 0;
  let count = 0;
  let latestAt = "";
  for (const checkin of checkins) {
    const age = now - new Date(checkin.created_at).getTime();
    if (age < 0 || age > windowMs) continue;
    const weight = 1 - age / windowMs + 0.1;
    weighted += checkin.level * weight;
    totalWeight += weight;
    count += 1;
    if (checkin.created_at > latestAt) latestAt = checkin.created_at;
  }
  if (count === 0) return null;
  const level = Math.min(5, Math.max(1, Math.round(weighted / totalWeight))) as BusynessLevel;
  return { level, count, latestAt };
}

// Нүүр хуудсанд: бүх газрын одоогийн ачаалал (мэдээлэлгүй газар жагсаалтад орохгүй).
export function summarizeAllBusyness(checkins: SpotCheckin[], now: number): Record<number, BusynessSummary> {
  const bySpot: Record<number, SpotCheckin[]> = {};
  for (const checkin of checkins) (bySpot[checkin.spot_id] ??= []).push(checkin);
  const result: Record<number, BusynessSummary> = {};
  for (const [spotId, list] of Object.entries(bySpot)) {
    const summary = summarizeBusyness(list, now);
    if (summary) result[Number(spotId)] = summary;
  }
  return result;
}

// Хэрэглэгчийн сүүлийн 30 минутын тэмдэглэл — байвал шинээр үүсгэхгүй, түүнийгээ засна.
export function recentOwnCheckin(checkins: SpotCheckin[], userId: string, now: number) {
  const cooldownMs = CHECKIN_COOLDOWN_MINUTES * 60_000;
  return checkins.find(
    (checkin) => checkin.user_id === userId && now - new Date(checkin.created_at).getTime() < cooldownMs
  );
}

// Хэрэглэгч газарт хангалттай ойр байгаа эсэх.
export function checkinProximity(spot: LatLng, coords: LatLng, accuracy: number) {
  const km = distanceKm(spot, coords);
  const allowance = Math.min(accuracy, ACCURACY_ALLOWANCE_METERS);
  return {
    near: km * 1000 - allowance <= CHECKIN_RADIUS_METERS,
    distanceKm: km,
    imprecise: accuracy > IMPRECISE_ACCURACY_METERS,
  };
}
