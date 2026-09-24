// Google Maps холбоосоос координат, газрын нэрийг уншина. Хөтөч болон сервер хоёуланд ажиллана.

export type MapsLinkInfo = { lat: number; lng: number; name?: string };

const NUMBER = "(-?\\d+(?:\\.\\d+)?)";
const PAIR = new RegExp(`^(?:loc:)?\\s*${NUMBER}\\s*[,+ ]\\s*\\+?${NUMBER}\\s*$`);

function valid(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

function pair(text: string | null): { lat: number; lng: number } | null {
  if (!text) return null;
  const match = PAIR.exec(text.trim());
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  return valid(lat, lng) ? { lat, lng } : null;
}

// Богино холбоос (maps.app.goo.gl) координатгүй — сервер дээр /api/maps/resolve-оор задална.
export function isShortMapsLink(value: string) {
  try {
    const { hostname, pathname } = new URL(value.trim());
    return hostname === "maps.app.goo.gl" || (hostname === "goo.gl" && pathname.startsWith("/maps"));
  } catch {
    return false;
  }
}

export function parseMapsLink(value: string): MapsLinkInfo | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  const path = decodeURIComponent(url.pathname);
  const full = decodeURIComponent(url.href);

  const placeName = /\/place\/([^/@]+)/.exec(path)?.[1]?.replace(/\+/g, " ").trim();
  const name = placeName && !pair(placeName) ? placeName : undefined;

  // 1) !3d…!4d… — газрын яг цэг (@… нь зөвхөн дэлгэцийн төв).
  const pin = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/.exec(full);
  if (pin && valid(Number(pin[1]), Number(pin[2]))) {
    return { lat: Number(pin[1]), lng: Number(pin[2]), name };
  }

  // 2) ?q=47.9,106.9 гэх мэт параметрүүд.
  for (const key of ["q", "query", "ll", "destination", "center", "sll"]) {
    const coords = pair(url.searchParams.get(key));
    if (coords) return { ...coords, name };
  }

  // 3) /maps/search/47.9,+106.9 эсвэл /maps/place/47.9,106.9
  const segment = /\/maps\/(?:search|place|dir)\/([^/]+)/.exec(path)?.[1];
  const fromSegment = pair(segment?.replace(/\+/g, " ") ?? null);
  if (fromSegment) return { ...fromSegment, name };

  // 4) /@47.9,106.9,17z — дэлгэцийн төв, бусад нь байхгүй үед.
  const at = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(path);
  if (at && valid(Number(at[1]), Number(at[2]))) {
    return { lat: Number(at[1]), lng: Number(at[2]), name };
  }

  // Cookie зөвшөөрлийн хуудас: жинхэнэ холбоос нь continue параметрт байна.
  const next = url.searchParams.get("continue");
  return next ? parseMapsLink(next) : null;
}
