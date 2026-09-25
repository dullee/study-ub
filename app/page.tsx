"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { StudySpot, AVAILABLE_TAGS, Review } from "@/types";
import { initialSpots } from "@/data/initialSpots";
import SpotCard from "@/components/SpotCard";
import FilterSection from "@/components/FilterSection";
import AddSpotModal from "@/components/AddSpotModal";
import Header from "@/components/Header";
import SpotDetailDialog from "@/components/SpotDetailDialog";
import { useUser } from "@clerk/nextjs";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchReviewScores, fetchSpots, insertSpot } from "@/lib/supabase/spots";
import { notifySubmissionsChanged } from "@/lib/useMySubmissions";
import { toast } from "sonner";
import { ReviewScores, summarizeSpots } from "@/lib/scores";
import { loadLocalReviews, loadLocalSpots, saveLocalSpots } from "@/lib/localStore";
import { sortByActiveTags } from "@/lib/spotSort";
import { distanceKm, useUserLocation } from "@/lib/geo";
import { useWideLayout } from "@/lib/useWideLayout";
import { useI18n } from "@/components/LanguageProvider";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-2xl border border-slate-800 bg-slate-800/40 animate-pulse" />
  ),
});

function isPublic(spot: StudySpot) {
  return !spot.status || spot.status === "approved";
}

export default function Home() {
  // Supabase холбогдсон бол жинхэнэ жагсаалт ирэх хүртэл хоосон (skeleton) — жишээ газрууд түр гарч солигдохгүй.
  const [spots, setSpots] = useState<StudySpot[]>(isSupabaseConfigured ? [] : initialSpots);
  const [spotsLoading, setSpotsLoading] = useState(isSupabaseConfigured);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>(["Бүгд"]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [focusCoords, setFocusCoords] = useState<[number, number] | null>(null);
  const [detailSpot, setDetailSpot] = useState<StudySpot | null>(null);
  const closeDetails = useCallback(() => setDetailSpot(null), []);
  // Бүх сэтгэгдлийн тоон утгууд (үнэлгээ, Wi-Fi, чимээгүй, розетка). null — ачаалж байна.
  const [reviewScores, setReviewScores] = useState<ReviewScores[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadScores() {
      const remote = isSupabaseConfigured ? await fetchReviewScores() : null;
      if (!cancelled) setReviewScores(remote ?? loadLocalReviews());
    }
    loadScores();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleReviewAdded = useCallback((review: Review) => {
    setReviewScores((prev) => [...(prev ?? []).filter((item) => item.id !== review.id), review]);
  }, []);

  // Газар нэмэгчийн утга + сэтгэгдлүүдээс нэгтгэсэн оноо — карт, эрэмбэлэлтэд.
  const summaries = useMemo(
    () => summarizeSpots(spots, reviewScores ?? []),
    [spots, reviewScores]
  );
  const [usingRemote, setUsingRemote] = useState(false);

  // Орон нутгийн горимд илгээсэн газрыг хэрэглэгчтэй холбоно (header-ийн "Миний илгээсэн").
  const { user } = useUser();
  const userId = user?.id ?? null;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (isSupabaseConfigured) {
        const remote = await fetchSpots();
        if (cancelled) return;
        if (remote) {
          setSpots(remote);
          setUsingRemote(true);
          setSpotsLoading(false);
          return;
        }
      }
      // Supabase тохируулаагүй эсвэл уншиж чадаагүй: энэ хөтчийн хадгалсан эсвэл жишээ газрууд.
      const local = loadLocalSpots().filter(isPublic);
      if (cancelled) return;
      setSpots(local.length > 0 ? local : initialSpots);
      setSpotsLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleTag = (tag: string) => {
    if (tag === "Бүгд") {
      setActiveTags(["Бүгд"]);
      return;
    }
    let updated = activeTags.filter((t) => t !== "Бүгд");
    if (updated.includes(tag)) {
      updated = updated.filter((t) => t !== tag);
      if (updated.length === 0) updated = ["Бүгд"];
    } else {
      updated = [...updated, tag];
    }
    setActiveTags(updated);
  };

  const { t } = useI18n();
  const [wide, setWide] = useWideLayout();
  const { location, locate, clear: clearLocation } = useUserLocation();
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | null>(null);
  const userCoords = location.status === "ready" ? location.coords : null;

  // Байршил мэдэгдэж байвал газар бүрийн зай (км).
  const distances = useMemo(() => {
    if (!userCoords) return null;
    return Object.fromEntries(spots.map((spot) => [spot.id, distanceKm(userCoords, spot)])) as Record<
      number,
      number
    >;
  }, [spots, userCoords]);

  const handleClearLocation = () => {
    clearLocation();
    setMaxDistanceKm(null);
  };

  // Хайлт, шошгоор шүүсэн газрууд — газрын зурагт зайнаас гадуурхыг нь бүдгэрүүлж харуулна.
  const matchingSpots = useMemo(() => {
    const matching = spots.filter((spot) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        spot.name.toLowerCase().includes(q) || spot.location.toLowerCase().includes(q);
      const matchesTags =
        activeTags.includes("Бүгд") || activeTags.every((t) => spot.tags.includes(t));
      return matchesSearch && matchesTags;
    });
    return sortByActiveTags(matching, activeTags, summaries, distances);
  }, [spots, searchQuery, activeTags, summaries, distances]);

  const outOfRangeIds = useMemo(() => {
    if (!distances || maxDistanceKm === null) return new Set<number>();
    return new Set(matchingSpots.filter((spot) => distances[spot.id] > maxDistanceKm).map((spot) => spot.id));
  }, [matchingSpots, distances, maxDistanceKm]);

  // Картын жагсаалт: зайн шүүлтүүрийг ч хэрэглэнэ.
  const filteredSpots = useMemo(
    () => matchingSpots.filter((spot) => !outOfRangeIds.has(spot.id)),
    [matchingSpots, outOfRangeIds]
  );

  const handleAddSpot = async (draft: Omit<StudySpot, "id">) => {
    const pending = { ...draft, status: "pending" as const };
    if (usingRemote) {
      const saved = await insertSpot(pending);
      if (saved) {
        toast.success(t.spotSubmitted);
        notifySubmissionsChanged();
        return;
      }
    }
    const newSpot: StudySpot = { ...pending, id: Date.now(), user_id: userId, created_at: new Date().toISOString() };
    saveLocalSpots([newSpot, ...loadLocalSpots()]);
    toast.success(t.spotSubmitted);
    notifySubmissionsChanged();
  };

  // Том дэлгэцэнд газрын зураг наалдсан тул харагдаж байгаа — зөвхөн утсан дээр түүн рүү гүйлгэнэ.
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  // Газрын зургийг бүтэн дэлгэцээр: ард талын хуудас гүйлгэгдэхгүй, Esc дарахад гарна
  // (газрын цонх нээлттэй бол Esc эхлээд цонхыг хаана).
  const [mapFullscreen, setMapFullscreen] = useState(false);
  useEffect(() => {
    if (!mapFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !detailSpot) setMapFullscreen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mapFullscreen, detailSpot]);

  const handleFocus = (lat: number, lng: number) => {
    setFocusCoords([lat, lng]);
    mapWrapperRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen font-sans pb-12">
      <Header onAddClick={() => setIsModalOpen(true)} wide={wide} />
      <main className={`${wide ? "max-w-none" : "max-w-7xl"} mx-auto px-4 pt-2 sm:pt-6 space-y-3 sm:space-y-6`}>
        <FilterSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          availableTags={[...AVAILABLE_TAGS]}
          activeTags={activeTags}
          toggleTag={toggleTag}
          location={location}
          onLocate={locate}
          onClearLocation={handleClearLocation}
          maxDistanceKm={maxDistanceKm}
          setMaxDistanceKm={setMaxDistanceKm}
        />
        {/* Том дэлгэцэнд: зүүн талд картууд нэг баганаар, баруун талд header + шүүлтүүрийн доор наалдсан том газрын зураг. Утсан дээр: зураг дээр, жагсаалт доор. */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,320px)_1fr] gap-3 lg:gap-0 items-start">
          <div
            ref={mapWrapperRef}
            className={
              mapFullscreen
                ? "fixed inset-0 z-[1100] h-[100dvh] w-full"
                : "order-1 lg:order-2 h-[42dvh] min-h-[240px] max-h-[380px] lg:max-h-none lg:min-h-0 lg:sticky lg:top-[calc(var(--header-h,120px)+var(--filters-h,64px)+1rem)] lg:h-[calc(100dvh-var(--header-h,120px)-var(--filters-h,64px)-2rem)] scroll-mt-[calc(var(--header-h,120px)+var(--filters-h,64px)+1rem)]"
            }
          >
            <Map
              spots={matchingSpots}
              dimmedIds={outOfRangeIds}
              focusCoords={focusCoords}
              onOpenDetails={setDetailSpot}
              userCoords={userCoords}
              radiusKm={maxDistanceKm}
              fullscreen={mapFullscreen}
              onToggleFullscreen={() => setMapFullscreen((value) => !value)}
            />
          </div>
          <section aria-label={t.placesHeading} className="order-2 lg:order-1 space-y-2">
            <div className="flex justify-between items-center gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center justify-between gap-1.5 w-full">
                <span className="text-xs whitespace-nowrap text-indigo-400 font-mono bg-indigo-950/60 border border-indigo-800/50 px-2 py-1 rounded-md">
                  {spotsLoading ? "…" : t.placesCount(filteredSpots.length)}
                </span>
                <button
                  type="button"
                  onClick={() => setWide(!wide)}
                  aria-pressed={wide}
                  title={wide ? t.wideOffTitle : t.wideOnTitle}
                  className={`hidden lg:inline-flex items-center gap-1 whitespace-nowrap text-xs px-2 py-1 rounded-md border transition-colors ${
                    wide
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  <span aria-hidden="true">{wide ? "⇥⇤" : "⇤⇥"}</span>
                  {wide ? t.wideOff : t.wideOn}
                </button>
              </div>
            </div>
            {spotsLoading ? (
              <div className="flex flex-col gap-1" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    aria-hidden="true"
                    className="min-h-60 rounded-2xl border border-slate-800 bg-slate-800/40 animate-pulse flex flex-col justify-end p-3 gap-2"
                  >
                    <div className="h-4 w-2/3 rounded bg-slate-700" />
                    <div className="h-3 w-1/3 rounded bg-slate-700/70" />
                    <div className="h-3 w-1/2 rounded bg-slate-800" />
                  </div>
                ))}
              </div>
            ) : filteredSpots.length === 0 ? (
              <p className="text-center text-slate-500 py-12 text-sm">{t.noResults}</p>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredSpots.map((spot) => (
                  <SpotCard
                    key={spot.id}
                    spot={spot}
                    onFocus={handleFocus}
                    onOpenDetails={setDetailSpot}
                    summary={summaries[spot.id]}
                    ratingsLoading={reviewScores === null}
                    distanceKm={distances?.[spot.id]}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <AddSpotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddSpot={handleAddSpot}
      />
      {detailSpot ? (
        <SpotDetailDialog
          spot={detailSpot}
          onClose={closeDetails}
          onShowOnMap={handleFocus}
          onReviewAdded={handleReviewAdded}
        />
      ) : null}
    </div>
  );
}
