import { useCallback, useState } from "react";

export type LatLng = { lat: number; lng: number };

export type UserLocationState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "ready"; coords: LatLng; accuracy: number }
  | { status: "error"; message: string };

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

// 1 км-ээс бага бол метрээр (50 м алхамтай), түүнээс дээш бол км-ээр.
export function formatDistance(km: number) {
  const meters = Math.max(50, Math.round((km * 1000) / 50) * 50);
  if (meters < 1000) return `${meters} м`;
  return `${km < 9.95 ? km.toFixed(1) : Math.round(km)} км`;
}

const ERROR_MESSAGES: Record<number, string> = {
  1: "Байршлын зөвшөөрөл өгөөгүй байна. Хөтчийн тохиргооноос зөвшөөрнө үү.",
  2: "Байршлыг тодорхойлж чадсангүй.",
  3: "Байршил тодорхойлоход хэт удаж байна. Дахин оролдоно уу.",
};

// Хэрэглэгч товч дарсны дараа л байршил асууна — хуудас нээгдэхэд зөвшөөрөл нэхэхгүй.
export function useUserLocation() {
  const [state, setState] = useState<UserLocationState>({ status: "idle" });

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "error", message: "Таны хөтөч байршил тодорхойлохыг дэмжихгүй байна." });
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
      (error) => setState({ status: "error", message: ERROR_MESSAGES[error.code] ?? ERROR_MESSAGES[2] }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  const clear = useCallback(() => setState({ status: "idle" }), []);

  return { location: state, locate, clear };
}
