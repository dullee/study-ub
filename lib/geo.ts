import { useCallback, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionaries";

export type LatLng = { lat: number; lng: number };

// Алдааны бичвэрийг UI сонгосон хэлээр харуулна (geoDenied гэх мэт).
export type GeoError = "geoDenied" | "geoUnavailable" | "geoTimeout" | "geoUnsupported";

export type UserLocationState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "ready"; coords: LatLng; accuracy: number }
  | { status: "error"; error: GeoError };

// Хоёр цэгийн хоорондох шулуун зай (км), haversine томьёо.
export function distanceKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// 1 км-ээс бага бол метрээр (50 м алхамтай), түүнээс дээш бол км-ээр. Нэгжийг сонгосон хэлээр.
export function formatDistance(km: number, t: Pick<Dictionary, "meters" | "kilometers">) {
  const meters = Math.max(50, Math.round((km * 1000) / 50) * 50);
  if (meters < 1000) return t.meters(meters);
  return t.kilometers(km < 9.95 ? km.toFixed(1) : String(Math.round(km)));
}

const ERRORS: Record<number, GeoError> = { 1: "geoDenied", 2: "geoUnavailable", 3: "geoTimeout" };

// Хэрэглэгч товч дарсны дараа л байршил асууна — хуудас нээгдэхэд зөвшөөрөл нэхэхгүй.
export function useUserLocation() {
  const [state, setState] = useState<UserLocationState>({ status: "idle" });

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "error", error: "geoUnsupported" });
      return;
    }
    setState({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setState({
          status: "ready",
          coords: { lat: position.coords.latitude, lng: position.coords.longitude },
          accuracy: position.coords.accuracy,
        }),
      (error) => setState({ status: "error", error: ERRORS[error.code] ?? "geoUnavailable" }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  const clear = useCallback(() => setState({ status: "idle" }), []);

  return { location: state, locate, clear };
}
