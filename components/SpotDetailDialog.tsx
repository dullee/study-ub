"use client";

import { FormEvent, useEffect, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { displayName, Review, StudySpot } from "@/types";
import { fetchReviews, insertReview } from "@/lib/supabase/spots";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { reviewsForSpot, saveLocalReview } from "@/lib/localStore";

interface ReviewSectionProps {
  spot: StudySpot;
  onClose: () => void;
}

export default function ReviewSection({ spot, onClose }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comment, setComment] = useState("");
  const [wifi, setWifi] = useState("");
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
          return;
        }
      }
      if (!cancelled) setReviews(reviewsForSpot(spot.id));
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [spot.id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    const draft = {
      spot_id: spot.id,
      comment,
      wifi_speed_test: wifi,
      rating,
      user_id: user.id,
      author_name: displayName(user),
    };
    if (isSupabaseConfigured) {
      const saved = await insertReview(draft);
      if (!saved) {
        setError("Сэтгэгдэл хадгалагдсангүй. Дахин оролдоно уу.");
        setSaving(false);
        return;
      }
      setReviews((prev) => [saved, ...prev]);
    } else {
      const saved: Review = {
        ...draft,
        id: Date.now(),
        created_at: new Date().toISOString(),
      };
      saveLocalReview(saved);
      setReviews((prev) => [saved, ...prev]);
    }
    setComment("");
    setWifi("");
    setRating(5);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">{spot.name}</h3>
            <p className="text-xs text-slate-400">Сэтгэгдэл ба Wi-Fi хурд</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg" type="button">
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
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Үнэлгээ (1–5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Wi-Fi хурдны тест</label>
              <input
                type="text"
                value={wifi}
                onChange={(e) => setWifi(e.target.value)}
                placeholder="Ж: 72 Mbps"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Сэтгэгдэл</label>
              <textarea
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Розетка, чимээгүй байдал, цагийн хуваарь..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
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
        <ul className="space-y-2">
          {reviews.length === 0 ? (
            <li className="text-xs text-slate-500 text-center py-4">Одоогоор сэтгэгдэл алга.</li>
          ) : (
            reviews.map((review) => (
              <li key={review.id} className="bg-slate-800/70 border border-slate-700 rounded-xl p-3 text-xs space-y-1">
                <p className="flex justify-between gap-2">
                  <span className="text-indigo-300 font-semibold">{review.rating}/5</span>
                  <span className="text-slate-400">
                    {review.author_name ?? "Зочин"} · {new Date(review.created_at).toLocaleDateString("en-CA")}
                  </span>
                </p>
                <p className="text-slate-200">{review.comment}</p>
                {review.wifi_speed_test ? (
                  <p className="text-slate-400">⚡ {review.wifi_speed_test}</p>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
