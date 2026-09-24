"use client";

import { FormEvent, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { displayName, Review, StudySpot } from "@/types";
import { insertReview } from "@/lib/supabase/spots";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { saveLocalReview } from "@/lib/localStore";
import Stars from "@/components/Stars";
import ScoreFields, { ScoreValues } from "@/components/ScoreFields";
import ReviewScoreLine from "@/components/ReviewScoreLine";

interface ReviewsDialogProps {
  spot: StudySpot;
  reviews: Review[];
  loading: boolean;
  onReviewAdded: (review: Review) => void;
  onClose: () => void;
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

export function ReviewItem({ review, clamp = false }: { review: Review; clamp?: boolean }) {
  return (
    <li className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-sm space-y-1.5">
      <div className="flex justify-between gap-2 items-center">
        <span className="font-semibold text-slate-100">{review.author_name ?? "Зочин"}</span>
        <span className="text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString("en-CA")}</span>
      </div>
      <Stars value={review.rating} className="text-sm" />
      <p className={`text-slate-200 whitespace-pre-line ${clamp ? "line-clamp-2" : ""}`}>{review.comment}</p>
      <ReviewScoreLine review={review} />
    </li>
  );
}

// Газрын цонхны дээр нээгддэг тусдаа цонх: сэтгэгдэл бичих, бүх сэтгэгдлийг харах.
// Esc-ийг SpotDetailDialog барина — эхлээд энэ цонх, дараа нь газрын цонх хаагдана.
export default function ReviewsDialog({ spot, reviews, loading, onReviewAdded, onClose }: ReviewsDialogProps) {
  const [comment, setComment] = useState("");
  const [scores, setScores] = useState<ScoreValues>({});
  const [rating, setRating] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { user, isLoaded } = useUser();

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
    onReviewAdded(saved);
    setComment("");
    setScores({});
    setRating(5);
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/70 z-[1200] flex items-stretch sm:items-center justify-center p-0 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="reviews-dialog-title"
        className="relative bg-slate-900 sm:border border-slate-800 w-full max-w-2xl rounded-none sm:rounded-2xl shadow-2xl h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[88vh] overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6 space-y-4"
      >
        <div className="sticky top-0 z-10 -mx-5 sm:-mx-6 px-5 sm:px-6 pt-5 sm:pt-6 pb-3 bg-slate-900 border-b border-slate-800 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="reviews-dialog-title" className="text-lg font-bold text-white">
              💬 Сэтгэгдэл {loading ? "" : `(${reviews.length})`}
            </h2>
            <p className="text-xs text-slate-400 truncate">{spot.name}</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Сэтгэгдлийг хаах"
            className="h-10 w-10 shrink-0 rounded-full bg-slate-800 text-slate-200 hover:text-white border border-slate-700"
          >
            ✕
          </button>
        </div>

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
          <form onSubmit={handleSubmit} className="space-y-3 text-xs bg-slate-800/30 border border-slate-800 rounded-xl p-4">
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
            <details className="bg-slate-900/40 border border-slate-800 rounded-lg">
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
            reviews.map((review) => <ReviewItem key={review.id} review={review} />)
          )}
        </ul>
      </section>
    </div>
  );
}
