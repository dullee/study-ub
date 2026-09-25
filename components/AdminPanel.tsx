"use client";

import Link from "next/link";
import { LIMITS } from "@/lib/limits";
import { ChangeEvent, FormEvent, ReactNode, useEffect, useState } from "react";
import { UserButton, useAuth } from "@clerk/nextjs";
import {
  ACCESSIBILITY,
  AMENITIES,
  EventAttendee,
  googleMapsUrl,
  PLACEHOLDER_IMAGE,
  Review,
  SPOT_CATEGORIES,
  SpotCategory,
  StudyEvent,
  StudySpot,
} from "@/types";
import {
  deleteChatLink,
  deleteEvent,
  fetchAttendees,
  fetchChatLink,
  fetchEvents,
  saveChatLink,
  updateEvent,
} from "@/lib/supabase/events";
import { normalizeChatUrl } from "@/lib/chatLinks";
import { formatEventTime } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isCloudinaryConfigured, MAX_IMAGE_BYTES, uploadImage } from "@/lib/cloudinary";
import OptionPicker from "@/components/OptionPicker";
import { useI18n } from "@/components/LanguageProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useConfirm } from "@/components/ConfirmDialog";
import ScoreFields from "@/components/ScoreFields";
import ReviewScoreLine from "@/components/ReviewScoreLine";
import {
  deleteReview,
  deleteSpot,
  fetchAllReviews,
  fetchAllSpots,
  updateReview,
  updateSpot,
} from "@/lib/supabase/spots";
import {
  loadLocalAttendees,
  loadLocalChatLink,
  loadLocalEvents,
  loadLocalReviews,
  loadLocalSpots,
  removeLocalEvent,
  removeLocalReview,
  saveLocalChatLink,
  saveLocalReview,
  saveLocalSpots,
  updateLocalEvent,
} from "@/lib/localStore";

const inputClass =
  "w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500";

type Tab = "pending" | "places" | "comments" | "events";

// Товчнуудын өнгө: зөвшөөрөх — ногоон, татгалзах — улаан, устгах — улаан хүрээтэй (бусдаас хол, баруун талд).
const btn =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60";
const btnNeutral = `${btn} bg-slate-700 hover:bg-slate-600 text-slate-100`;
const btnApprove = `${btn} bg-emerald-600 hover:bg-emerald-500 text-white`;
const btnReject = `${btn} bg-rose-600 hover:bg-rose-500 text-white`;
const btnDelete = `${btn} border border-rose-700/70 text-rose-300 hover:bg-rose-950/70 hover:text-rose-200`;
const cardClass = "rounded-2xl border border-slate-800 bg-slate-800/40 overflow-hidden";
const actionBar = "flex flex-wrap items-center gap-2 px-4 py-3 border-t border-slate-800 bg-slate-900/40";

// app/admin/page.tsx сервер дээр Clerk-ийн админ эрхийг шалгасны дараа л харагдана.
export default function AdminPanel() {
  const { isLoaded } = useAuth();
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<Tab>("pending");
  const [remote, setRemote] = useState(false);
  const [spots, setSpots] = useState<StudySpot[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingSpotId, setEditingSpotId] = useState<number | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [eventError, setEventError] = useState("");
  // Газар, сэтгэгдлийн өөрчлөлт хадгалагдаагүй бол.
  const [actionError, setActionError] = useState("");
  // "Өнгөрсөн" тэмдэглэгээнд — панел нээгдсэн мөчийн цаг.
  const [nowMs] = useState(() => Date.now());
  const [confirm, confirmDialog] = useConfirm();

  useEffect(() => {
    // Clerk ачаалагдаж token бэлэн болсны дараа л уншина — эс бөгөөс хүлээгдэж буй газрууд харагдахгүй.
    if (!isLoaded) return;
    let cancelled = false;
    async function load() {
      if (isSupabaseConfigured) {
        const [spotRows, reviewRows, eventRows, attendeeRows] = await Promise.all([
          fetchAllSpots(),
          fetchAllReviews(),
          fetchEvents(),
          fetchAttendees(),
        ]);
        if (!cancelled && spotRows && reviewRows) {
          setSpots(spotRows);
          setReviews(reviewRows);
          setEvents(eventRows ?? []);
          setAttendees(attendeeRows ?? []);
          setRemote(true);
          return;
        }
      }
      if (!cancelled) {
        setSpots(loadLocalSpots());
        setReviews(loadLocalReviews());
        setEvents(loadLocalEvents());
        setAttendees(loadLocalAttendees());
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isLoaded]);

  // Өгөгдлийн санд хадгалагдсаны дараа л дэлгэцийг шинэчилнэ; амжилтгүй бол алдаа харуулж, хуучнаараа үлдээнэ.
  const persistSpots = async (next: StudySpot[], changed?: StudySpot, removedId?: number) => {
    setActionError("");
    if (remote) {
      const ok = removedId ? await deleteSpot(removedId) : changed ? Boolean(await updateSpot(changed)) : true;
      if (!ok) {
        setActionError(removedId ? t.deleteFailed : t.saveFailed);
        return false;
      }
    } else {
      saveLocalSpots(next);
    }
    setSpots(next);
    return true;
  };

  const acceptSpot = async (spot: StudySpot) => {
    const ok = await confirm({
      title: t.approveSpotTitle,
      message: t.confirmApproveSpot(spot.name),
      confirmLabel: t.approve,
      cancelLabel: t.cancel,
      tone: "approve",
    });
    if (!ok) return;
    const updated = { ...spot, status: "approved" as const };
    persistSpots(
      spots.map((item) => (item.id === spot.id ? updated : item)),
      updated
    );
  };

  const rejectSpot = async (spot: StudySpot) => {
    const ok = await confirm({
      title: t.rejectSpotTitle,
      message: t.confirmRejectSpot(spot.name),
      confirmLabel: t.reject,
      cancelLabel: t.cancel,
    });
    if (!ok) return;
    const updated = { ...spot, status: "rejected" as const };
    persistSpots(
      spots.map((item) => (item.id === spot.id ? updated : item)),
      updated
    );
  };

  // Татгалзсан газрыг дахин хянах жагсаалтад буцаана — буцаах боломжтой тул баталгаажуулахгүй.
  const returnToReview = (spot: StudySpot) => {
    const updated = { ...spot, status: "pending" as const };
    persistSpots(
      spots.map((item) => (item.id === spot.id ? updated : item)),
      updated
    );
  };

  const removeSpot = async (spot: StudySpot) => {
    const ok = await confirm({
      title: t.deleteSpotTitle,
      message: t.confirmDeleteSpot(spot.name),
      confirmLabel: t.delete,
      cancelLabel: t.cancel,
    });
    if (!ok) return;
    const id = spot.id;
    const deleted = await persistSpots(
      spots.filter((item) => item.id !== id),
      undefined,
      id
    );
    if (!deleted) return;
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
    setActionError("");
    if (remote) {
      const saved = await updateReview(editingReview);
      if (!saved) {
        setActionError(t.saveFailed);
        return;
      }
      setReviews(reviews.map((item) => (item.id === saved.id ? saved : item)));
    } else {
      saveLocalReview(editingReview);
      setReviews(reviews.map((item) => (item.id === editingReview.id ? editingReview : item)));
    }
    setEditingReview(null);
  };

  const removeReview = async (review: Review) => {
    const ok = await confirm({
      title: t.deleteReviewTitle,
      message: t.confirmDeleteReview(review.author_name ?? t.guest),
      confirmLabel: t.delete,
      cancelLabel: t.cancel,
    });
    if (!ok) return;
    const id = review.id;
    setActionError("");
    if (remote) {
      if (!(await deleteReview(id))) {
        setActionError(t.deleteFailed);
        return;
      }
    } else {
      removeLocalReview(id);
    }
    setReviews(reviews.filter((item) => item.id !== id));
  };

  const saveEvent = async (updated: StudyEvent, chatUrl: string | null, chatChanged: boolean) => {
    if (remote) {
      const saved = await updateEvent(updated);
      if (!saved) return false;
      if (chatChanged && !(chatUrl ? await saveChatLink(updated.id, chatUrl) : await deleteChatLink(updated.id))) {
        return false;
      }
      setEvents((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
    } else {
      updateLocalEvent(updated);
      if (chatChanged) saveLocalChatLink(updated.id, chatUrl);
      setEvents((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    }
    setEditingEventId(null);
    return true;
  };

  // Эвент устгахад бүртгэл, групп чатын холбоос ч устана — тиймээс баталгаажуулна.
  const removeEvent = async (event: StudyEvent) => {
    const ok = await confirm({
      title: t.deleteEventTitle,
      message: t.confirmDeleteEvent(event.title),
      confirmLabel: t.delete,
      cancelLabel: t.cancel,
    });
    if (!ok) return;
    setEventError("");
    if (remote) {
      if (!(await deleteEvent(event.id))) {
        setEventError(t.deleteFailed);
        return;
      }
    } else {
      removeLocalEvent(event.id);
    }
    setEvents((prev) => prev.filter((item) => item.id !== event.id));
    setAttendees((prev) => prev.filter((attendee) => attendee.event_id !== event.id));
  };

  const spotName = (id: number) => spots.find((spot) => spot.id === id)?.name ?? `#${id}`;
  const editingSpot = editingSpotId === null ? null : spots.find((spot) => spot.id === editingSpotId) ?? null;
  const editingEvent = editingEventId === null ? null : events.find((event) => event.id === editingEventId) ?? null;
  // Шинэ нь эхэнд — удахгүй болох эвентүүд дээд талд.
  const sortedEvents = [...events].sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const pending = spots.filter((spot) => spot.status === "pending");

  // "Газрууд" табад зөвхөн зөвшөөрөгдсөн; татгалзсан нь "Хүлээгдэж буй" табын нуусан жагсаалтад.
  const published = spots.filter((spot) => spot.status !== "pending" && spot.status !== "rejected");
  const rejected = spots.filter((spot) => spot.status === "rejected");
  const tabs = [
    ["pending", t.tabPending, pending.length],
    ["places", t.tabPlaces, published.length],
    ["comments", t.tabReviews, reviews.length],
    ["events", t.tabEvents, events.length],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 sticky top-0 bg-slate-900/90 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center gap-3">
          <h1 className="font-bold">{t.adminTitle}</h1>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-slate-400 hover:text-white">
              {t.home}
            </Link>
            <LanguageSwitcher />
            <UserButton />
          </div>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <nav className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-800/60 border border-slate-800 w-fit max-w-full">
          {tabs.map(([id, label, count]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === id ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              {label}
              <span
                className={`min-w-5 px-1.5 rounded-full text-[10px] leading-5 ${
                  tab === id
                    ? "bg-white/20"
                    : id === "pending" && count > 0
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-700 text-slate-300"
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </nav>
        {actionError ? (
          <p role="alert" className="text-sm text-rose-300 bg-rose-950/60 border border-rose-800/50 rounded-xl px-4 py-3">
            {actionError}
          </p>
        ) : null}

        {tab === "pending" && (
          <section className="space-y-2">
            {pending.length === 0 ? (
              <p className="text-sm text-slate-500">{t.noPending}</p>
            ) : (
              pending.map((spot) =>
                (
                  <article key={spot.id} className={`${cardClass} px-4 py-3`}>
                    <SpotRow
                      spot={spot}
                      actions={
                        <>
                          <button onClick={() => setEditingSpotId(spot.id)} className={btnNeutral}>
                            ✏️ {t.edit}
                          </button>
                          <span className="w-px h-5 bg-slate-700 mx-1" aria-hidden="true" />
                          <button onClick={() => rejectSpot(spot)} className={btnReject}>
                            ✕ {t.reject}
                          </button>
                          <button onClick={() => acceptSpot(spot)} className={btnApprove}>
                            ✓ {t.approve}
                          </button>
                        </>
                      }
                    >
                      <h2 className="font-semibold text-white truncate">{spot.name}</h2>
                      <p className="text-xs text-slate-400 truncate">
                        {spot.location} · {spot.hours} · {spot.lat}, {spot.lng}
                      </p>
                      {spot.tags.length > 0 ? (
                        <p className="text-[11px] text-slate-500 truncate">🏷 {spot.tags.join(", ")}</p>
                      ) : null}
                    </SpotRow>
                  </article>
                )
              )
            )}

            {/* Татгалзсан газрууд — анхдагчаар хаалттай; эндээс дахин зөвшөөрөх эсвэл устгана. */}
            {rejected.length > 0 ? (
              <details className="group pt-4">
                <summary className="list-none cursor-pointer select-none inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/5 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 [&::-webkit-details-marker]:hidden">
                  <span aria-hidden="true" className="transition-transform group-open:rotate-90">
                    ▸
                  </span>
                  {t.rejectedPlaces(rejected.length)}
                </summary>
                <div className="mt-2 space-y-2">
                  {rejected.map((spot) =>
                    (
                      <article key={spot.id} className={`${cardClass} px-4 py-3 opacity-80 hover:opacity-100`}>
                        <SpotRow
                          spot={spot}
                          actions={
                            <>
                              <button onClick={() => setEditingSpotId(spot.id)} className={btnNeutral}>
                                ✏️ {t.edit}
                              </button>
                              <button onClick={() => returnToReview(spot)} className={btnNeutral}>
                                {t.backToReview}
                              </button>
                              <button onClick={() => acceptSpot(spot)} className={btnApprove}>
                                ✓ {t.approve}
                              </button>
                              {/* Устгахыг бусдаас зааглагчаар тусгаарлана. */}
                              <span className="w-px h-5 bg-slate-700 mx-2" aria-hidden="true" />
                              <button onClick={() => removeSpot(spot)} className={btnDelete}>
                                🗑 {t.delete}
                              </button>
                            </>
                          }
                        >
                          <h2 className="font-semibold text-white truncate">{spot.name}</h2>
                          <p className="text-xs text-slate-400 truncate">{spot.location}</p>
                        </SpotRow>
                      </article>
                    )
                  )}
                </div>
              </details>
            ) : null}
          </section>
        )}

        {tab === "places" && (
          <section className="space-y-2">
            {published.map((spot) =>
              (
                <article key={spot.id} className={`${cardClass} px-4 py-3`}>
                  <SpotRow
                    spot={spot}
                    actions={
                      <>
                        <button onClick={() => setEditingSpotId(spot.id)} className={btnNeutral}>
                          ✏️ {t.edit}
                        </button>
                        {/* Устгахыг засахаас зааглагчаар тусгаарлана. */}
                        <span className="w-px h-5 bg-slate-700 mx-2" aria-hidden="true" />
                        <button onClick={() => removeSpot(spot)} className={btnDelete}>
                          🗑 {t.delete}
                        </button>
                      </>
                    }
                  >
                    <h2 className="font-semibold text-white truncate">{spot.name}</h2>
                    <p className="text-xs text-slate-400 truncate">{spot.location}</p>
                  </SpotRow>
                </article>
              )
            )}
          </section>
        )}

        {tab === "comments" && (
          <section className="space-y-3">
            {reviews.length === 0 ? (
              <p className="text-sm text-slate-500">{t.noReviews}</p>
            ) : (
              reviews.map((review) => (
                <article key={review.id} className={`${cardClass} text-sm`}>
                  <div className="p-4 space-y-2">
                    <p className="text-xs text-indigo-300">
                      {spotName(review.spot_id)}
                      <span className="text-slate-400"> · {review.author_name ?? t.guest}</span>
                    </p>
                    <p className="font-semibold text-amber-400">
                      {"★".repeat(review.rating)}
                      <span className="text-slate-600">{"★".repeat(5 - review.rating)}</span>
                    </p>
                    <p className="text-slate-200 whitespace-pre-line">{review.comment}</p>
                    <ReviewScoreLine review={review} />
                  </div>
                  <div className={actionBar}>
                    <button onClick={() => setEditingReview(review)} className={btnNeutral}>
                      ✏️ {t.edit}
                    </button>
                    <button onClick={() => removeReview(review)} className={`${btnDelete} ml-auto`}>
                      🗑 {t.delete}
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        )}

        {tab === "events" && (
          <section className="space-y-3">
            {eventError ? <p className="text-sm text-rose-400">{eventError}</p> : null}
            {sortedEvents.length === 0 ? (
              <p className="text-sm text-slate-500">{t.noEventsAdmin}</p>
            ) : (
              sortedEvents.map((event) => {
                const going = attendees.filter((attendee) => attendee.event_id === event.id).length;
                const isPast = new Date(event.starts_at).getTime() < nowMs;
                return (
                  <article key={event.id} className={cardClass}>
                    <>
                      <div className="p-4 space-y-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <h2 className="font-semibold text-white">{event.title}</h2>
                          {isPast ? (
                            <span className="shrink-0 text-[10px] font-semibold bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                              {t.statusPast}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-indigo-300">{formatEventTime(event.starts_at, undefined, locale)}</p>
                        <p className="text-xs text-slate-400">
                          📍 {event.place_name} · {t.host} {event.host_name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {t.attending} {going}
                          {event.max_people !== null ? ` / ${event.max_people}` : ""}
                        </p>
                        {event.description ? (
                          <p className="text-xs text-slate-300 line-clamp-2 whitespace-pre-line pt-1">{event.description}</p>
                        ) : null}
                      </div>
                      <div className={actionBar}>
                        <button onClick={() => setEditingEventId(event.id)} className={btnNeutral}>
                          ✏️ {t.edit}
                        </button>
                        <button onClick={() => removeEvent(event)} className={`${btnDelete} ml-auto`}>
                          🗑 {t.delete}
                        </button>
                      </div>
                    </>
                  </article>
                );
              })
            )}
          </section>
        )}
      </div>
      {editingSpot ? (
        <AdminDialog title={t.editPlace} onClose={() => setEditingSpotId(null)}>
          <SpotEditForm key={editingSpot.id} spot={editingSpot} onSave={saveSpot} onCancel={() => setEditingSpotId(null)} />
        </AdminDialog>
      ) : null}
      {editingReview ? (
        <AdminDialog title={t.editReview} onClose={() => setEditingReview(null)}>
          <form onSubmit={saveReview} className="space-y-3 text-xs">
            <p className="text-indigo-300">
              {spotName(editingReview.spot_id)}
              <span className="text-slate-400"> · {editingReview.author_name ?? t.guest}</span>
            </p>
            <label className="block space-y-1">
              <span className="block text-slate-400">{t.ratingLabel} (1–5)</span>
              <input className={inputClass} type="number" min={1} max={5} value={editingReview.rating} onChange={(e) => setEditingReview({ ...editingReview, rating: Number(e.target.value) })} />
            </label>
            <ScoreFields value={editingReview} onChange={(scores) => setEditingReview({ ...editingReview, ...scores })} />
            <label className="block space-y-1">
              <span className="block text-slate-400">{t.tabReviews}</span>
              <textarea className={inputClass} rows={4} value={editingReview.comment} maxLength={LIMITS.reviewComment} onChange={(e) => setEditingReview({ ...editingReview, comment: e.target.value })} />
            </label>
            <div className="flex flex-wrap gap-2">
              <button className={`${btn} bg-indigo-600 hover:bg-indigo-500 text-white`}>{t.save}</button>
              <button type="button" onClick={() => setEditingReview(null)} className={btnNeutral}>{t.cancel}</button>
            </div>
          </form>
        </AdminDialog>
      ) : null}
      {editingEvent ? (
        <AdminDialog title={t.editEvent} onClose={() => setEditingEventId(null)}>
          <EventEditForm
            key={editingEvent.id}
            event={editingEvent}
            remote={remote}
            onSave={saveEvent}
            onCancel={() => setEditingEventId(null)}
          />
        </AdminDialog>
      ) : null}
      {confirmDialog}
    </main>
  );
}

// Засах маягтын цонх: гарчиг, ✕ нь дээрээ наалдана; Esc, гадна дарахад хаагдана. Утсан дээр бүтэн дэлгэц.
function AdminDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useI18n();
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

  return (
    <div
      className="fixed inset-0 z-[1200] bg-slate-950/80 backdrop-blur-sm flex items-stretch sm:items-center justify-center p-0 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
        className="relative w-full max-w-2xl bg-slate-900 sm:border border-slate-800 rounded-none sm:rounded-2xl shadow-2xl h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6"
      >
        <div className="sticky top-0 z-10 -mx-5 sm:-mx-6 mb-4 px-5 sm:px-6 pt-5 sm:pt-6 pb-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
          <h2 id="admin-dialog-title" className="font-bold text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="h-9 w-9 shrink-0 rounded-full bg-slate-800 text-slate-200 hover:text-white border border-slate-700"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Газрын нягт карт нэг мөрөнд: зүүн талд нэр, мэдээлэл; голд Google Maps, зураг харах; баруун талд товчнууд.
// Утсан дээр дээрээс доош. Зураг товч дарсны дараа л ачаалагдаж, мөрийн доор бүтэн өргөнөөр гарна.
function SpotRow({ spot, actions, children }: { spot: StudySpot; actions: ReactNode; children: ReactNode }) {
  const { t } = useI18n();
  const [shown, setShown] = useState(false);
  const photo = hasPhoto(spot.image);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 md:gap-4">
        <div className="min-w-0">{children}</div>
        <div className="flex items-center gap-2 text-xs md:justify-center">
          <a
            href={googleMapsUrl(spot)}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap px-2.5 py-1 rounded-full border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500"
          >
            📍 Google Maps ↗
          </a>
          {photo ? (
            <button
              type="button"
              aria-expanded={shown}
              onClick={() => setShown((value) => !value)}
              className={`whitespace-nowrap px-2.5 py-1 rounded-full border font-semibold transition-colors ${
                shown
                  ? "bg-sky-500 border-sky-400 text-white"
                  : "bg-sky-500/10 border-sky-500/50 text-sky-300 hover:bg-sky-500/20"
              }`}
            >
              {shown ? t.hidePhotoButton : t.photoButton}
            </button>
          ) : (
            <span className="whitespace-nowrap px-2.5 py-1 rounded-full border border-dashed border-slate-700 text-slate-500">
              {t.noPhoto}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">{actions}</div>
      </div>
      {photo && shown ? (
        <a href={spot.image} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={spot.image}
            alt={spot.name}
            className="max-h-72 w-full max-w-lg object-cover rounded-xl border border-slate-700"
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
  const { t, locale } = useI18n();
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
      setError(t.onlyImages);
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(t.imageTooBig);
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
        console.error("Image upload:", err);
        setError(t.imageUploadFailed);
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
      setError(t.saveFailed);
      setSaving(false);
    }
  };

  const shownImage = preview || (hasPhoto(draft.image) ? draft.image : "");

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
      <input className={inputClass} required placeholder={t.namePlaceholder} value={draft.name} maxLength={LIMITS.spotName} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      <input className={inputClass} required placeholder={t.locationPlaceholderShort} value={draft.location} maxLength={LIMITS.spotLocation} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
      <input className={inputClass} placeholder={t.openingHours} value={draft.hours} maxLength={LIMITS.spotHours} onChange={(e) => setDraft({ ...draft, hours: e.target.value })} />
      <input className={inputClass} placeholder={t.tagsCommaPlaceholder} value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
      <input className={inputClass} type="number" step="any" required value={draft.lat} onChange={(e) => setDraft({ ...draft, lat: Number(e.target.value) })} />
      <input className={inputClass} type="number" step="any" required value={draft.lng} onChange={(e) => setDraft({ ...draft, lng: Number(e.target.value) })} />
      <input className={`${inputClass} sm:col-span-2`} type="url" placeholder={t.mapsLink} value={draft.maps_url ?? ""} maxLength={LIMITS.url} onChange={(e) => setDraft({ ...draft, maps_url: e.target.value })} />
      <select
        className={`${inputClass} sm:col-span-2`}
        value={draft.category ?? ""}
        onChange={(e) => setDraft({ ...draft, category: (e.target.value || undefined) as SpotCategory | undefined })}
      >
        <option value="">{t.noCategory}</option>
        {SPOT_CATEGORIES.map((category) => (
          <option key={category.key} value={category.key}>
            {category.icon} {category.label[locale]}
          </option>
        ))}
      </select>
      <textarea
        className={`${inputClass} sm:col-span-2 resize-none`}
        rows={3}
        placeholder={t.shortDescription}
        value={draft.description ?? ""} maxLength={LIMITS.spotDescription}
        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
      />
      <div className="sm:col-span-2 space-y-2">
        <label className="block text-slate-400">{t.amenities}</label>
        <OptionPicker options={AMENITIES} value={draft.amenities ?? []} onChange={(amenities) => setDraft({ ...draft, amenities })} />
      </div>
      <div className="sm:col-span-2 space-y-2">
        <label className="block text-slate-400">{t.accessibility}</label>
        <OptionPicker options={ACCESSIBILITY} value={draft.accessibility ?? []} onChange={(accessibility) => setDraft({ ...draft, accessibility })} />
      </div>
      <fieldset className="sm:col-span-2 space-y-2 border border-slate-800 rounded-xl p-3">
        <legend className="px-1 text-slate-400">{t.initialRatings}</legend>
        <ScoreFields
          value={draft}
          onChange={(scores) =>
            setDraft({
              ...draft,
              wifi_mbps: scores.wifi_mbps ?? undefined,
              quiet_rating: scores.quiet_rating ?? undefined,
              outlet_rating: scores.outlet_rating ?? undefined,
            })
          }
        />
      </fieldset>

      <div className="sm:col-span-2 space-y-2">
        <label className="block text-slate-400">{t.photo}</label>
        {shownImage ? (
          <img src={shownImage} alt={draft.name} className="max-h-48 w-full max-w-md object-cover rounded-lg border border-slate-700" />
        ) : (
          <span className="inline-block px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400">
            {t.noPhoto}
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
            placeholder={t.imageUrl}
            value={hasPhoto(draft.image) ? draft.image : ""}
            onChange={(e) => setDraft({ ...draft, image: e.target.value })}
          />
        )}
        {shownImage ? (
          <button type="button" onClick={removePhoto} className="px-3 py-1.5 rounded-lg bg-rose-900/70">
            {t.removePhoto}
          </button>
        ) : null}
      </div>

      {error ? <p className="sm:col-span-2 text-rose-400">{error}</p> : null}
      <div className="sm:col-span-2 flex gap-2">
        <button disabled={saving} className="px-3 py-1.5 rounded-lg bg-indigo-600 disabled:opacity-60">
          {saving ? (imageFile ? t.uploadingImage : t.saving) : t.save}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className="px-3 py-1.5 rounded-lg bg-slate-700">
          {t.cancel}
        </button>
      </div>
    </form>
  );
}

// datetime-local талбарт хөтчийн цагийн бүсээр харуулна.
function toLocalInput(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Админы эвент засах маягт: үндсэн мэдээлэл ба групп чатын холбоос.
function EventEditForm({
  event,
  remote,
  onSave,
  onCancel,
}: {
  event: StudyEvent;
  remote: boolean;
  onSave: (event: StudyEvent, chatUrl: string | null, chatChanged: boolean) => Promise<boolean>;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState({
    title: event.title,
    place_name: event.place_name,
    startsAt: toLocalInput(event.starts_at),
    maxPeople: event.max_people === null ? "" : String(event.max_people),
    description: event.description,
  });
  // undefined — ачаалж байна; холбоосыг ачаалсны дараа л засварлана.
  const [originalChat, setOriginalChat] = useState<string | null | undefined>(undefined);
  const [chatUrl, setChatUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const value = remote ? await fetchChatLink(event.id) : loadLocalChatLink(event.id);
      if (cancelled) return;
      setOriginalChat(value ?? null);
      setChatUrl(value ?? "");
    })();
    return () => {
      cancelled = true;
    };
  }, [event.id, remote]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const normalized = chatUrl.trim() ? normalizeChatUrl(chatUrl) : null;
    if (chatUrl.trim() && !normalized) {
      setError(t.chatLinkInvalid);
      return;
    }
    setSaving(true);
    setError("");
    const ok = await onSave(
      {
        ...event,
        title: draft.title.trim(),
        place_name: draft.place_name.trim(),
        starts_at: new Date(draft.startsAt).toISOString(),
        max_people: draft.maxPeople ? Number(draft.maxPeople) : null,
        description: draft.description.trim(),
      },
      normalized,
      originalChat !== undefined && normalized !== originalChat
    );
    if (!ok) {
      setError(t.saveFailed);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
      <label className="space-y-1 sm:col-span-2">
        <span className="block text-slate-400">{t.eventTitle}</span>
        <input className={inputClass} required value={draft.title} maxLength={LIMITS.eventTitle} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
      </label>
      <label className="space-y-1">
        <span className="block text-slate-400">{t.placeName}</span>
        <input className={inputClass} required value={draft.place_name} maxLength={LIMITS.placeName} onChange={(e) => setDraft({ ...draft, place_name: e.target.value })} />
      </label>
      <label className="space-y-1">
        <span className="block text-slate-400">{t.dateTime}</span>
        <input className={inputClass} type="datetime-local" required value={draft.startsAt} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })} />
      </label>
      <label className="space-y-1">
        <span className="block text-slate-400">{t.maxPeople}</span>
        <input className={inputClass} type="number" min={1} placeholder={t.unlimited} value={draft.maxPeople} max={LIMITS.maxPeople} onChange={(e) => setDraft({ ...draft, maxPeople: e.target.value })} />
      </label>
      <label className="space-y-1">
        <span className="block text-slate-400">{t.chatLinkLabel}</span>
        <input
          className={inputClass}
          type="url"
          inputMode="url"
          placeholder={originalChat === undefined ? t.loading : t.chatLinkPlaceholder}
          disabled={originalChat === undefined}
          value={chatUrl}
          onChange={(e) => setChatUrl(e.target.value)}
        />
      </label>
      <label className="space-y-1 sm:col-span-2">
        <span className="block text-slate-400">{t.eventDetails}</span>
        <textarea className={`${inputClass} resize-none`} rows={3} value={draft.description} maxLength={LIMITS.eventDescription} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
      </label>
      {error ? <p className="sm:col-span-2 text-rose-400">{error}</p> : null}
      <div className="sm:col-span-2 flex flex-wrap gap-2">
        <button disabled={saving} className="px-3 py-1.5 rounded-lg bg-indigo-600 disabled:opacity-60">
          {saving ? t.saving : t.save}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className="px-3 py-1.5 rounded-lg bg-slate-700">
          {t.cancel}
        </button>
      </div>
    </form>
  );
}
