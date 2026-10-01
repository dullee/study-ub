"use client";

import { useEffect, useMemo } from "react";
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useI18n } from "@/components/LanguageProvider";
import { distanceKm, formatDistance, ULAANBAATAR, LatLng } from "@/lib/geo";
import { hasVerifiedCoordinates } from "@/lib/parking";
import { googleMapsDirectionsUrl, googleMapsUrl, PaidParking } from "@/types";
import { MapPin } from "lucide-react";

interface ParkingMapProps {
  parkings: PaidParking[];
  destination: (LatLng & { name: string }) | null;
  radiusKm: number | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  pickOnMap: boolean;
  onMapPick: (point: LatLng) => void;
  pickHint: string;
}

function ResizeController({ fullscreen }: { fullscreen: boolean }) {
  const map = useMap();
  useEffect(() => {
    const frame = requestAnimationFrame(() => map.invalidateSize());
    return () => cancelAnimationFrame(frame);
  }, [fullscreen, map]);
  return null;
}

function ViewController({
  destination,
  radiusKm,
  selected,
}: {
  destination: LatLng | null;
  radiusKm: number | null;
  selected: LatLng | null;
}) {
  const map = useMap();
  const destLat = destination?.lat ?? null;
  const destLng = destination?.lng ?? null;
  const selectedLat = selected?.lat ?? null;
  const selectedLng = selected?.lng ?? null;

  useEffect(() => {
    if (selectedLat != null && selectedLng != null) {
      map.flyTo([selectedLat, selectedLng], Math.max(map.getZoom(), 16), { duration: 0.7 });
      return;
    }
    if (destLat != null && destLng != null && radiusKm) {
      map.flyToBounds(L.latLng(destLat, destLng).toBounds(radiusKm * 2000), {
        padding: [28, 28],
        duration: 0.8,
      });
      return;
    }
    map.setView([ULAANBAATAR.lat, ULAANBAATAR.lng], 13);
  }, [map, destLat, destLng, radiusKm, selectedLat, selectedLng]);

  return null;
}

function MapPickController({
  enabled,
  onPick,
}: {
  enabled: boolean;
  onPick: (point: LatLng) => void;
}) {
  const map = useMap();
  useMapEvents({
    click(event) {
      if (!enabled) return;
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  useEffect(() => {
    const container = map.getContainer();
    const previous = container.style.cursor;
    if (enabled) container.style.cursor = "crosshair";
    return () => {
      container.style.cursor = previous;
    };
  }, [enabled, map]);
  return null;
}

function pinIcon(selected: boolean) {
  const size = selected ? 36 : 28;
  return L.divIcon({
    className: "parking-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:#f59e0b;color:#0f172a;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${selected ? 16 : 13}px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)">P</div>`,
  });
}

export default function ParkingMap({
  parkings,
  destination,
  radiusKm,
  selectedId,
  onSelect,
  fullscreen,
  onToggleFullscreen,
  pickOnMap,
  onMapPick,
  pickHint,
}: ParkingMapProps) {
  const { t } = useI18n();
  const defaultIcon = useMemo(() => pinIcon(false), []);
  const selectedIcon = useMemo(() => pinIcon(true), []);
  const selectedRaw = parkings.find((parking) => parking.id === selectedId) ?? null;
  const selected = selectedRaw && hasVerifiedCoordinates(selectedRaw) ? selectedRaw : null;

  return (
    <div
      className={`h-full w-full overflow-hidden shadow-dialog relative z-0 ${
        fullscreen ? "" : "rounded-md border border-line"
      }`}
    >
      <button
        type="button"
        onClick={onToggleFullscreen}
        aria-pressed={fullscreen}
        aria-label={fullscreen ? t.exitFullscreen : t.enterFullscreen}
        title={fullscreen ? t.exitFullscreenTitle : t.fullscreen}
        className="absolute top-3 right-3 z-[1000] h-10 w-10 flex items-center justify-center rounded-md bg-sheet text-ink shadow-sheet border border-black/20 hover:bg-panel"
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
      <MapContainer
        center={[ULAANBAATAR.lat, ULAANBAATAR.lng]}
        zoom={13}
        className="h-full w-full"
      >
        <ResizeController fullscreen={fullscreen} />
        <MapPickController enabled={pickOnMap} onPick={onMapPick} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ViewController destination={destination} radiusKm={radiusKm} selected={selected} />
        {destination && radiusKm ? (
          <Circle
            center={[destination.lat, destination.lng]}
            radius={radiusKm * 1000}
            interactive={false}
            pathOptions={{ color: "#1466c2", weight: 2, dashArray: "6 6", fillColor: "#1466c2", fillOpacity: 0.07 }}
          />
        ) : null}
        {destination ? (
          <CircleMarker
            center={[destination.lat, destination.lng]}
            radius={9}
            pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#ff8a2a", fillOpacity: 1 }}
          >
            <Popup>
              <span className="font-sans text-xs font-semibold">{destination.name}</span>
            </Popup>
          </CircleMarker>
        ) : null}
        {parkings.filter(hasVerifiedCoordinates).map((parking) => {
          const active = parking.id === selectedId;
          const km = destination ? distanceKm(destination, parking) : null;
          const directions =
            destination && hasVerifiedCoordinates(parking)
              ? googleMapsDirectionsUrl(destination, parking)
              : googleMapsUrl(parking);
          const missing = t.parkingUnavailable;
          return (
            <Marker
              key={parking.id}
              position={[parking.lat, parking.lng]}
              icon={active ? selectedIcon : defaultIcon}
              zIndexOffset={active ? 1000 : 0}
              eventHandlers={{ click: () => onSelect(parking.id) }}
            >
              <Popup>
                <div className="font-sans text-xs">
                  <b className="text-sm text-ink">{parking.name}</b>
                  <br />
                  <MapPin aria-hidden="true" className="h-3 w-3 inline -mt-0.5 mr-1" strokeWidth={2} />{parking.address?.trim() || missing}
                  {km != null ? (
                    <>
                      <br />
                      {t.distance}: {formatDistance(km, t)}
                    </>
                  ) : null}
                  <br />
                  {t.parkingHourlyRate}: {parking.hourlyRate?.trim() || missing}
                  <br />
                  {t.parkingHours}: {parking.hours?.trim() || missing}
                  {parking.hourlyRate || parking.hours ? (
                    <>
                      <br />
                      <span className="text-ink-muted">{t.parkingSourceNote}</span>
                    </>
                  ) : null}
                  {directions ? (
                    <>
                      <br />
                      <a href={directions} target="_blank" rel="noopener noreferrer">
                        {destination ? t.parkingDirections : "Google Maps"}
                      </a>
                    </>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {pickOnMap ? (
        <p className="pointer-events-none absolute bottom-3 left-3 right-14 z-[1000] rounded-md bg-panel/85 px-3 py-2 text-xs text-ink">
          {pickHint}
        </p>
      ) : null}
    </div>
  );
}
