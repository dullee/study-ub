import { describe, expect, it } from "vitest";
import {
  BusynessLevel,
  checkinProximity,
  recentOwnCheckin,
  SpotCheckin,
  summarizeAllBusyness,
  summarizeBusyness,
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
