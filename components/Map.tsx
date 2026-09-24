"use client";

import { useEffect, useMemo } from "react";
import { Circle, CircleMarker, MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { googleMapsUrl, StudySpot } from "@/types";
import { LatLng } from "@/lib/geo";
import { useI18n } from "@/components/LanguageProvider";

interface MapProps {
  spots: StudySpot[];
  // Сонгосон зайнаас гадуурх газрууд — бүдгэрүүлж, бусдын ард харуулна.
  dimmedIds: Set<number>;
  focusCoords: [number, number] | null;
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

const ICON_OPTIONS: L.IconOptions = {
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
};

export default function Map({
  spots,
  dimmedIds,
  focusCoords,
  onOpenDetails,
  userCoords,
  radiusKm,
  fullscreen,
  onToggleFullscreen,
}: MapProps) {
  const { t } = useI18n();
  const customIcon = useMemo(() => L.icon(ICON_OPTIONS), []);
  const dimmedIcon = useMemo(() => L.icon({ ...ICON_OPTIONS, className: "grayscale opacity-50" }), []);

  return (
    <div
      className={`h-full w-full overflow-hidden shadow-2xl relative z-0 ${
        fullscreen ? "" : "rounded-2xl border border-slate-800"
      }`}
    >
      <button
        type="button"
        onClick={onToggleFullscreen}
        aria-pressed={fullscreen}
        aria-label={fullscreen ? t.exitFullscreen : t.enterFullscreen}
        title={fullscreen ? t.exitFullscreenTitle : t.fullscreen}
        className="absolute top-3 right-3 z-[1000] h-10 w-10 flex items-center justify-center rounded-lg bg-white text-slate-800 shadow-md border border-black/20 hover:bg-slate-100"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {fullscreen ? (
            <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
          ) : (
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          )}
        </svg>
      </button>
      <MapContainer center={[47.9188, 106.9176]} zoom={13} className="h-full w-full">
        <ResizeController fullscreen={fullscreen} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController focusCoords={focusCoords} />
        <UserLocationController userCoords={userCoords} radiusKm={radiusKm} />
        {userCoords && radiusKm ? (
          <Circle
            center={[userCoords.lat, userCoords.lng]}
            radius={radiusKm * 1000}
            interactive={false}
            pathOptions={{ color: "#6366f1", weight: 2, dashArray: "6 6", fillColor: "#6366f1", fillOpacity: 0.08 }}
          />
        ) : null}
        {userCoords ? (
          <CircleMarker
            center={[userCoords.lat, userCoords.lng]}
            radius={8}
            pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }}
          >
            <Popup>
              <span className="font-sans text-xs font-semibold">{t.youAreHere}</span>
            </Popup>
          </CircleMarker>
        ) : null}
        {spots.map((spot) => {
          const dimmed = dimmedIds.has(spot.id);
          return (
            <Marker
              key={spot.id}
              position={[spot.lat, spot.lng]}
              icon={dimmed ? dimmedIcon : customIcon}
              zIndexOffset={dimmed ? -1000 : 0}
            >
              <Popup>
                <div className="font-sans text-xs">
                  <b className="text-indigo-600 text-sm">{spot.name}</b>
                  <br />
                  📍 {spot.location}
                  <br />
                  ⏰ {spot.hours}
                  <br />
                  {dimmed ? (
                    <>
                      <span className="text-slate-500">{t.outsideDistance}</span>
                      <br />
                    </>
                  ) : null}
                  <a href={googleMapsUrl(spot)} target="_blank" rel="noopener noreferrer">
                    Google Maps
                  </a>
                  {" · "}
                  <button
                    type="button"
                    onClick={() => onOpenDetails(spot)}
                    className="text-indigo-600 font-semibold hover:underline"
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
