"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { googleMapsUrl, Review, StudySpot } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  deleteReview,
  deleteSpot,
  fetchAllReviews,
  fetchAllSpots,
  updateReview,
  updateSpot,
} from "@/lib/supabase/spots";
import {
  loadLocalReviews,
  loadLocalSpots,
  removeLocalReview,
  saveLocalReview,
  saveLocalSpots,
} from "@/lib/localStore";

const SESSION_KEY = "studyspots_admin";
const inputClass =
  "w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500";

type Tab = "pending" | "places" | "comments";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("pending");
  const [remote, setRemote] = useState(false);
  const [spots, setSpots] = useState<StudySpot[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingSpot, setEditingSpot] = useState<StudySpot | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
  }, []);

  useEffect(() => {
    if (!authed) return;
    let cancelled = false;
    async function load() {
      if (isSupabaseConfigured) {
        const [spotRows, reviewRows] = await Promise.all([fetchAllSpots(), fetchAllReviews()]);
        if (!cancelled && spotRows && reviewRows) {
          setSpots(spotRows);
          setReviews(reviewRows);
          setRemote(true);
          return;
        }
      }
      if (!cancelled) {
        setSpots(loadLocalSpots());
        setReviews(loadLocalReviews());
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [authed]);

  const login = (e: FormEvent) => {
    e.preventDefault();
    const expected = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin";
    if (password !== expected) {
      setError("Нууц үг буруу байна.");
      return;
    }
    sessionStorage.setItem(SESSION_KEY, "1");
    setAuthed(true);
    setError("");
  };

  const persistSpots = async (next: StudySpot[], changed?: StudySpot, removedId?: number) => {
    setSpots(next);
    if (remote && removedId) {
      await deleteSpot(removedId);
      return;
    }
    if (remote && changed) {
      await updateSpot(changed);
      return;
    }
    saveLocalSpots(next);
  };

  const acceptSpot = (spot: StudySpot) => {
    const updated = { ...spot, status: "approved" as const };
    persistSpots(
      spots.map((item) => (item.id === spot.id ? updated : item)),
      updated
    );
  };

  const rejectSpot = (spot: StudySpot) => {
    const updated = { ...spot, status: "rejected" as const };
    persistSpots(
      spots.map((item) => (item.id === spot.id ? updated : item)),
      updated
    );
  };

  const removeSpot = (id: number) => {
    persistSpots(
      spots.filter((item) => item.id !== id),
      undefined,
      id
    );
    const remaining = reviews.filter((review) => review.spot_id !== id);
    setReviews(remaining);
    if (!remote) {
      reviews.filter((review) => review.spot_id === id).forEach((review) => removeLocalReview(review.id));
    }
  };

  const saveSpot = (e: FormEvent) => {
    e.preventDefault();
    if (!editingSpot) return;
    persistSpots(
      spots.map((item) => (item.id === editingSpot.id ? editingSpot : item)),
      editingSpot
    );
    setEditingSpot(null);
  };

  const saveReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    if (remote) {
      const saved = await updateReview(editingReview);
      if (saved) setReviews(reviews.map((item) => (item.id === saved.id ? saved : item)));
    } else {
      saveLocalReview(editingReview);
      setReviews(reviews.map((item) => (item.id === editingReview.id ? editingReview : item)));
    }
    setEditingReview(null);
  };

  const removeReview = async (id: number) => {
    if (remote) await deleteReview(id);
    else removeLocalReview(id);
    setReviews(reviews.filter((item) => item.id !== id));
  };

  const spotName = (id: number) => spots.find((spot) => spot.id === id)?.name ?? `#${id}`;
  const pending = spots.filter((spot) => spot.status === "pending");

  if (!authed) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <form onSubmit={login} className="w-full max-w-sm bg-slate-800/60 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h1 className="text-lg font-bold">Админ нэвтрэх</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Нууц үг"
            className={inputClass}
          />
          {error ? <p className="text-xs text-rose-400">{error}</p> : null}
          <button className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2.5 text-sm font-semibold">
            Нэвтрэх
          </button>
          <Link href="/" className="block text-center text-xs text-slate-400 hover:text-white">
            Нүүр хуудас
          </Link>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 sticky top-0 bg-slate-900/90 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="font-bold">StudySpots админ</h1>
          <Link href="/" className="text-xs text-slate-400 hover:text-white">
            Нүүр хуудас
          </Link>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="flex gap-2">
          {(
            [
              ["pending", `Хүлээгдэж буй (${pending.length})`],
              ["places", "Газрууд"],
              ["comments", "Сэтгэгдэл"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                tab === id ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "pending" && (
          <section className="space-y-3">
            {pending.length === 0 ? (
              <p className="text-sm text-slate-500">Хүлээгдэж буй газар алга.</p>
            ) : (
              pending.map((spot) => (
                <article key={spot.id} className="border border-slate-800 rounded-2xl p-4 bg-slate-800/40 space-y-2">
                  <h2 className="font-semibold">{spot.name}</h2>
                  <p className="text-xs text-slate-400">
                    {spot.location} · {spot.hours} · {spot.lat}, {spot.lng}
                  </p>
                  <p className="text-xs text-slate-300">{spot.tags.join(", ")}</p>
                  <a href={googleMapsUrl(spot)} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-300">
                    Google Maps
                  </a>
                  <div className="flex gap-2">
                    <button onClick={() => acceptSpot(spot)} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-xs">
                      Зөвшөөрөх
                    </button>
                    <button onClick={() => rejectSpot(spot)} className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs">
                      Татгалзах
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        )}

        {tab === "places" && (
          <section className="space-y-3">
            {spots
              .filter((spot) => spot.status !== "pending")
              .map((spot) => (
                <article key={spot.id} className="border border-slate-800 rounded-2xl p-4 bg-slate-800/40">
                  {editingSpot?.id === spot.id ? (
                    <form onSubmit={saveSpot} className="grid grid-cols-2 gap-2 text-xs">
                      <input className={inputClass} value={editingSpot.name} onChange={(e) => setEditingSpot({ ...editingSpot, name: e.target.value })} />
                      <input className={inputClass} value={editingSpot.location} onChange={(e) => setEditingSpot({ ...editingSpot, location: e.target.value })} />
                      <input className={inputClass} value={editingSpot.hours} onChange={(e) => setEditingSpot({ ...editingSpot, hours: e.target.value })} />
                      <input className={inputClass} value={editingSpot.tags.join(", ")} onChange={(e) => setEditingSpot({ ...editingSpot, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />
                      <input className={inputClass} type="number" step="any" value={editingSpot.lat} onChange={(e) => setEditingSpot({ ...editingSpot, lat: Number(e.target.value) })} />
                      <input className={inputClass} type="number" step="any" value={editingSpot.lng} onChange={(e) => setEditingSpot({ ...editingSpot, lng: Number(e.target.value) })} />
                      <input className={`${inputClass} col-span-2`} type="url" placeholder="Google Maps холбоос" value={editingSpot.maps_url ?? ""} onChange={(e) => setEditingSpot({ ...editingSpot, maps_url: e.target.value })} />
                      <div className="col-span-2 flex gap-2">
                        <button className="px-3 py-1.5 rounded-lg bg-indigo-600">Хадгалах</button>
                        <button type="button" onClick={() => setEditingSpot(null)} className="px-3 py-1.5 rounded-lg bg-slate-700">Болих</button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between gap-3 items-start">
                      <div>
                        <h2 className="font-semibold">{spot.name}</h2>
                        <p className="text-xs text-slate-400">
                          {spot.location} · {spot.status === "rejected" ? "Татгалзсан" : "Нийтлэгдсэн"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingSpot(spot)} className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs">Засах</button>
                        {spot.status === "rejected" ? (
                          <button onClick={() => acceptSpot(spot)} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-xs">Зөвшөөрөх</button>
                        ) : null}
                        <button onClick={() => removeSpot(spot.id)} className="px-3 py-1.5 rounded-lg bg-rose-900/70 text-xs">Устгах</button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
          </section>
        )}

        {tab === "comments" && (
          <section className="space-y-3">
            {reviews.length === 0 ? (
              <p className="text-sm text-slate-500">Сэтгэгдэл алга.</p>
            ) : (
              reviews.map((review) => (
                <article key={review.id} className="border border-slate-800 rounded-2xl p-4 bg-slate-800/40 text-sm">
                  <p className="text-xs text-indigo-300 mb-2">{spotName(review.spot_id)}</p>
                  {editingReview?.id === review.id ? (
                    <form onSubmit={saveReview} className="space-y-2 text-xs">
                      <input className={inputClass} type="number" min={1} max={5} value={editingReview.rating} onChange={(e) => setEditingReview({ ...editingReview, rating: Number(e.target.value) })} />
                      <input className={inputClass} value={editingReview.wifi_speed_test} onChange={(e) => setEditingReview({ ...editingReview, wifi_speed_test: e.target.value })} />
                      <textarea className={inputClass} rows={3} value={editingReview.comment} onChange={(e) => setEditingReview({ ...editingReview, comment: e.target.value })} />
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 rounded-lg bg-indigo-600">Хадгалах</button>
                        <button type="button" onClick={() => setEditingReview(null)} className="px-3 py-1.5 rounded-lg bg-slate-700">Болих</button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-semibold text-indigo-300">{review.rating}/5</p>
                        <p>{review.comment}</p>
                        {review.wifi_speed_test ? <p className="text-xs text-slate-400">⚡ {review.wifi_speed_test}</p> : null}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingReview(review)} className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs">Засах</button>
                        <button onClick={() => removeReview(review.id)} className="px-3 py-1.5 rounded-lg bg-rose-900/70 text-xs">Устгах</button>
                      </div>
                    </div>
                  )}
                </article>
              ))
            )}
          </section>
        )}
      </div>
    </main>
  );
}
