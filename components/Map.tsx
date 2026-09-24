"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { googleMapsUrl, StudySpot } from "@/types";

interface MapProps {
  spots: StudySpot[];
  focusCoords: [number, number] | null;
  onOpenDetails: (spot: StudySpot) => void;
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

export default function Map({ spots, focusCoords, onOpenDetails }: MapProps) {
  const customIcon = useMemo(
    () =>
      L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      }),
    []
  );

  return (
    <div className="h-[350px] w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative z-0">
      <MapContainer center={[47.9188, 106.9176]} zoom={13} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController focusCoords={focusCoords} />
        {spots.map((spot) => (
          <Marker key={spot.id} position={[spot.lat, spot.lng]} icon={customIcon}>
            <Popup>
              <div className="font-sans text-xs">
                <b className="text-indigo-600 text-sm">{spot.name}</b>
                <br />
                📍 {spot.location}
                <br />
                ⏰ {spot.hours}
                <br />
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
        ))}
      </MapContainer>
    </div>
  );
}
