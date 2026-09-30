import { describe, expect, it } from "vitest";
import {
  BusynessLevel,
  busynessPattern,
  checkinProximity,
  nearestLevel,
  recentOwnCheckin,
  SpotCheckin,
  summarizeAllBusyness,
  summarizeBusyness,
  ubWeekdayHour,
} from "@/lib/busyness";

const NOW = Date.UTC(2026, 8, 30, 6, 0);
let nextId = 1;
const checkin = (minutesAgo: number, level: BusynessLevel, extra: Partial<SpotCheckin> = {}): SpotCheckin => ({
  id: nextId++,
  spot_id: 1,
  user_id: "user_a",
  level,
  created_at: new Date(NOW - minutesAgo * 60_000).toISOString(),
  ...extra,
});

describe("summarizeBusyness", () => {
  it("returns null with no reports", () => {
    expect(summarizeBusyness([], NOW)).toBeNull();
  });

  it("ignores reports older than 90 minutes and from the future", () => {
    expect(summarizeBusyness([checkin(91, 5), checkin(-5, 5)], NOW)).toBeNull();
    expect(summarizeBusyness([checkin(89, 5)], NOW)?.level).toBe(5);
  });

  it("counts recent reports and remembers the newest one", () => {
    const newest = checkin(3, 2);
    const summary = summarizeBusyness([checkin(40, 2), newest, checkin(95, 5)], NOW);
    expect(summary).toEqual({ level: 2, count: 2, latestAt: newest.created_at });
  });

  it("weights newer reports more heavily", () => {
    // Хоосон (1) гэж 80 минутын өмнө, дүүрэн (5) гэж саяхан → дүүрэн тал руу.
    expect(summarizeBusyness([checkin(80, 1), checkin(1, 5)], NOW)?.level).toBe(4);
    expect(summarizeBusyness([checkin(1, 1), checkin(80, 5)], NOW)?.level).toBe(2);
  });

  it("averages equally recent reports", () => {
    expect(summarizeBusyness([checkin(10, 2), checkin(10, 4)], NOW)?.level).toBe(3);
  });
});

describe("summarizeAllBusyness", () => {
  it("groups reports by place and leaves out places with no recent reports", () => {
    const result = summarizeAllBusyness(
      [checkin(5, 5, { spot_id: 1 }), checkin(5, 1, { spot_id: 2 }), checkin(200, 3, { spot_id: 3 })],
      NOW
    );
    expect(Object.keys(result).sort()).toEqual(["1", "2"]);
    expect(result[1].level).toBe(5);
    expect(result[2].level).toBe(1);
  });
});

describe("recentOwnCheckin", () => {
  it("finds the user's own report from the last 30 minutes only", () => {
    const mine = checkin(10, 3);
    expect(recentOwnCheckin([checkin(5, 4, { user_id: "user_b" }), mine], "user_a", NOW)).toBe(mine);
    expect(recentOwnCheckin([checkin(31, 3)], "user_a", NOW)).toBeUndefined();
  });
});

describe("checkinProximity", () => {
  const spot = { lat: 47.9188, lng: 106.9176 };
  // Өргөрөгийн 0.001° ≈ 111 м.
  const north = (meters: number) => ({ lat: spot.lat + meters / 111_195, lng: spot.lng });

  it("is near when standing at the place", () => {
    expect(checkinProximity(spot, spot, 10)).toMatchObject({ near: true, imprecise: false });
  });

  it("allows 150 m plus the GPS error, capped at 100 m", () => {
    expect(checkinProximity(spot, north(140), 5).near).toBe(true);
    expect(checkinProximity(spot, north(170), 5).near).toBe(false);
    expect(checkinProximity(spot, north(240), 100).near).toBe(true);
    expect(checkinProximity(spot, north(260), 100).near).toBe(false);
    // Нарийвчлал 2 км байсан ч хөнгөлөлт 100 м-ээс хэтрэхгүй.
    expect(checkinProximity(spot, north(300), 2000).near).toBe(false);
  });

  it("flags very imprecise locations", () => {
    expect(checkinProximity(spot, north(500), 800).imprecise).toBe(true);
    expect(checkinProximity(spot, north(500), 200).imprecise).toBe(false);
  });

  it("reports the distance in kilometres", () => {
    expect(checkinProximity(spot, north(1000), 10).distanceKm).toBeCloseTo(1, 2);
  });
});

describe("ubWeekdayHour", () => {
  it("converts to Ulaanbaatar time (UTC+8), Monday = 0", () => {
    // 2026-09-28 is a Monday. 23:30 UTC Sunday = 07:30 Monday in Ulaanbaatar.
    expect(ubWeekdayHour(Date.UTC(2026, 8, 27, 23, 30))).toEqual({ weekday: 0, hour: 7 });
    // 16:00 UTC Sunday = 00:00 Monday in Ulaanbaatar (the day boundary).
    expect(ubWeekdayHour(Date.UTC(2026, 8, 27, 16, 0))).toEqual({ weekday: 0, hour: 0 });
    expect(ubWeekdayHour(Date.UTC(2026, 8, 27, 15, 59))).toEqual({ weekday: 6, hour: 23 });
  });
});

describe("busynessPattern", () => {
  // NOW = Wednesday 2026-09-30 14:00 in Ulaanbaatar.
  const at = (daysAgo: number, ubHour: number, level: BusynessLevel): SpotCheckin => ({
    id: nextId++,
    spot_id: 1,
    user_id: "u",
    level,
    created_at: new Date(Date.UTC(2026, 8, 30 - daysAgo, ubHour - 8, 15)).toISOString(),
  });

  it("averages reports by weekday and hour", () => {
    const cells = busynessPattern([at(7, 10, 2), at(14, 10, 4), at(14, 10, 3), at(0, 11, 5)], NOW);
    expect(cells).toContainEqual({ weekday: 2, hour: 10, avg_level: 3, reports: 3 });
    expect(cells).toContainEqual({ weekday: 2, hour: 11, avg_level: 5, reports: 1 });
    expect(cells).toHaveLength(2);
  });

  it("only uses the last 8 weeks and never the future", () => {
    expect(busynessPattern([at(57, 10, 3), at(-1, 10, 3)], NOW)).toEqual([]);
    expect(busynessPattern([at(55, 10, 3)], NOW)).toHaveLength(1);
  });

  it("rounds the average to 2 decimals", () => {
    const [cell] = busynessPattern([at(1, 9, 1), at(8, 9, 1), at(15, 9, 2)], NOW);
    expect(cell.avg_level).toBe(1.33);
  });

  it("maps averages to the nearest level", () => {
    expect(nearestLevel(1.33)).toBe(1);
    expect(nearestLevel(2.5)).toBe(3);
    expect(nearestLevel(4.8)).toBe(5);
  });
});
