"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { UserButton, useAuth } from "@clerk/nextjs";
import { googleMapsUrl, PLACEHOLDER_IMAGE, Review, StudySpot } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isCloudinaryConfigured, MAX_IMAGE_BYTES, uploadImage } from "@/lib/cloudinary";
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

const inputClass =
  "w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500";

type Tab = "pending" | "places" | "comments";

// app/admin/page.tsx сервер дээр Clerk-ийн админ эрхийг шалгасны дараа л харагдана.
export default function AdminPanel() {
  const { isLoaded } = useAuth();
  const [tab, setTab] = useState<Tab>("pending");
  const [remote, setRemote] = useState(false);
  const [spots, setSpots] = useState<StudySpot[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingSpotId, setEditingSpotId] = useState<number | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  useEffect(() => {
    // Clerk ачаалагдаж token бэлэн болсны дараа л уншина — эс бөгөөс хүлээгдэж буй газрууд харагдахгүй.
    if (!isLoaded) return;
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
  }, [isLoaded]);

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

  const saveSpot = async (updated: StudySpot) => {
    if (remote) {
      const saved = await updateSpot(updated);
      if (!saved) return false;
      setSpots((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
    } else {
      const next = spots.map((item) => (item.id === updated.id ? updated : item));
      setSpots(next);
      saveLocalSpots(next);
    }
    setEditingSpotId(null);
    return true;
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

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 sticky top-0 bg-slate-900/90 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="font-bold">StudySpots админ</h1>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-slate-400 hover:text-white">
              Нүүр хуудас
            </Link>
            <UserButton />
          </div>
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
              pending.map((spot) =>
                editingSpotId === spot.id ? (
                  <article key={spot.id} className="border border-slate-800 rounded-2xl p-4 bg-slate-800/40">
                    <SpotEditForm spot={spot} onSave={saveSpot} onCancel={() => setEditingSpotId(null)} />
                  </article>
                ) : (
                <article key={spot.id} className="border border-slate-800 rounded-2xl p-4 bg-slate-800/40 space-y-2">
                  <h2 className="font-semibold">{spot.name}</h2>
                  <p className="text-xs text-slate-400">
                    {spot.location} · {spot.hours} · {spot.lat}, {spot.lng}
                  </p>
                  <p className="text-xs text-slate-300">{spot.tags.join(", ")}</p>
                  <a href={googleMapsUrl(spot)} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-300">
                    Google Maps
                  </a>
                  <SpotImage spot={spot} />
                  <div className="flex gap-2">
                    <button onClick={() => acceptSpot(spot)} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-xs">
                      Зөвшөөрөх
                    </button>
                    <button onClick={() => rejectSpot(spot)} className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs">
                      Татгалзах
                    </button>
                    <button onClick={() => setEditingSpotId(spot.id)} className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs">
                      Засах
                    </button>
                  </div>
                </article>
                )
              )
            )}
          </section>
        )}

        {tab === "places" && (
          <section className="space-y-3">
            {spots
              .filter((spot) => spot.status !== "pending")
              .map((spot) => (
                <article key={spot.id} className="border border-slate-800 rounded-2xl p-4 bg-slate-800/40">
                  {editingSpotId === spot.id ? (
                    <SpotEditForm spot={spot} onSave={saveSpot} onCancel={() => setEditingSpotId(null)} />
                  ) : (
                    <div className="flex justify-between gap-3 items-start">
                      <div className="space-y-2">
                        <h2 className="font-semibold">{spot.name}</h2>
                        <p className="text-xs text-slate-400">
                          {spot.location} · {spot.status === "rejected" ? "Татгалзсан" : "Нийтлэгдсэн"}
                        </p>
                        <SpotImage spot={spot} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingSpotId(spot.id)} className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs">Засах</button>
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
                  <p className="text-xs text-indigo-300 mb-2">
                    {spotName(review.spot_id)}
                    <span className="text-slate-400"> · {review.author_name ?? "Зочин"}</span>
                  </p>
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

// Зургийг товч дарсны дараа л ачаална — жагсаалт олон зураг нэг дор татахгүй.
function SpotImage({ spot }: { spot: StudySpot }) {
  const [shown, setShown] = useState(false);
  if (!hasPhoto(spot.image)) {
    return (
      <span className="inline-block px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-400">
        Зураг оруулаагүй
      </span>
    );
  }
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setShown((value) => !value)}
        className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs"
      >
        {shown ? "Зураг нуух" : "Зураг харах"}
      </button>
      {shown ? (
        <a href={spot.image} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={spot.image}
            alt={spot.name}
            className="max-h-64 w-full max-w-md object-cover rounded-lg border border-slate-700"
          />
        </a>
      ) : null}
    </div>
  );
}

const hasPhoto = (image?: string) => Boolean(image) && image !== PLACEHOLDER_IMAGE;

// Хүлээгдэж буй болон нийтлэгдсэн газрыг засна. Шинэ зургийг хадгалах үед Cloudinary руу хуулна.
function SpotEditForm({
  spot,
  onSave,
  onCancel,
}: {
  spot: StudySpot;
  onSave: (spot: StudySpot) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(spot);
  // Шошгыг текстээр хадгалж, хадгалахдаа массив болгоно — бичиж байхад таслал, зай арилахгүй.
  const [tagsText, setTagsText] = useState(spot.tags.join(", "));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const clearFile = () => {
    setImageFile(null);
    setPreview("");
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    clearFile();
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Зөвхөн зургийн файл сонгоно уу.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Зураг 5MB-аас бага байх ёстой.");
      e.target.value = "";
      return;
    }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    clearFile();
    setDraft({ ...draft, image: PLACEHOLDER_IMAGE });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    let image = draft.image;
    if (imageFile) {
      try {
        image = await uploadImage(imageFile);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Зураг хуулахад алдаа гарлаа.");
        setSaving(false);
        return;
      }
    }
    const ok = await onSave({
      ...draft,
      image: image || PLACEHOLDER_IMAGE,
      tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean),
    });
    if (!ok) {
      setError("Хадгалж чадсангүй. Дахин оролдоно уу.");
      setSaving(false);
    }
  };

  const shownImage = preview || (hasPhoto(draft.image) ? draft.image : "");

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2 text-xs">
      <input className={inputClass} required placeholder="Нэр" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      <input className={inputClass} required placeholder="Байршил" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
      <input className={inputClass} placeholder="Ажиллах цаг" value={draft.hours} onChange={(e) => setDraft({ ...draft, hours: e.target.value })} />
      <input className={inputClass} placeholder="Шошго, таслалаар тусгаарлана" value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
      <input className={inputClass} type="number" step="any" required value={draft.lat} onChange={(e) => setDraft({ ...draft, lat: Number(e.target.value) })} />
      <input className={inputClass} type="number" step="any" required value={draft.lng} onChange={(e) => setDraft({ ...draft, lng: Number(e.target.value) })} />
      <input className={`${inputClass} col-span-2`} type="url" placeholder="Google Maps холбоос" value={draft.maps_url ?? ""} onChange={(e) => setDraft({ ...draft, maps_url: e.target.value })} />

      <div className="col-span-2 space-y-2">
        <label className="block text-slate-400">Зураг</label>
        {shownImage ? (
          <img src={shownImage} alt={draft.name} className="max-h-48 w-full max-w-md object-cover rounded-lg border border-slate-700" />
        ) : (
          <span className="inline-block px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400">
            Зураг оруулаагүй
          </span>
        )}
        {isCloudinaryConfigured ? (
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-300 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-indigo-600 file:text-white file:text-xs file:font-semibold"
          />
        ) : (
          <input
            className={inputClass}
            type="url"
            placeholder="Зургийн URL"
            value={hasPhoto(draft.image) ? draft.image : ""}
            onChange={(e) => setDraft({ ...draft, image: e.target.value })}
          />
        )}
        {shownImage ? (
          <button type="button" onClick={removePhoto} className="px-3 py-1.5 rounded-lg bg-rose-900/70">
            Зураг устгах
          </button>
        ) : null}
      </div>

      {error ? <p className="col-span-2 text-rose-400">{error}</p> : null}
      <div className="col-span-2 flex gap-2">
        <button disabled={saving} className="px-3 py-1.5 rounded-lg bg-indigo-600 disabled:opacity-60">
          {saving ? (imageFile ? "Зураг хуулж байна..." : "Хадгалж байна...") : "Хадгалах"}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className="px-3 py-1.5 rounded-lg bg-slate-700">
          Болих
        </button>
      </div>
    </form>
  );
}
