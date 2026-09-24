"use client";

import { useEffect, useMemo } from "react";
import { Circle, CircleMarker, MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { googleMapsUrl, StudySpot } from "@/types";
import { LatLng } from "@/lib/geo";

interface MapProps {
  spots: StudySpot[];
  // Сонгосон зайнаас гадуурх газрууд — бүдгэрүүлж, бусдын ард харуулна.
  dimmedIds: Set<number>;
  focusCoords: [number, number] | null;
  onOpenDetails: (spot: StudySpot) => void;
  // Хэрэглэгчийн байршил ба зайн шүүлтүүр (км) — тэмдэг, радиусын тойрог зурна.
  userCoords: LatLng | null;
  radiusKm: number | null;
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

const ICON_OPTIONS: L.IconOptions = {
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
};

export default function Map({ spots, dimmedIds, focusCoords, onOpenDetails, userCoords, radiusKm }: MapProps) {
  const customIcon = useMemo(() => L.icon(ICON_OPTIONS), []);
  const dimmedIcon = useMemo(() => L.icon({ ...ICON_OPTIONS, className: "grayscale opacity-50" }), []);

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative z-0">
      <MapContainer center={[47.9188, 106.9176]} zoom={13} className="h-full w-full">
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
              <span className="font-sans text-xs font-semibold">📍 Та энд байна</span>
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
                      <span className="text-slate-500">Сонгосон зайнаас гадна</span>
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
                    Дэлгэрэнгүй
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
