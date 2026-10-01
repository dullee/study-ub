"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useI18n } from "@/components/LanguageProvider";
import { initialSpots } from "@/data/initialSpots";
import { PARKING_SOURCE_URL, paidParkingLocations } from "@/data/paidParking";
import { distanceKm, formatDistance, LatLng } from "@/lib/geo";
import { loadLocalSpots } from "@/lib/localStore";
import {
  DEFAULT_PARKING_RADIUS_KM,
  destinationFromSpot,
  hasVerifiedCoordinates,
  PARKING_RADIUS_OPTIONS,
  parkingNeedsVerification,
  ParkingDestination,
  PlaceSearchResult,
} from "@/lib/parking";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchPaidParking } from "@/lib/supabase/parking";
import { fetchSpots } from "@/lib/supabase/spots";
import { googleMapsDirectionsUrl, googleMapsUrl, PaidParking, StudySpot } from "@/types";

const ParkingMap = dynamic(() => import("@/components/ParkingMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-2xl border border-slate-800 bg-slate-800/40 animate-pulse" />
  ),
});

function isPublic(spot: StudySpot) {
  return !spot.status || spot.status === "approved";
}

const chipClass = (active: boolean) =>
  `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
    active
      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
  }`;

export default function ParkingPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [spots, setSpots] = useState<StudySpot[]>([]);
  const [spotsReady, setSpotsReady] = useState(false);
  const [parkings, setParkings] = useState<PaidParking[] | null>(null);
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<PlaceSearchResult[]>([]);
  const [placeStatus, setPlaceStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [destination, setDestination] = useState<ParkingDestination | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_PARKING_RADIUS_KM);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const parkingPromise = (async () => {
        if (!isSupabaseConfigured) return paidParkingLocations;
        const remote = await fetchPaidParking();
        // Хоосон хүснэгт эхний 28 байршлыг далдална. Мөр орсон үед л санг ашиглана.
        return remote && remote.length > 0 ? remote : paidParkingLocations;
      })();
      const spotsPromise = (async () => {
        if (isSupabaseConfigured) {
          const remote = await fetchSpots();
          if (remote) return remote.filter(isPublic);
        }
        const local = loadLocalSpots().filter(isPublic);
        return local.length > 0 ? local : initialSpots;
      })();
      const [nextParkings, nextSpots] = await Promise.all([parkingPromise, spotsPromise]);
      if (cancelled) return;
      setParkings(nextParkings);
      setSpots(nextSpots);
      setSpotsReady(true);
      const params = new URLSearchParams(window.location.search);
      const linked = Number(params.get("spot"));
      if (Number.isFinite(linked)) {
        const spot = nextSpots.find((item) => item.id === linked);
        if (spot) {
          setDestination(destinationFromSpot(spot));
          return;
        }
      }
      const latParam = params.get("lat");
      const lngParam = params.get("lng");
      const lat = Number(latParam);
      const lng = Number(lngParam);
      if (
        latParam &&
        lngParam &&
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180
      ) {
        setDestination({
          name: params.get("name") ?? "",
          location: params.get("addr") ?? "",
          lat,
          lng,
        });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen]);

  const submitIntent = useRef(false);
  const resultQuery = useRef("");

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setPlaces([]);
      setPlaceStatus("idle");
      resultQuery.current = "";
      submitIntent.current = false;
      return;
    }
    setPlaces([]);
    setPlaceStatus("loading");
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("search-failed");
        const data = (await res.json()) as { results?: PlaceSearchResult[] };
        if (controller.signal.aborted) return;
        const next = Array.isArray(data.results) ? data.results : [];
        resultQuery.current = q;
        setPlaces(next);
        setPlaceStatus("ready");
        if (submitIntent.current) {
          submitIntent.current = false;
          const exact = next.filter((place) => place.exact);
          if (exact.length === 1) selectPlaceRef.current(exact[0]);
        }
      } catch (error) {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) return;
        resultQuery.current = q;
        setPlaces([]);
        setPlaceStatus("error");
        submitIntent.current = false;
      }
    }, 400);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const placeQuery = query.trim().toLowerCase();
  const placeMatches = useMemo(() => {
    return spots.filter((spot) => {
      if (!placeQuery) return true;
      return (
        spot.name.toLowerCase().includes(placeQuery) || spot.location.toLowerCase().includes(placeQuery)
      );
    });
  }, [spots, placeQuery]);

  const located = useMemo(
    () => (parkings ?? []).filter(hasVerifiedCoordinates),
    [parkings]
  );

  const ranked = useMemo(() => {
    if (!destination) {
      return located.map((parking) => ({ parking, km: null as number | null }));
    }
    return located
      .map((parking) => ({ parking, km: distanceKm(destination, parking) }))
      .filter((item) => item.km <= radiusKm)
      .sort((a, b) => a.km - b.km);
  }, [located, destination, radiusKm]);

  useEffect(() => {
    if (selectedId && !ranked.some((item) => item.parking.id === selectedId)) {
      setSelectedId(null);
    }
  }, [ranked, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    document.getElementById(`parking-${selectedId}`)?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  const selectDestination = (spot: StudySpot) => {
    setDestination(destinationFromSpot(spot));
    setSelectedId(null);
    setQuery("");
    // Next-ийн router URL-ийг эзэмшинэ — хэл солиход ?spot= устахгүй.
    router.replace(`/parking?spot=${spot.id}`, { scroll: false });
  };

  const selectPlace = (place: PlaceSearchResult) => {
    setDestination({ name: place.name, location: place.address, lat: place.lat, lng: place.lng });
    setSelectedId(null);
    setQuery("");
    const params = new URLSearchParams({
      lat: String(place.lat),
      lng: String(place.lng),
      name: place.name,
      addr: place.address,
    });
    router.replace(`/parking?${params.toString()}`, { scroll: false });
  };
  const selectPlaceRef = useRef(selectPlace);
  selectPlaceRef.current = selectPlace;

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (resultQuery.current !== q) {
      submitIntent.current = true;
      return;
    }
    const exact = places.filter((place) => place.exact);
    if (exact.length === 1) selectPlace(exact[0]);
  };

  const pickOnMap = (point: LatLng) => {
    const name = query.trim() || t.parkingChosenOnMap;
    setDestination({ name, location: "", lat: point.lat, lng: point.lng });
    setSelectedId(null);
    setQuery("");
    const params = new URLSearchParams({
      lat: String(point.lat),
      lng: String(point.lng),
      name,
    });
    router.replace(`/parking?${params.toString()}`, { scroll: false });
  };

  const clearDestination = () => {
    setDestination(null);
    setSelectedId(null);
    router.replace("/parking", { scroll: false });
  };

  const destinationName = destination?.name ?? "";
  const mapPick =
    !destination &&
    query.trim().length >= 2 &&
    places.length === 0 &&
    (placeStatus === "ready" || placeStatus === "error");
  const mapDestination = destination
    ? { name: destinationName, lat: destination.lat, lng: destination.lng }
    : null;

  const visibleParkings = ranked.map((item) => item.parking);
  const hasParkingData = (parkings?.length ?? 0) > 0;
  const show = (value: string | null | undefined) => (value?.trim() ? value : t.parkingUnavailable);

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen font-sans pb-12">
      <Header onAddClick={() => router.push("/?add=1")} />
      <main className="max-w-7xl mx-auto px-4 pt-2 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr] gap-3 lg:gap-4 items-start">
          <section className="order-2 lg:order-1 space-y-3 lg:sticky lg:top-[calc(var(--header-h,120px)+1rem)] lg:max-h-[calc(100dvh-var(--header-h,120px)-2rem)] lg:overflow-y-auto lg:pr-1">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span aria-hidden="true">🅿️</span>
                {t.parkingTitle}
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t.parkingIntro}</p>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                {t.parkingAttribution}{" "}
                <a
                  href={PARKING_SOURCE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-300 hover:text-white font-semibold"
                >
                  easy-parking.mn/locations
                </a>
              </p>
            </div>

            {destination ? (
              <div className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3 py-2.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-indigo-300">{t.parkingDestination}</p>
                  <p className="text-sm font-semibold text-white truncate">{destinationName}</p>
                  {destination.location ? (
                    <p className="text-xs text-slate-400 truncate">{destination.location}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={clearDestination}
                  className="shrink-0 text-xs font-semibold text-indigo-200 hover:text-white"
                >
                  {t.parkingChangePlace}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">{t.parkingPickPlace}</p>
                <form className="relative" onSubmit={submitSearch}>
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t.parkingSearchPlaceholder}
                    aria-label={t.parkingSearchPlaceholder}
                    className="w-full h-10 bg-slate-800 border border-slate-700 text-white placeholder-slate-400 pl-10 pr-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm" aria-hidden="true">
                    🔍
                  </span>
                </form>
                <ul className="max-h-56 overflow-y-auto rounded-xl border border-slate-800 divide-y divide-slate-800">
                  {!spotsReady ? (
                    <li className="px-3 py-3 text-xs text-slate-500" aria-busy="true">
                      {t.loading}
                    </li>
                  ) : (
                    <>
                      {placeMatches.length > 0 ? (
                        <li className="px-3 py-1.5 text-[10px] uppercase tracking-wide text-slate-500 bg-slate-900">
                          {t.parkingStudyPlaces}
                        </li>
                      ) : null}
                      {placeMatches.map((spot) => (
                        <li key={spot.id}>
                          <button
                            type="button"
                            onClick={() => selectDestination(spot)}
                            className="w-full text-left px-3 py-2.5 hover:bg-slate-800/80"
                          >
                            <span className="block text-sm font-semibold text-white">{spot.name}</span>
                            <span className="block text-xs text-slate-400">{spot.location}</span>
                          </button>
                        </li>
                      ))}
                      {placeQuery.length >= 2 && placeStatus === "loading" ? (
                        <li className="px-3 py-3 text-xs text-slate-500" aria-busy="true">
                          {t.parkingSearching}
                        </li>
                      ) : null}
                      {places.length > 0 ? (
                        <li className="px-3 py-1.5 text-[10px] uppercase tracking-wide text-slate-500 bg-slate-900">
                          {t.parkingAddressResults}
                        </li>
                      ) : null}
                      {places.map((place) => (
                        <li key={`${place.lat},${place.lng},${place.name}`}>
                          <button
                            type="button"
                            onClick={() => selectPlace(place)}
                            className="w-full text-left px-3 py-2.5 hover:bg-slate-800/80"
                          >
                            <span className="block text-sm font-semibold text-white">{place.name}</span>
                            <span className="block text-xs text-slate-400">{place.address}</span>
                          </button>
                        </li>
                      ))}
                      {placeMatches.length === 0 && places.length === 0 && placeStatus !== "loading" ? (
                        <li className="px-3 py-3 text-xs text-slate-500">
                          {placeStatus === "error"
                            ? t.parkingSearchFailed
                            : mapPick
                              ? t.parkingPickOnMap
                              : t.parkingNoPlaceMatch}
                        </li>
                      ) : null}
                    </>
                  )}
                </ul>
              </div>
            )}

            {destination ? (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-400">{t.parkingRadius}</p>
                <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t.parkingRadius}>
                  {PARKING_RADIUS_OPTIONS.map((km) => (
                    <button
                      key={km}
                      type="button"
                      role="radio"
                      aria-checked={radiusKm === km}
                      onClick={() => setRadiusKm(km)}
                      className={chipClass(radiusKm === km)}
                    >
                      {t.withinKm(km)}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-2" aria-live="polite">
              {parkings === null ? (
                <div className="h-24 rounded-xl border border-slate-800 bg-slate-800/40 animate-pulse" aria-busy="true" />
              ) : !hasParkingData ? (
                <p className="text-sm text-slate-400 leading-relaxed rounded-xl border border-dashed border-slate-700 px-3 py-4">
                  {t.parkingEmpty}
                </p>
              ) : (
                <>
                  <p className="text-xs text-slate-400">
                    {destination ? (
                      ranked.length === 0 ? (
                        t.parkingNoneInRadius(radiusKm)
                      ) : (
                        <>
                          {t.parkingNearbyCount(ranked.length)}
                          <span className="text-slate-500"> · {t.parkingSorted}</span>
                        </>
                      )
                    ) : (
                      t.parkingAllNote
                    )}
                  </p>
                  <ul className="space-y-2">
                    {ranked.map(({ parking, km }) => {
                      const selected = parking.id === selectedId;
                      const needsCheck = parkingNeedsVerification(parking);
                      const directions =
                        mapDestination && hasVerifiedCoordinates(parking)
                          ? googleMapsDirectionsUrl(mapDestination, parking)
                          : googleMapsUrl(parking);
                      return (
                        <li key={parking.id} id={`parking-${parking.id}`}>
                          <article
                            className={`rounded-xl border px-3 py-2.5 ${
                              selected
                                ? "border-amber-400 bg-amber-500/10"
                                : "border-slate-800 bg-slate-800/40"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedId(parking.id)}
                              className="w-full text-left"
                              aria-pressed={selected}
                            >
                              <span className="flex items-start justify-between gap-2">
                                <span className="text-sm font-semibold text-white">{parking.name}</span>
                                {km != null ? (
                                  <span className="shrink-0 text-xs font-semibold text-amber-200">
                                    {formatDistance(km, t)}
                                  </span>
                                ) : null}
                              </span>
                              {needsCheck ? (
                                <span className="mt-1 inline-flex rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                                  {t.parkingNeedsVerification}
                                </span>
                              ) : null}
                              <span className="block text-xs text-slate-400 mt-0.5">{show(parking.address)}</span>
                              <span className="block text-[11px] text-slate-500 mt-1">{t.parkingSpacesNote}</span>
                            </button>
                            {selected ? (
                              <dl className="mt-2 space-y-1 text-xs">
                                <div className="flex gap-2">
                                  <dt className="text-slate-500 shrink-0">{t.parkingDistrict}</dt>
                                  <dd className="text-slate-200">{show(parking.district)}</dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="text-slate-500 shrink-0">{t.factLocation}</dt>
                                  <dd className="text-slate-200">{show(parking.address)}</dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="text-slate-500 shrink-0">{t.parkingCapacity}</dt>
                                  <dd className="text-slate-200">
                                    {parking.capacity == null
                                      ? t.parkingUnavailable
                                      : t.parkingCapacityValue(parking.capacity)}
                                  </dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="text-slate-500 shrink-0">{t.parkingHourlyRate}</dt>
                                  <dd className="text-slate-200">
                                    {show(parking.hourlyRate)}
                                    {parking.hourlyRate ? (
                                      <span className="block text-[11px] text-slate-500">{t.parkingSourceNote}</span>
                                    ) : null}
                                  </dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="text-slate-500 shrink-0">{t.parkingHours}</dt>
                                  <dd className="text-slate-200">
                                    {show(parking.hours)}
                                    {parking.hours ? (
                                      <span className="block text-[11px] text-slate-500">{t.parkingSourceNote}</span>
                                    ) : null}
                                  </dd>
                                </div>
                                {km != null ? (
                                  <div className="flex gap-2">
                                    <dt className="text-slate-500 shrink-0">{t.distance}</dt>
                                    <dd className="text-slate-200">{formatDistance(km, t)}</dd>
                                  </div>
                                ) : null}
                                <div className="flex gap-2">
                                  <dt className="text-slate-500 shrink-0">{t.parkingSource}</dt>
                                  <dd>
                                    <a
                                      href={parking.sourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-indigo-300 hover:text-white font-semibold"
                                    >
                                      Easy Parking
                                    </a>
                                    <span className="block text-[11px] text-slate-500">
                                      {t.parkingVerifiedOn(parking.verifiedOn)}
                                    </span>
                                  </dd>
                                </div>
                                {directions ? (
                                  <div className="pt-1">
                                    <a
                                      href={directions}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex text-xs font-semibold text-indigo-300 hover:text-white"
                                    >
                                      {mapDestination ? t.parkingDirections : t.openInGoogleMaps}
                                    </a>
                                  </div>
                                ) : null}
                              </dl>
                            ) : null}
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          </section>

          <div
            className={
              fullscreen
                ? "fixed inset-0 z-[1100] h-[100dvh] w-full"
                : "order-1 lg:order-2 h-[42dvh] min-h-[240px] max-h-[380px] lg:max-h-none lg:min-h-0 lg:sticky lg:top-[calc(var(--header-h,120px)+1rem)] lg:h-[calc(100dvh-var(--header-h,120px)-2rem)]"
            }
          >
            <ParkingMap
              parkings={visibleParkings}
              destination={mapDestination}
              radiusKm={destination ? radiusKm : null}
              selectedId={selectedId}
              onSelect={setSelectedId}
              fullscreen={fullscreen}
              onToggleFullscreen={() => setFullscreen((value) => !value)}
              pickOnMap={mapPick}
              onMapPick={pickOnMap}
              pickHint={t.parkingPickOnMap}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
