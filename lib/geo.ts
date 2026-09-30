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

// Сүүлийн байршлыг 5 минут хадгална — хуудсаа дахин ачаалахад GPS хүлээхгүй.
// Зөвхөн энэ хөтөчид үлдэнэ; хугацаа нь дууссаныг уншихдаа устгана.
const LOCATION_CACHE_KEY = "studyspots_ub_location";
const LOCATION_CACHE_MS = 5 * 60 * 1000;
type CachedLocation = { coords: LatLng; accuracy: number; at: number };

function readCachedLocation(): CachedLocation | null {
  try {
    const cached = JSON.parse(localStorage.getItem(LOCATION_CACHE_KEY) || "null") as CachedLocation | null;
    if (cached && Date.now() - cached.at < LOCATION_CACHE_MS) return cached;
    localStorage.removeItem(LOCATION_CACHE_KEY);
  } catch {}
  return null;
}

function writeCachedLocation(location: CachedLocation) {
  try {
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location));
  } catch {}
}

// Хэрэглэгч товч дарсны дараа л байршил асууна — хуудас нээгдэхэд зөвшөөрөл нэхэхгүй.
// 5 минутаас шинэ хадгалсан байршил байвал шууд түүнийг ашиглана; fresh: true бол заавал шинээр тодорхойлж,
// хадгалсныг шинэчилнэ ("Миний байршил" товч, "Дахин шалгах").
export function useUserLocation() {
  const [state, setState] = useState<UserLocationState>({ status: "idle" });

  const locate = useCallback((options?: { fresh?: boolean }) => {
    if (!options?.fresh) {
      const cached = readCachedLocation();
      if (cached) {
        setState({ status: "ready", coords: cached.coords, accuracy: cached.accuracy });
        return;
      }
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "error", error: "geoUnsupported" });
      return;
    }
    setState({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        writeCachedLocation({ coords, accuracy: position.coords.accuracy, at: Date.now() });
        setState({ status: "ready", coords, accuracy: position.coords.accuracy });
      },
      (error) => setState({ status: "error", error: ERRORS[error.code] ?? "geoUnavailable" }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: options?.fresh ? 0 : 60000 }
    );
  }, []);

  const clear = useCallback(() => setState({ status: "idle" }), []);

  return { location: state, locate, clear };
}
