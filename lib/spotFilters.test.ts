import { describe, expect, it } from "vitest";
import { DEFAULT_FILTERS, FilterContext, matchesFilters, sortSpots, SpotFilters, activeFilterCount } from "@/lib/spotFilters";
import { BusynessLevel, BusynessSummary } from "@/lib/busyness";
import { StudySpot } from "@/types";

const spot = (id: number, extra: Partial<StudySpot> = {}): StudySpot => ({
  id,
  name: `Spot ${id}`,
  location: "UB",
  hours: "09:00 - 18:00",
  lat: 47.9,
  lng: 106.9,
  tags: [],
  image: "",
  ...extra,
});

const busy = (level: BusynessLevel, count = 3): BusynessSummary => ({ level, count, latestAt: "2026-09-30T06:00:00Z" });

const ctx = (overrides: Partial<FilterContext> = {}): FilterContext => ({
  summaries: {},
  recentCounts: {},
  isOpen: null,
  distances: null,
  busyness: {},
  favorites: new Set(),
  ...overrides,
});

const filters = (overrides: Partial<SpotFilters>): SpotFilters => ({ ...DEFAULT_FILTERS, ...overrides });

describe("notBusyNow filter", () => {
  const context = ctx({ busyness: { 1: busy(1), 2: busy(2), 3: busy(3), 4: busy(5) } });

  it("keeps places currently reported as Empty or Quiet", () => {
    const kept = [1, 2, 3, 4, 5].filter((id) => matchesFilters(spot(id), filters({ notBusyNow: true }), context));
    expect(kept).toEqual([1, 2]);
  });

  it("leaves out places with no recent reports (can't claim they're quiet)", () => {
    expect(matchesFilters(spot(5), filters({ notBusyNow: true }), context)).toBe(false);
  });

  it("does nothing when off", () => {
    expect(matchesFilters(spot(5), filters({}), context)).toBe(true);
    expect(matchesFilters(spot(4), filters({}), context)).toBe(true);
  });

  it("counts as an active filter", () => {
    expect(activeFilterCount(filters({ notBusyNow: true }))).toBe(1);
    expect(activeFilterCount(filters({}))).toBe(0);
  });
});

describe("leastBusy sort", () => {
  it("puts places with reports first, least busy at the top; the rest keep their order", () => {
    const spots = [spot(1), spot(2), spot(3), spot(4), spot(5)];
    const context = ctx({ busyness: { 2: busy(4), 4: busy(1), 5: busy(2) } });
    expect(sortSpots(spots, "leastBusy", context).map((s) => s.id)).toEqual([4, 5, 2, 1, 3]);
  });

  it("breaks ties by the number of reports (more reports = more reliable)", () => {
    const context = ctx({ busyness: { 1: busy(2, 1), 2: busy(2, 6) } });
    expect(sortSpots([spot(1), spot(2)], "leastBusy", context).map((s) => s.id)).toEqual([2, 1]);
  });
});

describe("other filters", () => {
  it("minRating needs a rating at or above the threshold", () => {
    const context = ctx({ summaries: { 1: { rating: { value: 4.6, count: 3 } }, 2: { rating: { value: 3.9, count: 8 } } } });
    expect(matchesFilters(spot(1), filters({ minRating: 4.5 }), context)).toBe(true);
    expect(matchesFilters(spot(2), filters({ minRating: 4.5 }), context)).toBe(false);
    expect(matchesFilters(spot(3), filters({ minRating: 4.5 }), context)).toBe(false);
  });

  it("amenities must all match; categories match any", () => {
    const cafe = spot(1, { category: "cafe", amenities: ["wifi", "outlets"] });
    expect(matchesFilters(cafe, filters({ amenities: ["wifi", "outlets"] }), ctx())).toBe(true);
    expect(matchesFilters(cafe, filters({ amenities: ["wifi", "parking"] }), ctx())).toBe(false);
    expect(matchesFilters(cafe, filters({ categories: ["library", "cafe"] }), ctx())).toBe(true);
    expect(matchesFilters(cafe, filters({ categories: ["library"] }), ctx())).toBe(false);
  });

  it("openNow is skipped when the time isn't known yet (server render)", () => {
    expect(matchesFilters(spot(1), filters({ openNow: true }), ctx({ isOpen: null }))).toBe(true);
    expect(matchesFilters(spot(1), filters({ openNow: true }), ctx({ isOpen: () => false }))).toBe(false);
  });
});

describe("savedOnly filter", () => {
  it("keeps only the user's saved places", () => {
    const context = ctx({ favorites: new Set([2, 4]) });
    const kept = [1, 2, 3, 4].filter((id) => matchesFilters(spot(id), filters({ savedOnly: true }), context));
    expect(kept).toEqual([2, 4]);
    expect(activeFilterCount(filters({ savedOnly: true }))).toBe(1);
  });

  it("shows nothing when nothing is saved", () => {
    expect(matchesFilters(spot(1), filters({ savedOnly: true }), ctx())).toBe(false);
  });
});
