"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { StudySpot, AVAILABLE_TAGS, Review } from "@/types";
import { initialSpots } from "@/data/initialSpots";
import SpotCard from "@/components/SpotCard";
import FilterSection from "@/components/FilterSection";
import AddSpotModal from "@/components/AddSpotModal";
import Header from "@/components/Header";
import SpotDetailDialog from "@/components/SpotDetailDialog";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchReviewScores, fetchSpots, insertSpot } from "@/lib/supabase/spots";
import { ReviewScores, summarizeSpots } from "@/lib/scores";
import { loadLocalReviews, loadLocalSpots, saveLocalSpots } from "@/lib/localStore";
import { sortByActiveTags } from "@/lib/spotSort";
import { distanceKm, useUserLocation } from "@/lib/geo";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="h-[350px] w-full rounded-2xl border border-slate-800 bg-slate-800/40 animate-pulse" />
  ),
});

function isPublic(spot: StudySpot) {
  return !spot.status || spot.status === "approved";
}

export default function Home() {
  const [spots, setSpots] = useState<StudySpot[]>(initialSpots);
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
    setReviewScores((prev) => [...(prev ?? []), review]);
  }, []);

  // Газар нэмэгчийн утга + сэтгэгдлүүдээс нэгтгэсэн оноо — карт, эрэмбэлэлтэд.
  const summaries = useMemo(
    () => summarizeSpots(spots, reviewScores ?? []),
    [spots, reviewScores]
  );
  const [usingRemote, setUsingRemote] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (isSupabaseConfigured) {
        const remote = await fetchSpots();
        if (!cancelled && remote) {
          // Хүснэгт хоосон ч шинэ газрыг Supabase руу илгээнэ; харуулахдаа анхны газруудыг ашиглана.
          if (remote.length > 0) setSpots(remote);
          setUsingRemote(true);
          return;
        }
      }
      const local = loadLocalSpots().filter(isPublic);
      if (!cancelled && local.length > 0) setSpots(local);
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
        setNotice("Хүсэлт илгээгдлээ. Админ зөвшөөрсний дараа газрын зурагт гарна.");
        return;
      }
    }
    const newSpot: StudySpot = { ...pending, id: Date.now() };
    saveLocalSpots([newSpot, ...loadLocalSpots()]);
    setNotice("Хүсэлт илгээгдлээ. Админ зөвшөөрсний дараа газрын зурагт гарна.");
  };

  const handleFocus = (lat: number, lng: number) => {
    setFocusCoords([lat, lng]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen font-sans pb-12">
      <Header onAddClick={() => setIsModalOpen(true)} />
      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        {notice ? (
          <p className="text-sm text-indigo-200 bg-indigo-950/60 border border-indigo-800/50 rounded-xl px-4 py-3">
            {notice}
          </p>
        ) : null}
        <Map
          spots={matchingSpots}
          dimmedIds={outOfRangeIds}
          focusCoords={focusCoords}
          onOpenDetails={setDetailSpot}
          userCoords={userCoords}
          radiusKm={maxDistanceKm}
        />
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
        <section className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              📍 Сонгогдсон газрууд
            </h2>
            <span className="text-xs text-indigo-400 font-mono bg-indigo-950/60 border border-indigo-800/50 px-2.5 py-1 rounded-md">
              {filteredSpots.length} газар
            </span>
          </div>
          {filteredSpots.length === 0 ? (
            <p className="text-center text-slate-500 py-12 text-sm">Шүүлтүүрт тохирох газар олдсонгүй.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
