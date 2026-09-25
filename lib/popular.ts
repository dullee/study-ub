import { Review } from "@/types";

// "Эрэлттэй" газар: сүүлийн POPULAR_WINDOW_DAYS хоногт POPULAR_MIN_REVIEWS-ээс олон сэтгэгдэл ирсэн.
// Хэрэглэгч газар бүрт нэг л сэтгэгдэл бичдэг тул энэ нь ялгаатай хүмүүсийн тоо.
export const POPULAR_WINDOW_DAYS = 7;
export const POPULAR_MIN_REVIEWS = 3;

const WINDOW_MS = POPULAR_WINDOW_DAYS * 24 * 60 * 60 * 1000;

// Газар бүрийн сүүлийн хугацааны сэтгэгдлийн тоо.
export function recentReviewCounts(reviews: Pick<Review, "spot_id" | "created_at">[], now: number) {
  const counts: Record<number, number> = {};
  for (const review of reviews) {
    if (now - new Date(review.created_at).getTime() <= WINDOW_MS) {
      counts[review.spot_id] = (counts[review.spot_id] ?? 0) + 1;
    }
  }
  return counts;
}

export const isPopular = (recentCount: number | undefined) => (recentCount ?? 0) >= POPULAR_MIN_REVIEWS;
