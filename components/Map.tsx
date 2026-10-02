"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Circle, CircleMarker, MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { googleMapsUrl, StudySpot } from "@/types";
import { formatDistance, LatLng } from "@/lib/geo";
import { useI18n } from "@/components/LanguageProvider";
import { Clock, MapPin, Maximize2, Minimize2, SquareParking, X } from "lucide-react";
import GoogleMapsIcon from "@/components/GoogleMapsIcon";
import { BusynessLevel, busynessInfo, BusynessSummary } from "@/lib/busyness";
import { paidParkingLocations } from "@/data/paidParking";
import { parkingNear, SPOT_PARKING_RADIUS_KM } from "@/lib/parking";

interface MapProps {
  spots: StudySpot[];
  // Сонгосон зайнаас гадуурх газрууд — бүдгэрүүлж, бусдын ард харуулна.
  dimmedIds: Set<number>;
  focusCoords: [number, number] | null;
  // Жагсаалтад хамгийн сүүлд хулганаар заасан газар — газрын зураг тэр рүү очиж, тэмдгийг тодруулна.
  highlightedId: number | null;
  // Картад заах бүрт нэмэгдэнэ — нэг картад дахин заахад ч газрын зураг буцаж очно.
  highlightTick: number;
  // Тэмдэг дарахад тэр газрыг тодруулна (ойролцоох зогсоолууд гарна); шошгын ✕ дарахад null — тодруулгыг арилгана.
  onHighlight: (spot: StudySpot | null) => void;
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
// Өөр газрын popup нээлттэй байвал хаана — эс бөгөөс заасан картад хамаагүй мэдээлэл дэлгэцэнд үлдэнэ.
// Тэмдэг дарж тодруулсан бол (tick өөрчлөгдөөгүй) нисэхгүй — хэрэглэгч тэр тэмдгээ аль хэдийн харж байгаа.
function HighlightController({ spot, tick }: { spot: StudySpot | null; tick: number }) {
  const map = useMap();
  const openPopup = useRef<L.Popup | null>(null);
  const lastTick = useRef(tick);
  useMapEvents({
    popupopen: (e) => {
      openPopup.current = e.popup;
    },
    popupclose: (e) => {
      if (openPopup.current === e.popup) openPopup.current = null;
    },
  });
  useEffect(() => {
    if (tick === lastTick.current) return;
    lastTick.current = tick;
    if (!spot) return;
    const openAt = openPopup.current?.getLatLng();
    if (openAt && !openAt.equals([spot.lat, spot.lng])) map.closePopup();
    map.flyTo([spot.lat, spot.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [spot, tick, map]);
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

// Тодруулсан газрын шошгыг хаах ✕. Leaflet tooltip нь дарагддаггүй (pointer-events: none) тул зөвхөн товчийг идэвхжүүлнэ.
// Даралтыг Leaflet-ээр шууд барина: газрын зураг руу дамжвал тэмдгийн popup нээгдэж, газрын зураг чирэгдэнэ.
function LabelCloseButton({ label, onClose }: { label: string; onClose: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const button = ref.current;
    if (!button) return;
    L.DomEvent.disableClickPropagation(button);
    L.DomEvent.on(button, "click", onClose);
    return () => {
      L.DomEvent.off(button, "click", onClose);
    };
  }, [onClose]);
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className="pointer-events-auto cursor-pointer -mt-1 -mr-1.5 h-7 w-7 shrink-0 flex items-center justify-center rounded-full text-ink-muted hover:bg-panel hover:text-ink transition-colors"
    >
      <X aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
    </button>
  );
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
  highlightTick,
  onHighlight,
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
  // Шошгын ✕: тодруулга, ойролцоох зогсоолуудыг арилгана — газрын зургийг саадгүй харна.
  const clearHighlight = useCallback(() => onHighlight(null), [onHighlight]);
  // Popup нээлттэй газар — тодруулсан газрынх бол шошгыг нууна (popup тэр мэдээллийг агуулна, давхцахгүй).
  const [popupSpotId, setPopupSpotId] = useState<number | null>(null);
  // Popup-ийн "ойролцоох зогсоол" мөр — нээгдэх үед л тоолбол popup-ийн хэмжээ өөрчлөгдөж үсэрнэ.
  const parkingCounts = useMemo(
    () => Object.fromEntries(spots.map((spot) => [spot.id, parkingNear(spot, paidParkingLocations).length])),
    [spots]
  );
  // Хамгийн сүүлд картад заасан (утсанд: голд байсан) газраас 1 км доторх зогсоолууд — өөр картад заах хүртэл харагдана.
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
        <HighlightController spot={highlightedSpot} tick={highlightTick} />
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
              <span className="font-sans text-[13px] font-semibold text-ink">{t.youAreHere}</span>
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
            <Tooltip direction="top" offset={[0, -12]} opacity={1} className="font-sans">
              {parking.name}
              <span className="font-normal text-ink-muted tabular-nums">
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
              eventHandlers={{
                // Тэмдэг дарахад popup нээгдэхийн зэрэгцээ тэр газар тодорч, ойролцоох зогсоолууд гарна.
                popupopen: () => {
                  setPopupSpotId(spot.id);
                  onHighlight(spot);
                },
                popupclose: () => setPopupSpotId((current) => (current === spot.id ? null : current)),
              }}
            >
              {highlighted && popupSpotId !== spot.id ? (
                // Тэмдэг дарахад гардаг popup-тай нэг загвар (globals.css): харанхуй хуудас, ижил бичвэрийн хэмжээ.
                <Tooltip permanent direction="top" offset={[0, -18]} opacity={1} className="font-sans">
                  <div className="flex items-start gap-2">
                    <div>
                      <div className="text-[13px] sm:text-[15px] font-semibold leading-tight">{spot.name}</div>
                      <div className="mt-1 flex items-center gap-1.5 font-normal text-ink-muted tabular-nums">
                        <SquareParking aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                        {nearbyParking.length > 0
                          ? t.parkingNearSpot(nearbyParking.length, SPOT_PARKING_RADIUS_KM)
                          : t.parkingNoneNearSpot(SPOT_PARKING_RADIUS_KM)}
                      </div>
                    </div>
                    <LabelCloseButton label={t.close} onClose={clearHighlight} />
                  </div>
                </Tooltip>
              ) : null}
              <Popup>
                {/* Утсан дээр нягт: жижиг бичвэр, хаяг нэг мөрөнд (globals.css popup-ийн өргөн, захыг багасгана). */}
                <div className="font-sans min-w-40 sm:min-w-48 space-y-1.5 sm:space-y-2 text-xs sm:text-[13px] text-ink">
                  <div className="text-[13px] sm:text-[15px] font-semibold leading-tight">{spot.name}</div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <div className="flex gap-1.5 min-w-0">
                      <MapPin aria-hidden="true" className="h-3.5 w-3.5 mt-0.5 shrink-0 text-ink-muted" strokeWidth={2} />
                      <span className="min-w-0 max-sm:truncate">{spot.location}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <Clock aria-hidden="true" className="h-3.5 w-3.5 mt-0.5 shrink-0 text-ink-muted" strokeWidth={2} />
                      {spot.hours}
                    </div>
                    {busy && busyInfo && now !== null ? (
                      <div className="flex gap-1.5">
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 mt-1 mx-0.5 shrink-0 rounded-full"
                          style={{ backgroundColor: busyInfo.color }}
                        />
                        <span>
                          <span className="font-semibold">{busyInfo.label[locale]}</span>{" "}
                          <span className="text-ink-muted">
                            · {t.busynessDetail(busy.count, Math.max(0, Math.round((now - Date.parse(busy.latestAt)) / 60_000)))}
                          </span>
                        </span>
                      </div>
                    ) : null}
                    <div className="flex gap-1.5 text-ink-muted tabular-nums">
                      <SquareParking aria-hidden="true" className="h-3.5 w-3.5 mt-0.5 shrink-0" strokeWidth={2} />
                      {parkingCounts[spot.id] > 0
                        ? t.parkingNearSpot(parkingCounts[spot.id], SPOT_PARKING_RADIUS_KM)
                        : t.parkingNoneNearSpot(SPOT_PARKING_RADIUS_KM)}
                    </div>
                    {dimmed ? <div className="text-ink-muted">{t.outsideDistance}</div> : null}
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-line pt-1.5 sm:pt-2 font-semibold">
                    <a
                      href={googleMapsUrl(spot)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      <GoogleMapsIcon className="h-3.5 w-3.5" />
                      Google Maps
                    </a>
                    <button
                      type="button"
                      onClick={() => onOpenDetails(spot)}
                      className="px-2 sm:px-2.5 py-1 rounded-md bg-azure hover:bg-azure-deep text-white transition-colors"
                    >
                      {t.details}
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
