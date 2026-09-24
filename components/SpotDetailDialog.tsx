"use client";

import { useEffect, useState } from "react";
import {
  ACCESSIBILITY,
  ACCESSIBILITY_GROUPS,
  AMENITIES,
  googleMapsUrl,
  PLACEHOLDER_IMAGE,
  Review,
  spotCategory,
  StudySpot,
  TAG_INFO,
} from "@/types";
import { fetchReviews } from "@/lib/supabase/spots";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { reviewsForSpot } from "@/lib/localStore";
import Stars from "@/components/Stars";
import { openStatus, STATUS_TONE, useNow } from "@/lib/openHours";
import { formatOutlets, formatQuiet, formatWifi, summarizeSpot } from "@/lib/scores";
import ReviewsDialog, { ReviewItem } from "@/components/ReviewsDialog";

interface SpotDetailDialogProps {
  spot: StudySpot;
  onClose: () => void;
  onShowOnMap: (lat: number, lng: number) => void;
  onReviewAdded?: (review: Review) => void;
}

export default function SpotDetailDialog({
  spot,
  onClose,
  onShowOnMap,
  onReviewAdded,
}: SpotDetailDialogProps) {
  const now = useNow();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsOpen, setReviewsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (isSupabaseConfigured) {
        const remote = await fetchReviews(spot.id);
        if (!cancelled && remote) {
          setReviews(remote);
          setLoading(false);
          return;
        }
      }
      if (cancelled) return;
      setReviews(reviewsForSpot(spot.id));
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [spot.id]);

  // Esc: сэтгэгдлийн цонх нээлттэй бол түүнийг, эс бөгөөс газрын цонхыг хаана. Ард талын хуудас гүйлгэгдэхгүй.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (reviewsOpen) setReviewsOpen(false);
      else onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, reviewsOpen]);

  const average =
    reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  const status = now === null ? null : openStatus(spot, now);
  const category = spotCategory(spot.category);
  const accessibility = ACCESSIBILITY_GROUPS.map((group) => ({
    ...group,
    items: ACCESSIBILITY.filter(
      (item) => item.group === group.key && spot.accessibility?.includes(item.key)
    ),
  })).filter((group) => group.items.length > 0);

  // Шошго, төрөл, үйлчилгээг нэг жагсаалтын оронд бүлгээр нь харуулна.
  const tagChips = (group: string) =>
    spot.tags
      .filter((tag) => (TAG_INFO[tag]?.group ?? "other") === group)
      .map((tag) => ({ key: `tag:${tag}`, icon: TAG_INFO[tag]?.icon ?? "🏷️", label: tag }));
  const featureGroups = [
    {
      key: "type",
      title: "Төрөл",
      chips: [
        ...(category ? [{ key: `category:${category.key}`, icon: category.icon, label: category.label }] : []),
        ...tagChips("type").filter((chip) => chip.label.toLowerCase() !== category?.label.toLowerCase()),
      ],
    },
    { key: "environment", title: "Орчин", chips: tagChips("environment") },
    {
      key: "amenities",
      title: "Үйлчилгээ",
      chips: [
        ...tagChips("amenities"),
        ...AMENITIES.filter((amenity) => spot.amenities?.includes(amenity.key)),
      ],
    },
    { key: "other", title: "Бусад", chips: tagChips("other") },
  ].filter((group) => group.chips.length > 0);

  // Газар нэмэгчийн утга + сэтгэгдлүүдийн утгаас нэгтгэсэн оноо.
  const summary = summarizeSpot(spot, reviews);
  const votes = (count: number) => `${count} үнэлгээнээс`;
  const facts: { icon: string; label: string; value?: string; note?: string }[] = [
    { icon: "📍", label: "Байршил", value: spot.location },
    { icon: "⏰", label: "Цагийн хуваарь (өдөр бүр)", value: status ? status.schedule : spot.hours },
    {
      icon: "⚡",
      label: "Wi-Fi (медиан)",
      value: summary.wifi && formatWifi(summary.wifi),
      note: summary.wifi && votes(summary.wifi.count),
    },
    {
      icon: "🤫",
      label: "Чимээгүй байдал",
      value: summary.quiet && formatQuiet(summary.quiet),
      note: summary.quiet && votes(summary.quiet.count),
    },
    {
      icon: "🔌",
      label: "Розетка",
      value: summary.outlets && formatOutlets(summary.outlets),
      note: summary.outlets && votes(summary.outlets.count),
    },
  ].filter((fact) => fact.value);

  const handleReviewAdded = (review: Review) => {
    setReviews((prev) => [review, ...prev]);
    onReviewAdded?.(review);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[1100] flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="spot-dialog-title"
        className="relative bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          type="button"
          aria-label="Хаах"
          className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-slate-900/80 backdrop-blur text-slate-200 hover:text-white border border-slate-700"
        >
          ✕
        </button>

        <div className="relative h-56 sm:h-72 w-full bg-slate-950">
          <img src={spot.image || PLACEHOLDER_IMAGE} alt={spot.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            {category ? (
              <span className="inline-block mb-2 text-xs font-semibold bg-slate-900/80 backdrop-blur text-indigo-300 border border-slate-700 px-2.5 py-1 rounded-lg">
                {category.icon} {category.label}
              </span>
            ) : null}
            <h2 id="spot-dialog-title" className="text-2xl sm:text-3xl font-bold text-white">
              {spot.name}
            </h2>
            <div className="text-sm text-slate-300 mt-1 flex items-center gap-2 min-h-5">
              {loading ? (
                <span className="h-3.5 w-32 rounded bg-slate-700/80 animate-pulse" aria-hidden="true" />
              ) : reviews.length > 0 ? (
                <>
                  <Stars value={average} />
                  <span>
                    {average.toFixed(1)} · {reviews.length} сэтгэгдэл
                  </span>
                </>
              ) : (
                <span className="text-slate-400">Одоогоор үнэлгээ алга</span>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {spot.description ? (
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{spot.description}</p>
          ) : null}
          {status ? (
            <p className={`text-sm font-semibold ${STATUS_TONE[status.tone]}`}>● {status.detail}</p>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {facts.map((fact) => (
              <div key={fact.label} className="bg-slate-800/50 border border-slate-700/60 rounded-xl px-4 py-3">
                <p className="text-[11px] text-slate-400">
                  {fact.icon} {fact.label}
                </p>
                <p className="text-sm text-white font-medium mt-0.5">{fact.value}</p>
                {fact.note ? <p className="text-[11px] text-slate-500 mt-0.5">{fact.note}</p> : null}
              </div>
            ))}
          </div>

          {featureGroups.length > 0 || accessibility.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {featureGroups.map((group) => (
                <section key={group.key} className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-400">{group.title}</h3>
                  <ChipList chips={group.chips} />
                </section>
              ))}
              {accessibility.length > 0 ? (
                <section className="space-y-2 md:col-span-2">
                  <h3 className="text-xs font-semibold text-slate-400">Хүртээмж</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {accessibility.map((group) => (
                      <div key={group.key} className="space-y-1.5">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">{group.label}</p>
                        <ChipList chips={group.items} />
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}

          <section className="space-y-3 border-t border-slate-800 pt-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-200">
                💬 Сэтгэгдэл {loading ? "" : `(${reviews.length})`}
              </h3>
              <button
                type="button"
                onClick={() => setReviewsOpen(true)}
                className="text-xs font-semibold text-indigo-300 hover:text-white"
              >
                {reviews.length > 0 ? "Бүгдийг харах, бичих →" : "Сэтгэгдэл бичих →"}
              </button>
            </div>
            {loading ? (
              <div className="h-16 rounded-xl bg-slate-800/40 animate-pulse" aria-hidden="true" />
            ) : reviews.length === 0 ? (
              <p className="text-xs text-slate-500">Одоогоор сэтгэгдэл алга. Анхны сэтгэгдлийг та үлдээгээрэй!</p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {reviews.slice(0, 2).map((review) => (
                  <ReviewItem key={review.id} review={review} clamp />
                ))}
              </ul>
            )}
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onShowOnMap(spot.lat, spot.lng);
                onClose();
              }}
              className="py-2.5 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-sm font-semibold rounded-xl border border-slate-700 hover:border-indigo-500 transition-all"
            >
              Карт дээр 🎯
            </button>
            <a
              href={googleMapsUrl(spot)}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl text-center transition-all"
            >
              Google Maps ↗
            </a>
          </div>
        </div>
      </div>

      {reviewsOpen ? (
        <ReviewsDialog
          spot={spot}
          reviews={reviews}
          loading={loading}
          onReviewAdded={handleReviewAdded}
          onClose={() => setReviewsOpen(false)}
        />
      ) : null}
    </div>
  );
}

function ChipList({ chips }: { chips: readonly { key: string; icon: string; label: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <li
          key={chip.key}
          className="flex items-center gap-1.5 text-xs text-slate-200 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg"
        >
          <span aria-hidden="true">{chip.icon}</span>
          {chip.label}
        </li>
      ))}
    </ul>
  );
}
