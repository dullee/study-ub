"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { StudySpot, AVAILABLE_TAGS, RatingSummary, Review, summarizeRatings } from "@/types";
import { initialSpots } from "@/data/initialSpots";
import SpotCard from "@/components/SpotCard";
import FilterSection from "@/components/FilterSection";
import AddSpotModal from "@/components/AddSpotModal";
import Header from "@/components/Header";
import SpotDetailDialog from "@/components/SpotDetailDialog";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchReviewRatings, fetchSpots, insertSpot } from "@/lib/supabase/spots";
import { loadLocalReviews, loadLocalSpots, saveLocalSpots } from "@/lib/localStore";

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
  // null — ачаалж байна.
  const [ratings, setRatings] = useState<Record<number, RatingSummary> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadRatings() {
      const remote = isSupabaseConfigured ? await fetchReviewRatings() : null;
      if (!cancelled) setRatings(summarizeRatings(remote ?? loadLocalReviews()));
    }
    loadRatings();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleReviewAdded = useCallback((review: Review) => {
    setRatings((prev) => {
      const current = prev?.[review.spot_id] ?? { average: 0, count: 0 };
      const count = current.count + 1;
      return {
        ...prev,
        [review.spot_id]: { average: (current.average * current.count + review.rating) / count, count },
      };
    });
  }, []);
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

  const filteredSpots = useMemo(() => {
    return spots.filter((spot) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        spot.name.toLowerCase().includes(q) || spot.location.toLowerCase().includes(q);
      const matchesTags =
        activeTags.includes("Бүгд") || activeTags.every((t) => spot.tags.includes(t));
      return matchesSearch && matchesTags;
    });
  }, [spots, searchQuery, activeTags]);

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
        <Map spots={filteredSpots} focusCoords={focusCoords} onOpenDetails={setDetailSpot} />
        <FilterSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          availableTags={[...AVAILABLE_TAGS]}
          activeTags={activeTags}
          toggleTag={toggleTag}
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
                  rating={ratings ? ratings[spot.id] : null}
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
