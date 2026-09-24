"use client";

import { FormEvent, useEffect, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import {
  ACCESSIBILITY,
  ACCESSIBILITY_GROUPS,
  AMENITIES,
  displayName,
  googleMapsUrl,
  PLACEHOLDER_IMAGE,
  Review,
  spotCategory,
  StudySpot,
  TAG_INFO,
} from "@/types";
import { fetchReviews, insertReview } from "@/lib/supabase/spots";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { reviewsForSpot, saveLocalReview } from "@/lib/localStore";
import Stars from "@/components/Stars";
import { openStatus, STATUS_TONE, useNow } from "@/lib/openHours";
import { formatOutlets, formatQuiet, formatWifi, summarizeSpot } from "@/lib/scores";
import ScoreFields, { ScoreValues } from "@/components/ScoreFields";
import ReviewScoreLine from "@/components/ReviewScoreLine";

interface SpotDetailDialogProps {
  spot: StudySpot;
  onClose: () => void;
  onShowOnMap: (lat: number, lng: number) => void;
  onReviewAdded?: (review: Review) => void;
}

const inputClass =
  "w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500";

function ReviewSkeleton() {
  return (
    <li className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-2.5 animate-pulse" aria-hidden="true">
      <div className="flex justify-between">
        <div className="h-3.5 w-28 rounded bg-slate-700" />
        <div className="h-3 w-16 rounded bg-slate-800" />
      </div>
      <div className="h-3 w-20 rounded bg-slate-700/70" />
      <div className="h-3 w-full rounded bg-slate-800" />
      <div className="h-3 w-2/3 rounded bg-slate-800" />
    </li>
  );
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
  const [comment, setComment] = useState("");
  const [scores, setScores] = useState<ScoreValues>({});
  const [rating, setRating] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { user, isLoaded } = useUser();

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

  // Esc дарахад хаагдаж, ард талын хуудас гүйлгэгдэхгүй.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    const draft = {
      spot_id: spot.id,
      comment,
      rating,
      wifi_mbps: scores.wifi_mbps ?? null,
      quiet_rating: scores.quiet_rating ?? null,
      outlet_rating: scores.outlet_rating ?? null,
      user_id: user.id,
      author_name: displayName(user),
    };
    let saved: Review | null;
    if (isSupabaseConfigured) {
      saved = await insertReview(draft);
      if (!saved) {
        setError("Сэтгэгдэл хадгалагдсангүй. Дахин оролдоно уу.");
        setSaving(false);
        return;
      }
    } else {
      saved = { ...draft, id: Date.now(), created_at: new Date().toISOString() };
      saveLocalReview(saved);
    }
    const added = saved;
    setReviews((prev) => [added, ...prev]);
    onReviewAdded?.(added);
    setComment("");
    setScores({});
    setRating(5);
    setSaving(false);
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
        className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto md:overflow-hidden md:h-[min(88vh,780px)] flex flex-col md:flex-row"
      >
        {/* Зүүн тал (утсан дээр доор): сэтгэгдэл */}
        <section
          aria-label="Сэтгэгдэл"
          className="order-2 md:order-1 md:w-[55%] md:overflow-y-auto p-5 sm:p-6 space-y-4 border-t md:border-t-0 md:border-r border-slate-800"
        >
          <h3 className="text-sm font-semibold text-slate-200">
            💬 Сэтгэгдэл {loading ? "" : `(${reviews.length})`}
          </h3>
          {!isLoaded ? null : !user ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center space-y-2 text-xs">
              <p className="text-slate-400">Сэтгэгдэл бичихийн тулд нэвтэрнэ үү.</p>
              <SignInButton mode="modal">
                <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-semibold">
                  Нэвтрэх
                </button>
              </SignInButton>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-3 text-xs bg-slate-800/30 border border-slate-800 rounded-xl p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1" role="radiogroup" aria-label="Үнэлгээ">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={rating === value}
                      aria-label={`${value} од`}
                      onClick={() => setRating(value)}
                      className={`text-2xl leading-none ${
                        value <= rating ? "text-amber-400" : "text-slate-600 hover:text-slate-400"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <details className="group/scores bg-slate-900/40 border border-slate-800 rounded-lg">
                <summary className="cursor-pointer select-none px-3 py-2 text-slate-300">
                  ⚡🤫🔌 Wi-Fi, чимээгүй байдал, розеткыг үнэлэх (заавал биш)
                </summary>
                <div className="px-3 pb-3">
                  <ScoreFields value={scores} onChange={setScores} />
                </div>
              </details>
              <textarea
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Розетка, чимээгүй байдал, цагийн хуваарь..."
                aria-label="Сэтгэгдэл бичих"
                className={inputClass}
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl"
              >
                {saving ? "Илгээж байна..." : `${displayName(user)} нэрээр сэтгэгдэл үлдээх`}
              </button>
              {error ? <p className="text-rose-400">{error}</p> : null}
            </form>
          )}
          <ul className="space-y-2" aria-busy={loading}>
            {loading ? (
              <>
                <ReviewSkeleton />
                <ReviewSkeleton />
                <ReviewSkeleton />
              </>
            ) : reviews.length === 0 ? (
              <li className="text-xs text-slate-500 text-center py-8">
                Одоогоор сэтгэгдэл алга. Анхны сэтгэгдлийг та үлдээгээрэй!
              </li>
            ) : (
              reviews.map((review) => (
                <li
                  key={review.id}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-sm space-y-1.5"
                >
                  <div className="flex justify-between gap-2 items-center">
                    <span className="font-semibold text-slate-100">{review.author_name ?? "Зочин"}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(review.created_at).toLocaleDateString("en-CA")}
                    </span>
                  </div>
                  <Stars value={review.rating} className="text-sm" />
                  <p className="text-slate-200 whitespace-pre-line">{review.comment}</p>
                  <ReviewScoreLine review={review} />
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Баруун тал (утсан дээр дээр): газрын мэдээлэл */}
        <aside className="order-1 md:order-2 md:w-[45%] md:overflow-y-auto">
          <div className="relative h-56 sm:h-64 w-full bg-slate-950">
            <img src={spot.image || PLACEHOLDER_IMAGE} alt={spot.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
            <button
              onClick={onClose}
              type="button"
              aria-label="Хаах"
              className="absolute top-3 right-3 h-9 w-9 rounded-full bg-slate-900/80 backdrop-blur text-slate-200 hover:text-white border border-slate-700"
            >
              ✕
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-5">
              {category ? (
                <span className="inline-block mb-2 text-xs font-semibold bg-slate-900/80 backdrop-blur text-indigo-300 border border-slate-700 px-2.5 py-1 rounded-lg">
                  {category.icon} {category.label}
                </span>
              ) : null}
              <h2 id="spot-dialog-title" className="text-2xl font-bold text-white">
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

          <div className="p-5 space-y-5">
            {spot.description ? (
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{spot.description}</p>
            ) : null}
            {status ? (
              <p className={`text-sm font-semibold ${STATUS_TONE[status.tone]}`}>● {status.detail}</p>
            ) : null}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-2.5">
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

            {featureGroups.map((group) => (
              <section key={group.key} className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-400">{group.title}</h3>
                <ChipList chips={group.chips} />
              </section>
            ))}

            {accessibility.length > 0 ? (
              <section className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-400">Хүртээмж</h3>
                {accessibility.map((group) => (
                  <div key={group.key} className="space-y-1.5">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">{group.label}</p>
                    <ChipList chips={group.items} />
                  </div>
                ))}
              </section>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
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
        </aside>
      </div>
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
