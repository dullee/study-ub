import { describe, expect, it } from "vitest";
import { parkingNear } from "@/lib/parking";
import { PaidParking } from "@/types";

const lot = (id: string, lat: number | null, lng: number | null, coordinatesVerified = true): PaidParking => ({
  id,
  name: id,
  district: null,
  address: null,
  capacity: null,
  hourlyRate: null,
  hours: null,
  lat,
  lng,
  coordinatesVerified,
  mapsUrl: null,
  sourceUrl: "",
  verifiedOn: "",
});

// Сүхбаатарын талбай орчим; 0.001° өргөрөг ≈ 111 м.
const here = { lat: 47.9188, lng: 106.9176 };

describe("parkingNear", () => {
  it("returns lots inside the radius, nearest first", () => {
    const result = parkingNear(here, [lot("far", 47.9388, 106.9176), lot("b", 47.9238, 106.9176), lot("a", 47.9198, 106.9176)]);
    expect(result.map((item) => item.parking.id)).toEqual(["a", "b"]);
    expect(result[0].km).toBeGreaterThan(0.1);
    expect(result[0].km).toBeLessThan(0.12);
  });

  it("skips lots without verified coordinates", () => {
    const result = parkingNear(here, [lot("unverified", 47.9189, 106.9176, false), lot("missing", null, null)]);
    expect(result).toEqual([]);
  });

  it("respects the radius and the limit", () => {
    const lots = [1, 2, 3, 4].map((n) => lot(`l${n}`, 47.9188 + n * 0.001, 106.9176));
    expect(parkingNear(here, lots, 0.25).map((item) => item.parking.id)).toEqual(["l1", "l2"]);
    expect(parkingNear(here, lots, 1, 3)).toHaveLength(3);
  });
});
