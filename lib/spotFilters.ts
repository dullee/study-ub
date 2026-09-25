import { StudySpot } from "@/types";
import { SpotSummary } from "@/lib/scores";
import { isPopular } from "@/lib/popular";

// Хайлтын нэмэлт шүүлтүүр ба эрэмбэ. Шошго (activeTags), зайн шүүлтүүр тусдаа хэвээр.

export type SortKey = "recommended" | "rating" | "reviews" | "distance" | "popular";
export const SORT_KEYS: SortKey[] = ["recommended", "rating", "reviews", "distance", "popular"];

export const MIN_RATING_OPTIONS = [3, 4, 4.5] as const;

export interface SpotFilters {
  minRating: number | null;
  openNow: boolean;
  popularOnly: boolean;
  categories: string[];
  amenities: string[];
  accessibility: string[];
  sort: SortKey;
}

export const DEFAULT_FILTERS: SpotFilters = {
  minRating: null,
  openNow: false,
  popularOnly: false,
  categories: [],
  amenities: [],
  accessibility: [],
  sort: "recommended",
};

// Эрэмбээс бусад идэвхтэй шүүлтүүрийн тоо (товчны тэмдэгт).
export function activeFilterCount(filters: SpotFilters) {
  return (
    (filters.minRating !== null ? 1 : 0) +
    (filters.openNow ? 1 : 0) +
    (filters.popularOnly ? 1 : 0) +
    filters.categories.length +
    filters.amenities.length +
    filters.accessibility.length
  );
}

export function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export interface FilterContext {
  summaries: Record<number, SpotSummary>;
  recentCounts: Record<number, number>;
  // null — цаг мэдэгдэхгүй (сервер дээр): "Одоо нээлттэй" шүүлтүүрийг алгасна.
  isOpen: ((spot: StudySpot) => boolean | null) | null;
  distances: Record<number, number> | null;
}

// Сонгосон бүлэг дотор аль нэг нь таарвал (жишээ нь кафе ЭСВЭЛ номын сан); үйлчилгээ, хүртээмж — бүгд таарах ёстой.
export function matchesFilters(spot: StudySpot, filters: SpotFilters, ctx: FilterContext) {
  if (filters.minRating !== null) {
    const rating = ctx.summaries[spot.id]?.rating?.value;
    if (rating === undefined || rating < filters.minRating) return false;
  }
  if (filters.openNow && ctx.isOpen && ctx.isOpen(spot) !== true) return false;
  if (filters.popularOnly && !isPopular(ctx.recentCounts[spot.id])) return false;
  if (filters.categories.length > 0 && !filters.categories.includes(spot.category ?? "")) return false;
  const amenities = spot.amenities ?? [];
  if (!filters.amenities.every((key) => amenities.includes(key))) return false;
  const accessibility = spot.accessibility ?? [];
  if (!filters.accessibility.every((key) => accessibility.includes(key))) return false;
  return true;
}

// "recommended" бол өмнөх эрэмбэ (шошгын оноо, дараа нь зай) хэвээр — энд ирэхээс өмнө хийгдсэн.
// Бусад нь тогтвортой эрэмбэ: тэнцвэл өмнөх дараалал хадгалагдана. Утгагүй газар хамгийн сүүлд.
export function sortSpots(spots: StudySpot[], sort: SortKey, ctx: FilterContext) {
  if (sort === "recommended") return spots;
  const key = (spot: StudySpot): number[] => {
    const summary = ctx.summaries[spot.id];
    const rating = summary?.rating?.value ?? -1;
    const reviews = summary?.rating?.count ?? 0;
    switch (sort) {
      case "rating":
        return [rating, reviews];
      case "reviews":
        return [reviews, rating];
      case "popular":
        return [ctx.recentCounts[spot.id] ?? 0, reviews, rating];
      case "distance":
        return ctx.distances ? [-(ctx.distances[spot.id] ?? Infinity)] : [0];
    }
  };
  return spots
    .map((spot, index) => ({ spot, index, key: key(spot) }))
    .sort((a, b) => {
      for (let i = 0; i < a.key.length; i++) {
        if (a.key[i] !== b.key[i]) return b.key[i] - a.key[i];
      }
      return a.index - b.index;
    })
    .map((entry) => entry.spot);
}
