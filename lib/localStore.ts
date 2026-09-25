import { initialSpots } from "@/data/initialSpots";
import { EventAttendee, Review, StudyEvent, StudySpot, normalizeTags } from "@/types";

const SPOTS_KEY = "studyspots_ub";
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
}
