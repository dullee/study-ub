import { geocodeQueries, normalizePlaceName } from "@/lib/geocode/transliterate";
import { GeocodeHit, Geocoder } from "@/lib/geocode/types";

// Photon-ийн нийтийн сервер (photon.komoot.io) fair-use demo. Ачаалал, бэлэн байдлын баталгаа байхгүй.
// Их траффикт өөрийн Photon тавьж GEOCODER_URL-аар заана. Автокомплитод Nominatim ашиглахгүй.
const DEFAULT_URL = "https://photon.komoot.io/api/";
// lib/geo.ts-ийн ULAANBAATAR. Энд давхар бичсэн нь route handler React hook импортлохгүй.
const BIAS = { lat: 47.9188, lon: 106.9176 };

// Улаанбаатар болон ойр дүүрэг (Налайх орчим). Хайрцгаас гадуурх хариуг авахгүй.
const UB = { south: 47.7, west: 106.55, north: 48.2, east: 107.55 };

type PhotonFeature = {
  geometry?: { type?: string; coordinates?: number[] };
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    country?: string;
    countrycode?: string;
  };
};

function clean(text: string) {
  return text
    .replace(/[\u1800-\u18AF]/g, "")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/,\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inUlaanbaatar(lat: number, lng: number) {
  return lat >= UB.south && lat <= UB.north && lng >= UB.west && lng <= UB.east;
}

function featureToHit(feature: PhotonFeature, queries: string[]): GeocodeHit | null {
  const [lng, lat] = feature.geometry?.coordinates ?? [];
  if (feature.geometry?.type !== "Point" || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (!inUlaanbaatar(lat, lng)) return null;
  const country = feature.properties?.countrycode?.toUpperCase();
  if (country && country !== "MN") return null;

  const props = feature.properties ?? {};
  const name = clean(props.name || props.street || "");
  if (!name) return null;
  const address = clean(
    [props.housenumber, props.street, props.district, props.city, props.country].filter(Boolean).join(", ")
  );
  const normalizedName = normalizePlaceName(name);
  const exact = queries.some((query) => normalizePlaceName(query) === normalizedName);
  return { name, address: address || name, lat, lng, exact };
}

async function searchOnce(query: string, signal: AbortSignal): Promise<PhotonFeature[]> {
  const url = new URL(process.env.GEOCODER_URL || DEFAULT_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "5");
  url.searchParams.set("lang", "en");
  url.searchParams.set("lat", String(BIAS.lat));
  url.searchParams.set("lon", String(BIAS.lon));
  url.searchParams.set("bbox", `${UB.west},${UB.south},${UB.east},${UB.north}`);

  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("geocoder-failed");
  const body = (await res.json()) as { features?: PhotonFeature[] };
  return Array.isArray(body.features) ? body.features : [];
}

export const photonGeocoder: Geocoder = {
  id: "photon",
  async search(query, signal) {
    const queries = geocodeQueries(query);
    const batches = await Promise.all(queries.map((item) => searchOnce(item, signal)));
    const seen = new Set<string>();
    const hits: GeocodeHit[] = [];
    for (const features of batches) {
      for (const feature of features) {
        const hit = featureToHit(feature, queries);
        if (!hit) continue;
        const key = `${hit.name}|${hit.lat.toFixed(4)}|${hit.lng.toFixed(4)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        hits.push(hit);
      }
    }
    hits.sort((a, b) => Number(b.exact) - Number(a.exact));
    return hits.slice(0, 5);
  },
};
