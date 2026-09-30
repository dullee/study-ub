import { initialSpots } from "@/data/initialSpots";
import { EventAttendee, Review, StudyEvent, StudySpot, normalizeTags } from "@/types";
import { SpotCheckin } from "@/lib/busyness";
import { SpotReport } from "@/lib/reports";

// v2: data/initialSpots.ts 18 бодит газар — хуучин demo cache-ийг алгасна.
const SPOTS_KEY = "studyspots_ub_v2";
const REVIEWS_KEY = "studyspots_ub_reviews";

function withStatus(spot: StudySpot): StudySpot {
  return { ...spot, status: spot.status ?? "approved", tags: normalizeTags(spot.tags ?? []) };
}

export function loadLocalSpots(): StudySpot[] {
  if (typeof window === "undefined") return initialSpots.map(withStatus);
  const saved = localStorage.getItem(SPOTS_KEY);
  if (!saved) return initialSpots.map(withStatus);
  try {
    const parsed = JSON.parse(saved) as StudySpot[];
    if (!Array.isArray(parsed) || parsed.length === 0) return initialSpots.map(withStatus);
    return parsed.map(withStatus);
  } catch {
    return initialSpots.map(withStatus);
  }
}

export function saveLocalSpots(spots: StudySpot[]) {
  localStorage.setItem(SPOTS_KEY, JSON.stringify(spots));
}

export function loadLocalReviews(): Review[] {
  if (typeof window === "undefined") return [];
  try {
    const all = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "{}") as Record<string, Review[]>;
    return Object.values(all).flat();
  } catch {
    return [];
  }
}

export function reviewsForSpot(spotId: number): Review[] {
  return loadLocalReviews()
    .filter((review) => review.spot_id === spotId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function writeReviewMap(reviews: Review[]) {
  const grouped: Record<string, Review[]> = {};
  for (const review of reviews) {
    const key = String(review.spot_id);
    grouped[key] = grouped[key] ? [...grouped[key], review] : [review];
  }
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(grouped));
}

export function saveLocalReview(review: Review) {
  const rest = loadLocalReviews().filter((item) => item.id !== review.id);
  writeReviewMap([review, ...rest]);
}

export function removeLocalReview(id: number) {
  writeReviewMap(loadLocalReviews().filter((item) => item.id !== id));
}

const EVENTS_KEY = "studyspots_ub_events";
const ATTENDEES_KEY = "studyspots_ub_event_attendees";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function loadLocalEvents(): StudyEvent[] {
  return readJson<StudyEvent[]>(EVENTS_KEY, []);
}

export function saveLocalEvent(event: StudyEvent) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify([event, ...loadLocalEvents()]));
}

export function loadLocalAttendees(): EventAttendee[] {
  return readJson<EventAttendee[]>(ATTENDEES_KEY, []);
}

export function saveLocalAttendee(attendee: EventAttendee) {
  localStorage.setItem(ATTENDEES_KEY, JSON.stringify([...loadLocalAttendees(), attendee]));
}

export function removeLocalAttendee(id: number) {
  localStorage.setItem(
    ATTENDEES_KEY,
    JSON.stringify(loadLocalAttendees().filter((item) => item.id !== id))
  );
}

const CHAT_LINKS_KEY = "studyspots_ub_event_chat_links";

export function loadLocalChatLink(eventId: number): string | null {
  return readJson<Record<string, string>>(CHAT_LINKS_KEY, {})[String(eventId)] ?? null;
}

export function saveLocalChatLink(eventId: number, url: string | null) {
  const links = readJson<Record<string, string>>(CHAT_LINKS_KEY, {});
  if (url) links[String(eventId)] = url;
  else delete links[String(eventId)];
  localStorage.setItem(CHAT_LINKS_KEY, JSON.stringify(links));
}

const PHONES_KEY = "studyspots_ub_event_phones";

export function loadLocalEventPhone(eventId: number): string | null {
  return readJson<Record<string, string>>(PHONES_KEY, {})[String(eventId)] ?? null;
}

export function loadLocalEventPhones(): Record<number, string> {
  return readJson<Record<string, string>>(PHONES_KEY, {});
}

export function saveLocalEventPhone(eventId: number, phone: string | null) {
  const phones = readJson<Record<string, string>>(PHONES_KEY, {});
  if (phone) phones[String(eventId)] = phone;
  else delete phones[String(eventId)];
  localStorage.setItem(PHONES_KEY, JSON.stringify(phones));
}

export function updateLocalEvent(event: StudyEvent) {
  localStorage.setItem(
    EVENTS_KEY,
    JSON.stringify(loadLocalEvents().map((item) => (item.id === event.id ? event : item)))
  );
}

export function removeLocalEvent(id: number) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(loadLocalEvents().filter((item) => item.id !== id)));
  localStorage.setItem(
    ATTENDEES_KEY,
    JSON.stringify(loadLocalAttendees().filter((attendee) => attendee.event_id !== id))
  );
  saveLocalChatLink(id, null);
  saveLocalEventPhone(id, null);
}

// "Би энд байна" тэмдэглэлүүд (Supabase тохируулаагүй үед).
const CHECKINS_KEY = "studyspots_ub_checkins";

export function loadLocalCheckins(): SpotCheckin[] {
  if (typeof window === "undefined") return [];
  try {
    const all = JSON.parse(localStorage.getItem(CHECKINS_KEY) || "[]") as SpotCheckin[];
    return all.sort((a, b) => b.created_at.localeCompare(a.created_at));
  } catch {
    return [];
  }
}

export function checkinsForSpot(spotId: number): SpotCheckin[] {
  return loadLocalCheckins().filter((checkin) => checkin.spot_id === spotId);
}

// id, created_at байхгүй бол шинэ тэмдэглэл үүсгэнэ; байвал түүнийг солино.
export function saveLocalCheckin(
  draft: SpotCheckin | Omit<SpotCheckin, "id" | "created_at">
): SpotCheckin {
  const checkin: SpotCheckin =
    "id" in draft ? draft : { ...draft, id: Date.now(), created_at: new Date().toISOString() };
  let all: SpotCheckin[] = [];
  try {
    all = JSON.parse(localStorage.getItem(CHECKINS_KEY) || "[]") as SpotCheckin[];
  } catch {}
  // Нэг өдрөөс хуучныг хаяна — localStorage дүүрэхгүй.
  const cutoff = new Date(Date.now() - 86_400_000).toISOString();
  const rest = all.filter((item) => item.id !== checkin.id && item.created_at > cutoff);
  localStorage.setItem(CHECKINS_KEY, JSON.stringify([checkin, ...rest]));
  return checkin;
}

// "Мэдээлэл буруу" мэдэгдлүүд (Supabase тохируулаагүй үед).
const REPORTS_KEY = "studyspots_ub_reports";

export function loadLocalReports(): SpotReport[] {
  return readJson<SpotReport[]>(REPORTS_KEY, []);
}

export function saveLocalReports(reports: SpotReport[]) {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

// Хадгалсан газрууд — нэвтрээгүй үед (нэвтрэхэд бүртгэл рүү шилжинэ, lib/useFavorites.ts).
const FAVORITES_KEY = "studyspots_ub_favorites";

export function loadLocalFavorites(): number[] {
  const saved = readJson<unknown>(FAVORITES_KEY, []);
  return Array.isArray(saved) ? saved.filter((id): id is number => typeof id === "number") : [];
}

export function saveLocalFavorites(ids: number[]) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {}
}
