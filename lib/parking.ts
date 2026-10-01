import { PaidParking, StudySpot } from "@/types";

// Очих газар: сурах газар, эсвэл нэр/хаягаар хайсан цэг. GPS ашиглахгүй.
export type ParkingDestination = {
  name: string;
  location: string;
  lat: number;
  lng: number;
  spotId?: number;
};

export type PlaceSearchResult = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  exact?: boolean;
};

export function destinationFromSpot(spot: StudySpot): ParkingDestination {
  return {
    name: spot.name,
    location: spot.location,
    lat: spot.lat,
    lng: spot.lng,
    spotId: spot.id,
  };
}

// Очих газрын эргэн тойронд харуулах тод радиус (км).
export const PARKING_RADIUS_OPTIONS = [0.5, 1, 2] as const;
export const DEFAULT_PARKING_RADIUS_KM = 1;

// Газрын зурагт зөвхөн эх сурвалжаас баталгаажсан координат орно.
export function hasVerifiedCoordinates(
  parking: PaidParking
): parking is PaidParking & { lat: number; lng: number } {
  return (
    parking.coordinatesVerified &&
    parking.lat != null &&
    parking.lng != null &&
    Number.isFinite(parking.lat) &&
    Number.isFinite(parking.lng)
  );
}

// Дүүрэг, хаяг, үнэ, цаг, эсвэл координат дутуу бол шалгалт хэрэгтэй.
// Багтаамж олон газарт нийтлэгдээгүй — түүнийг дангаар нь "шалгалт хэрэгтэй" болгохгүй.
export function parkingNeedsVerification(parking: PaidParking) {
  return (
    !hasVerifiedCoordinates(parking) ||
    !parking.district?.trim() ||
    !parking.address?.trim() ||
    !parking.hourlyRate?.trim() ||
    !parking.hours?.trim()
  );
}
