// React-гүй тул сервер (API route) дээр ч ашиглана. lib/geo.ts дахин экспортолно.

export type LatLng = { lat: number; lng: number };

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
