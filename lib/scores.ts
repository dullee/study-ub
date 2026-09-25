import { Localized, OUTLET_LEVELS, QUIET_LEVELS, Review, StudySpot } from "@/types";
import { Locale } from "@/lib/i18n/dictionaries";

// Газрын оноог газар нэмэгчийн утга (нэг санал) + сэтгэгдлүүдээс нэгтгэнэ.
// Wi-Fi: медиан — нэг хэт хурдан/удаан тест дүнг гажуудуулахгүй. Чимээгүй, залгуур: дундаж.

export type ReviewScores = Pick<
  Review,
  "id" | "spot_id" | "rating" | "wifi_mbps" | "quiet_rating" | "outlet_rating" | "created_at"
>;
export type Score = { value: number; count: number };

export interface SpotSummary {
  rating?: Score;
  wifi?: Score;
  quiet?: Score;
  outlets?: Score;
}

const present = (values: (number | null | undefined)[]) =>
  values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));

function average(values: number[]): Score | undefined {
  if (values.length === 0) return undefined;
  return { value: values.reduce((sum, value) => sum + value, 0) / values.length, count: values.length };
}

function median(values: number[]): Score | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return { value, count: values.length };
}

export function summarizeSpot(
  spot: Pick<StudySpot, "wifi_mbps" | "quiet_rating" | "outlet_rating">,
  reviews: ReviewScores[]
): SpotSummary {
  return {
    rating: average(present(reviews.map((review) => review.rating))),
    wifi: median(present([spot.wifi_mbps, ...reviews.map((review) => review.wifi_mbps)])),
    quiet: average(present([spot.quiet_rating, ...reviews.map((review) => review.quiet_rating)])),
    outlets: average(present([spot.outlet_rating, ...reviews.map((review) => review.outlet_rating)])),
  };
}

export function summarizeSpots(spots: StudySpot[], reviews: ReviewScores[]) {
  const bySpot: Record<number, ReviewScores[]> = {};
  for (const review of reviews) (bySpot[review.spot_id] ??= []).push(review);
  return Object.fromEntries(
    spots.map((spot) => [spot.id, summarizeSpot(spot, bySpot[spot.id] ?? [])])
  ) as Record<number, SpotSummary>;
}

// 1–5 онооны тайлбарыг сонгосон хэлээр ("Чимээгүй" / "Quiet").
export const levelLabel = (levels: readonly Localized[], value: number, locale: Locale) =>
  levels[Math.min(Math.max(Math.round(value), 1), 5) - 1][locale];

export const formatWifi = (score: Score) => `${Math.round(score.value)} Mbps`;
export const formatQuiet = (score: Score, locale: Locale) =>
  `${levelLabel(QUIET_LEVELS, score.value, locale)} (${score.value.toFixed(1)}/5)`;
export const formatOutlets = (score: Score, locale: Locale) =>
  `${levelLabel(OUTLET_LEVELS, score.value, locale)} (${score.value.toFixed(1)}/5)`;
