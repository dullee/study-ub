import { StudySpot } from "@/types";
import { SpotSummary } from "@/lib/scores";
import { isPopular } from "@/lib/popular";
import { BusynessSummary } from "@/lib/busyness";

// Хайлтын нэмэлт шүүлтүүр ба эрэмбэ. Шошго (activeTags), зайн шүүлтүүр тусдаа хэвээр.

export type SortKey = "recommended" | "rating" | "reviews" | "distance" | "popular" | "leastBusy";
export const SORT_KEYS: SortKey[] = ["recommended", "rating", "reviews", "distance", "popular", "leastBusy"];

// "Одоо сул" шүүлтүүр: сүүлийн 90 минутын мэдээллээр Хоосон (1) эсвэл Сул (2).
export const NOT_BUSY_MAX_LEVEL = 2;

export const MIN_RATING_OPTIONS = [3, 4, 4.5] as const;

export interface SpotFilters {
  minRating: number | null;
  openNow: boolean;
  popularOnly: boolean;
  notBusyNow: boolean;
  categories: string[];
  amenities: string[];
  accessibility: string[];
  sort: SortKey;
}

export const DEFAULT_FILTERS: SpotFilters = {
  minRating: null,
  openNow: false,
  popularOnly: false,
  notBusyNow: false,
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
    (filters.notBusyNow ? 1 : 0) +
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
  // Одоогийн ачаалал (сүүлийн 90 минут); мэдээлэлгүй газар байхгүй.
  busyness: Record<number, BusynessSummary>;
}

// Сонгосон бүлэг дотор аль нэг нь таарвал (жишээ нь кафе ЭСВЭЛ номын сан); үйлчилгээ, хүртээмж — бүгд таарах ёстой.
export function matchesFilters(spot: StudySpot, filters: SpotFilters, ctx: FilterContext) {
  if (filters.minRating !== null) {
    const rating = ctx.summaries[spot.id]?.rating?.value;
    if (rating === undefined || rating < filters.minRating) return false;
  }
  if (filters.openNow && ctx.isOpen && ctx.isOpen(spot) !== true) return false;
  if (filters.popularOnly && !isPopular(ctx.recentCounts[spot.id])) return false;
  // Мэдээлэлгүй газрыг "сул" гэж баталж чадахгүй — оруулахгүй.
  if (filters.notBusyNow) {
    const level = ctx.busyness[spot.id]?.level;
    if (level === undefined || level > NOT_BUSY_MAX_LEVEL) return false;
  }
  if (filters.categories.length > 0 && !filters.categories.includes(spot.category ?? "")) return false;
  const amenities = spot.amenities ?? [];
  if (!filters.amenities.every((key) => amenities.includes(key))) return false;
  const accessibility = spot.accessibility ?? [];
  if (!filters.accessibility.every((key) => accessibility.includes(key))) return false;
  return true;
}

// "recommended": эрэлттэй газрууд эхэнд, дараа нь өмнөх эрэмбэ (шошгын оноо, зай — энд ирэхээс өмнө хийгдсэн).
// Бусад нь тогтвортой эрэмбэ: тэнцвэл өмнөх дараалал хадгалагдана. Утгагүй газар хамгийн сүүлд.
export function sortSpots(spots: StudySpot[], sort: SortKey, ctx: FilterContext) {
  if (sort === "recommended") {
    // "🔥 Эрэлттэй" газрууд эхэнд; бүлэг бүрийн дотор өмнөх эрэмбэ (шошгын оноо, зай) хэвээр.
    const popular = spots.filter((spot) => isPopular(ctx.recentCounts[spot.id]));
    return popular.length === 0 ? spots : [...popular, ...spots.filter((spot) => !popular.includes(spot))];
  }
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
      case "leastBusy": {
        // Мэдээлэлтэй нь эхэнд, сул нь түрүүнд; тэнцвэл олон мэдээлэлтэй (найдвартай) нь.
        const busy = ctx.busyness[spot.id];
        return busy ? [1, -busy.level, busy.count] : [0];
      }
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
