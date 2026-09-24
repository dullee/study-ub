import { initialSpots } from "@/data/initialSpots";
import { EventAttendee, Review, StudyEvent, StudySpot } from "@/types";

const SPOTS_KEY = "studyspots_ub";
const REVIEWS_KEY = "studyspots_ub_reviews";

function withStatus(spot: StudySpot): StudySpot {
  return { ...spot, status: spot.status ?? "approved" };
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
const MY_RSVPS_KEY = "studyspots_ub_my_rsvps";
const MY_NAME_KEY = "studyspots_ub_my_name";

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

// Нэвтрэлт байхгүй тул энэ хөтөч аль эвентэд "ирнэ" гэснийг event_id -> attendee_id хэлбэрээр санана.
export function loadMyRsvps(): Record<string, number> {
  return readJson<Record<string, number>>(MY_RSVPS_KEY, {});
}

export function saveMyRsvps(rsvps: Record<string, number>) {
  localStorage.setItem(MY_RSVPS_KEY, JSON.stringify(rsvps));
}

export function loadMyName(): string {
  return readJson<string>(MY_NAME_KEY, "");
}

export function saveMyName(name: string) {
  localStorage.setItem(MY_NAME_KEY, JSON.stringify(name));
}
