"use client";

import { useEffect, useMemo } from "react";
import { Circle, CircleMarker, MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { googleMapsUrl, StudySpot } from "@/types";
import { formatDistance, LatLng } from "@/lib/geo";
import { useI18n } from "@/components/LanguageProvider";
import { Clock, MapPin, Maximize2, Minimize2 } from "lucide-react";
import GoogleMapsIcon from "@/components/GoogleMapsIcon";
import { BusynessLevel, busynessInfo, BusynessSummary } from "@/lib/busyness";
import { paidParkingLocations } from "@/data/paidParking";
import { parkingNear, SPOT_PARKING_RADIUS_KM } from "@/lib/parking";

interface MapProps {
  spots: StudySpot[];
  // Сонгосон зайнаас гадуурх газрууд — бүдгэрүүлж, бусдын ард харуулна.
  dimmedIds: Set<number>;
  focusCoords: [number, number] | null;
  // Жагсаалтад хулганаар заасан газар — газрын зураг тэр рүү очиж, тэмдгийг тодруулна.
  highlightedId: number | null;
  // Одоогийн ачаалал — тэмдгийн дээр өнгөт цэг, popup-д мөр.
  busyness: Record<number, BusynessSummary>;
  now: number | null;
  onOpenDetails: (spot: StudySpot) => void;
  // Хэрэглэгчийн байршил ба зайн шүүлтүүр (км) — тэмдэг, радиусын тойрог зурна.
  userCoords: LatLng | null;
  radiusKm: number | null;
  // Бүтэн дэлгэц — байрлалыг page.tsx удирдана (header-ийн дээр гарахын тулд).
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}

function MapController({ focusCoords }: { focusCoords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (focusCoords) {
      map.flyTo(focusCoords, 16, { duration: 1.5 });
    }
  }, [focusCoords, map]);
  return null;
}

// Картад хулганаар заахад газрын зураг тэр газар руу зөөлөн очно (ойртуулсан хэвээр бол ойртуулалтыг хадгална).
function HighlightController({ spot }: { spot: StudySpot | null }) {
  const map = useMap();
  useEffect(() => {
    if (!spot) return;
    map.flyTo([spot.lat, spot.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [spot, map]);
  return null;
}

// Байршил өгөхөд тэр рүү, радиус сонгоход тойргийг бүтнээр нь харуулна.
function UserLocationController({ userCoords, radiusKm }: { userCoords: LatLng | null; radiusKm: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (!userCoords) return;
    const center = L.latLng(userCoords.lat, userCoords.lng);
    if (radiusKm) {
      map.flyToBounds(center.toBounds(radiusKm * 2000), { padding: [20, 20], duration: 1 });
    } else {
      map.flyTo(center, Math.max(map.getZoom(), 14), { duration: 1 });
    }
  }, [userCoords, radiusKm, map]);
  return null;
}

// Хэмжээ өөрчлөгдөхөд Leaflet хавтангаа дахин тооцоолно — эс бөгөөс саарал хэсэг үлдэнэ.
function ResizeController({ fullscreen }: { fullscreen: boolean }) {
  const map = useMap();
  useEffect(() => {
    const frame = requestAnimationFrame(() => map.invalidateSize());
    return () => cancelAnimationFrame(frame);
  }, [fullscreen, map]);
  return null;
}

type MarkerVariant = "normal" | "dimmed" | "highlight";

// Дугуй тэмдэг (Leaflet-ийн стандарт дусал биш; зогсоолын газрын зурагтай нэг хэлбэр): үйлдлийн хөх, цагаан хүрээ,
// дотор нь цэг — одоогийн ачаалалтай бол түүний өнгө, эс бөгөөс цагаан. Тодруулсан нь шөнийн хөх, том. Сүүдэр нарыг дагана.
const PIN_SIZE: Record<MarkerVariant, number> = { normal: 26, dimmed: 20, highlight: 36 };

function pinIcon(variant: MarkerVariant, level?: BusynessLevel) {
  const size = PIN_SIZE[variant];
  const fill = variant === "highlight" ? "#ff8a2a" : variant === "dimmed" ? "#3a587f" : "#1f7ae0";
  const dot = level ? busynessInfo(level).color : "#ffffff";
  return L.divIcon({
    html:
      `<svg viewBox="0 0 26 26" width="${size}" height="${size}" aria-hidden="true" ` +
      `style="display:block;overflow:visible;filter:drop-shadow(var(--sun-x) 2px 1.5px rgba(5,12,22,.45))">` +
      `<circle cx="13" cy="13" r="11.5" fill="${fill}" stroke="#fff" stroke-width="2.5"/>` +
      `<circle cx="13" cy="13" r="${level ? 5.5 : 3.5}" fill="${dot}" stroke="${level ? "#fff" : "none"}" stroke-width="1.5"/>` +
      `</svg>`,
    className: "spot-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// Ойролцоох төлбөртэй зогсоол: зогсоолын газрын зурагтай ижил шар "P", жижиг — газрын тэмдгээс доогуур зэрэглэлтэй.
const PARKING_PIN_SIZE = 22;
const parkingIcon = L.divIcon({
  className: "parking-pin",
  iconSize: [PARKING_PIN_SIZE, PARKING_PIN_SIZE],
  iconAnchor: [PARKING_PIN_SIZE / 2, PARKING_PIN_SIZE / 2],
  html: `<div aria-hidden="true" style="width:${PARKING_PIN_SIZE}px;height:${PARKING_PIN_SIZE}px;border-radius:9999px;background:#f59e0b;color:#050c16;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;border:2px solid #fff;box-shadow:0 2px 4px rgba(5,12,22,.4)">P</div>`,
});

export default function Map({
  spots,
  dimmedIds,
  focusCoords,
  highlightedId,
  busyness,
  now,
  onOpenDetails,
  userCoords,
  radiusKm,
  fullscreen,
  onToggleFullscreen,
}: MapProps) {
  const { t, locale } = useI18n();
  // (ачаалал 0–5) × 3 хувилбар — тэмдэг бүрт шинээр үүсгэхгүй.
  const pins = useMemo(() => {
    const cache: Record<string, L.DivIcon> = {};
    return (variant: MarkerVariant, level?: BusynessLevel) => (cache[`${variant}:${level ?? 0}`] ??= pinIcon(variant, level));
  }, []);
  const highlightedSpot = useMemo(
    () => spots.find((spot) => spot.id === highlightedId) ?? null,
    [spots, highlightedId]
  );
  // Картад заасан (утсанд: голд буй) газраас 1 км доторх зогсоолууд — тэр газар тодорсон үед л харагдана.
  const nearbyParking = useMemo(
    () => (highlightedSpot ? parkingNear(highlightedSpot, paidParkingLocations) : []),
    [highlightedSpot]
  );

  return (
    <div
      className={`h-full w-full overflow-hidden relative z-0 ${fullscreen ? "" : "rounded-md shadow-sheet"}`}
    >
      <button
        type="button"
        onClick={onToggleFullscreen}
        aria-pressed={fullscreen}
        aria-label={fullscreen ? t.exitFullscreen : t.enterFullscreen}
        title={fullscreen ? t.exitFullscreenTitle : t.fullscreen}
        className="absolute top-3 right-3 z-[1000] h-10 w-10 flex items-center justify-center rounded-md bg-sheet text-ink shadow-sheet hover:bg-panel transition-colors"
      >
        {fullscreen ? (
          <Minimize2 aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2.25} />
        ) : (
          <Maximize2 aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2.25} />
        )}
      </button>
      <MapContainer center={[47.9188, 106.9176]} zoom={13} className="h-full w-full">
        <ResizeController fullscreen={fullscreen} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController focusCoords={focusCoords} />
        <HighlightController spot={highlightedSpot} />
        <UserLocationController userCoords={userCoords} radiusKm={radiusKm} />
        {userCoords && radiusKm ? (
          <Circle
            center={[userCoords.lat, userCoords.lng]}
            radius={radiusKm * 1000}
            interactive={false}
            pathOptions={{ color: "#1466c2", weight: 2, dashArray: "6 6", fillColor: "#1466c2", fillOpacity: 0.07 }}
          />
        ) : null}
        {userCoords ? (
          <CircleMarker
            center={[userCoords.lat, userCoords.lng]}
            radius={8}
            pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#ff8a2a", fillOpacity: 1 }}
          >
            <Popup>
              <span className="font-sans text-xs font-semibold">{t.youAreHere}</span>
            </Popup>
          </CircleMarker>
        ) : null}
        {nearbyParking.map(({ parking, km }) => (
          <Marker
            key={parking.id}
            position={[parking.lat, parking.lng]}
            icon={parkingIcon}
            zIndexOffset={1000}
          >
            <Tooltip direction="top" offset={[0, -12]} className="font-sans">
              {parking.name}
              <span className="font-normal tabular-nums">
                {" · "}
                {formatDistance(km, t)}
                {parking.hourlyRate ? ` · ${parking.hourlyRate}` : ""}
              </span>
            </Tooltip>
          </Marker>
        ))}
        {spots.map((spot) => {
          const dimmed = dimmedIds.has(spot.id);
          const highlighted = spot.id === highlightedId;
          const busy = busyness[spot.id];
          const variant: MarkerVariant = highlighted ? "highlight" : dimmed ? "dimmed" : "normal";
          const busyInfo = busy ? busynessInfo(busy.level) : null;
          return (
            <Marker
              key={spot.id}
              position={[spot.lat, spot.lng]}
              icon={pins(variant, busy?.level)}
              zIndexOffset={highlighted ? 2000 : dimmed ? -1000 : 0}
            >
              {highlighted ? (
                <Tooltip permanent direction="top" offset={[0, -18]} className="font-sans font-semibold">
                  {spot.name}
                  <span className="block font-normal tabular-nums">
                    {nearbyParking.length > 0
                      ? t.parkingNearSpot(nearbyParking.length, SPOT_PARKING_RADIUS_KM)
                      : t.parkingNoneNearSpot(SPOT_PARKING_RADIUS_KM)}
                  </span>
                </Tooltip>
              ) : null}
              <Popup>
                <div className="font-sans text-xs">
                  <b className="text-ink text-sm">{spot.name}</b>
                  <br />
                  <MapPin aria-hidden="true" className="h-3 w-3 inline -mt-0.5 mr-1" strokeWidth={2} />{spot.location}
                  <br />
                  <Clock aria-hidden="true" className="h-3 w-3 inline -mt-0.5 mr-1" strokeWidth={2} />{spot.hours}
                  <br />
                  {busy && busyInfo && now !== null ? (
                    <>
                      <span className="font-semibold text-ink">
                        <span
                          aria-hidden="true"
                          className="inline-block h-2 w-2 rounded-full mr-1 align-middle"
                          style={{ backgroundColor: busyInfo.color }}
                        />
                        {busyInfo.label[locale]}
                      </span>{" "}
                      <span className="text-ink-muted">
                        · {t.busynessDetail(busy.count, Math.max(0, Math.round((now - Date.parse(busy.latestAt)) / 60_000)))}
                      </span>
                      <br />
                    </>
                  ) : null}
                  {dimmed ? (
                    <>
                      <span className="text-ink-muted">{t.outsideDistance}</span>
                      <br />
                    </>
                  ) : null}
                  <a
                    href={googleMapsUrl(spot)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 align-middle"
                  >
                    <GoogleMapsIcon className="h-3.5 w-3.5" />
                    Google Maps
                  </a>
                  {" · "}
                  <button
                    type="button"
                    onClick={() => onOpenDetails(spot)}
                    className="text-link font-semibold hover:underline"
                  >
                    {t.details}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
