import { PaidParking } from "@/types";
import { supabase } from "@/lib/supabase/client";

type ParkingRow = {
  id: number;
  name: string;
  district: string | null;
  address: string | null;
  capacity: number | null;
  hourly_rate: string | null;
  hours: string | null;
  lat: number | null;
  lng: number | null;
  coordinates_verified: boolean | null;
  maps_url: string | null;
  source_url: string | null;
  verified_on: string | null;
};

function validCoord(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

function mapParking(row: ParkingRow): PaidParking | null {
  const name = row.name?.trim();
  const sourceUrl = row.source_url?.trim();
  const verifiedOn = row.verified_on?.trim();
  if (!name || !sourceUrl || !verifiedOn) return null;
  const lat = row.lat;
  const lng = row.lng;
  const coordsOk = lat != null && lng != null && validCoord(lat, lng);
  return {
    id: String(row.id),
    name,
    district: row.district?.trim() || null,
    address: row.address?.trim() || null,
    capacity: row.capacity ?? null,
    hourlyRate: row.hourly_rate?.trim() || null,
    hours: row.hours?.trim() || null,
    lat: coordsOk ? lat : null,
    lng: coordsOk ? lng : null,
    coordinatesVerified: Boolean(row.coordinates_verified) && coordsOk,
    mapsUrl: row.maps_url?.trim() || null,
    sourceUrl,
    verifiedOn,
  };
}

// Хүснэгт байхгүй, эсвэл уншиж чадаагүй бол null — дуудагч нь data/paidParking.ts руу унана.
export async function fetchPaidParking(): Promise<PaidParking[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("paid_parking")
    .select(
      "id, name, district, address, capacity, hourly_rate, hours, lat, lng, coordinates_verified, maps_url, source_url, verified_on"
    )
    .order("name");
  if (error || !data) return null;
  return data.flatMap((row) => {
    const parking = mapParking(row as ParkingRow);
    return parking ? [parking] : [];
  });
}
