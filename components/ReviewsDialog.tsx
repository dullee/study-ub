"use client";

import { FormEvent, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { displayName, Review, StudySpot } from "@/types";
import { insertReview, updateReview } from "@/lib/supabase/spots";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { saveLocalReview } from "@/lib/localStore";
import Stars from "@/components/Stars";
import ScoreFields, { ScoreValues } from "@/components/ScoreFields";
import ReviewScoreLine from "@/components/ReviewScoreLine";
import { useI18n } from "@/components/LanguageProvider";
import { LIMITS } from "@/lib/limits";

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
  const { t } = useI18n();
  return (
    <li className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-sm space-y-1.5">
      <div className="flex justify-between gap-2 items-center">
        <span className="font-semibold text-slate-100">{review.author_name ?? t.guest}</span>
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
type SignedInUser = NonNullable<ReturnType<typeof useUser>["user"]>;

// Хэрэглэгч газар бүрт нэг сэтгэгдэл: байвал түүгээр бөглөж, "шинэчлэх" горимд ажиллана.
// key={existing?.id} — сэтгэгдэл ачаалагдсаны дараа формыг дахин эхлүүлнэ.
function ReviewForm({
  spot,
  user,
  existing,
  onSaved,
}: {
  spot: StudySpot;
  user: SignedInUser;
  existing: Review | undefined;
  onSaved: (review: Review) => void;
}) {
  const { t } = useI18n();
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [scores, setScores] = useState<ScoreValues>({
    wifi_mbps: existing?.wifi_mbps ?? undefined,
    quiet_rating: existing?.quiet_rating ?? undefined,
    outlet_rating: existing?.outlet_rating ?? undefined,
  });
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fields = {
      comment: comment.trim(),
      rating,
      wifi_mbps: scores.wifi_mbps ?? null,
      quiet_rating: scores.quiet_rating ?? null,
      outlet_rating: scores.outlet_rating ?? null,
    };
    let saved: Review | "already_reviewed" | null;
    if (existing) {
      const updated: Review = { ...existing, ...fields };
      saved = isSupabaseConfigured ? await updateReview(updated) : updated;
      if (saved && !isSupabaseConfigured) saveLocalReview(saved);
    } else {
      const draft = { ...fields, spot_id: spot.id, user_id: user.id, author_name: displayName(user) };
      if (isSupabaseConfigured) {
        saved = await insertReview(draft);
      } else {
        saved = { ...draft, id: Date.now(), created_at: new Date().toISOString() };
        saveLocalReview(saved);
      }
    }
    setSaving(false);
    if (saved === null || saved === "already_reviewed") {
      setError(saved === "already_reviewed" ? t.alreadyReviewed : t.reviewSaveFailed);
      return;
    }
    onSaved(saved);
    if (!existing) {
      setComment("");
      setScores({});
      setRating(5);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-xs bg-slate-800/30 border border-slate-800 rounded-xl p-4">
      {existing ? <p className="text-sm font-semibold text-slate-200">{t.yourReview}</p> : null}
      <div className="flex items-center gap-1" role="radiogroup" aria-label={t.ratingLabel}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={t.stars(value)}
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
        <summary className="cursor-pointer select-none px-3 py-2 text-slate-300">{t.rateScoresOptional}</summary>
        <div className="px-3 pb-3">
          <ScoreFields value={scores} onChange={setScores} />
        </div>
      </details>
      <div>
        <textarea
          required
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={LIMITS.reviewComment}
          placeholder={t.reviewPlaceholder}
          aria-label={t.writeReview}
          className={inputClass}
        />
        {comment.length > LIMITS.reviewComment * 0.8 ? (
          <p className="text-right text-[11px] text-slate-500">
            {comment.length}/{LIMITS.reviewComment}
          </p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={saving || comment.trim() === ""}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl"
      >
        {saving ? t.sending : existing ? t.updateReview : t.postReviewAs(displayName(user))}
      </button>
      {error ? <p className="text-rose-400">{error}</p> : null}
    </form>
  );
}

export default function ReviewsDialog({ spot, reviews, loading, onReviewAdded, onClose }: ReviewsDialogProps) {
  const { t } = useI18n();
  const { user, isLoaded } = useUser();
  // Жагсаалт шинэ нь эхэнд — хуучин давхар сэтгэгдэл байвал хамгийн сүүлийнхийг засна.
  const myReview = user ? reviews.find((review) => review.user_id === user.id) : undefined;

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
              {t.reviewsHeading} {loading ? "" : `(${reviews.length})`}
            </h2>
            <p className="text-xs text-slate-400 truncate">{spot.name}</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label={t.closeReviews}
            className="h-10 w-10 shrink-0 rounded-full bg-slate-800 text-slate-200 hover:text-white border border-slate-700"
          >
            ✕
          </button>
        </div>

        {!isLoaded ? null : !user ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center space-y-2 text-xs">
            <p className="text-slate-400">{t.signInToReview}</p>
            <SignInButton mode="modal">
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-semibold">
                {t.signIn}
              </button>
            </SignInButton>
          </div>
        ) : (
          loading ? null : (
            <ReviewForm key={myReview?.id ?? "new"} spot={spot} user={user} existing={myReview} onSaved={onReviewAdded} />
          )
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
              {t.noReviewsYet}
            </li>
          ) : (
            reviews.map((review) => <ReviewItem key={review.id} review={review} />)
          )}
        </ul>
      </section>
    </div>
  );
}
