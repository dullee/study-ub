"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useI18n } from "@/components/LanguageProvider";
import { displayName, EventAttendee, StudyEvent, StudySpot } from "@/types";
import { initialSpots } from "@/data/initialSpots";
import Header from "@/components/Header";
import EventCard from "@/components/EventCard";
import EventDetailDialog from "@/components/EventDetailDialog";
import AddEventModal, { EventDraft } from "@/components/AddEventModal";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchSpots } from "@/lib/supabase/spots";
import {
  deleteAttendee,
  fetchAttendees,
  fetchEvents,
  insertAttendee,
  insertEvent,
  JoinError,
  saveChatLink,
} from "@/lib/supabase/events";
import {
  loadLocalAttendees,
  loadLocalEvents,
  loadLocalSpots,
  removeLocalAttendee,
  saveLocalAttendee,
  saveLocalChatLink,
  saveLocalEvent,
} from "@/lib/localStore";

// Эхэлснээс хойш 3 цаг хүртэл идэвхтэй гэж үзнэ.
const ACTIVE_WINDOW_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Огнооны шүүлтүүр: удахгүй болох эвентүүдэд хэрэглэгдэнэ.
type When = "all" | "today" | "week" | "month";
const WHEN_OPTIONS = [
  ["all", "whenAll"],
  ["today", "whenToday"],
  ["week", "whenWeek"],
  ["month", "whenMonth"],
] as const;

const chipClass = (active: boolean) =>
  `px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
    active
      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
  }`;

export default function EventsPage() {
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [spots, setSpots] = useState<StudySpot[]>(initialSpots);
  const [usingRemote, setUsingRemote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const { t } = useI18n();
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const { user, isLoaded: authReady } = useUser();
  const { openSignIn } = useClerk();
  const [query, setQuery] = useState("");
  const [when, setWhen] = useState<When>("all");
  const [onlyMine, setOnlyMine] = useState(false);
  const [hasSpots, setHasSpots] = useState(false);
  const [openEventId, setOpenEventId] = useState<number | null>(null);
  const closeEvent = useCallback(() => setOpenEventId(null), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setNow(Date.now());
      if (isSupabaseConfigured) {
        const [remoteEvents, remoteAttendees, remoteSpots] = await Promise.all([
          fetchEvents(),
          fetchAttendees(),
          fetchSpots(),
        ]);
        if (!cancelled && remoteEvents && remoteAttendees) {
          setEvents(remoteEvents);
          setAttendees(remoteAttendees);
          if (remoteSpots && remoteSpots.length > 0) setSpots(remoteSpots);
          setUsingRemote(true);
          setLoading(false);
          return;
        }
      }
      if (cancelled) return;
      setEvents(loadLocalEvents().filter((event) => (event.status ?? "approved") === "approved"));
      setAttendees(loadLocalAttendees());
      const local = loadLocalSpots().filter((spot) => spot.status === "approved");
      if (local.length > 0) setSpots(local);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const { upcoming, past } = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    const cutoff = now - ACTIVE_WINDOW_MS;
    return {
      upcoming: sorted.filter((event) => new Date(event.starts_at).getTime() >= cutoff),
      past: sorted.filter((event) => new Date(event.starts_at).getTime() < cutoff).reverse(),
    };
  }, [events, now]);

  const attendeesFor = (eventId: number) =>
    attendees.filter((attendee) => attendee.event_id === eventId);

  const myAttendance = (eventId: number) =>
    user ? attendees.find((a) => a.event_id === eventId && a.user_id === user.id) : undefined;

  // Хайлт: гарчиг, газар, зохион байгуулагч, тайлбараар. Огнооны шүүлтүүр зөвхөн удахгүй болох эвентэд.
  const filtersActive = query.trim() !== "" || when !== "all" || onlyMine || hasSpots;
  const matches = (event: StudyEvent) => {
    const q = query.trim().toLowerCase();
    if (q) {
      const haystack = [event.title, event.place_name, event.host_name, event.description].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (onlyMine && !myAttendance(event.id)) return false;
    if (hasSpots && event.max_people !== null && attendeesFor(event.id).length >= event.max_people) return false;
    return true;
  };
  const withinWhen = (event: StudyEvent) => {
    if (when === "all") return true;
    const start = new Date(event.starts_at).getTime();
    if (when === "today") {
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);
      return start <= endOfToday.getTime();
    }
    return start <= now + (when === "week" ? 7 : 30) * DAY_MS;
  };
  const shownUpcoming = upcoming.filter((event) => matches(event) && withinWhen(event));
  // Огнооны шүүлтүүр ирээдүйг хардаг тул сонгосон үед өнгөрсөн эвентийг нууна.
  const shownPast = when === "all" ? past.filter(matches) : [];

  const clearFilters = () => {
    setQuery("");
    setWhen("all");
    setOnlyMine(false);
    setHasSpots(false);
  };

  const openEvent = openEventId === null ? null : events.find((event) => event.id === openEventId) ?? null;
  const openEventIsPast =
    openEvent !== null && new Date(openEvent.starts_at).getTime() < now - ACTIVE_WINDOW_MS;

  // Имэйл нь бүртгэлийг хаахгүй: алдаа гарсан ч "Би ирнэ" хадгалагдсан хэвээр.
  const sendRsvpEmail = async (eventId: number) => {
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, { method: "POST" });
      const body = await res.json();
      if (body.sent) {
        setNotice({ text: t.rsvpEmailSent });
      } else if (!res.ok) {
        setNotice({ text: t.rsvpEmailFailed, error: true });
      }
    } catch {
      setNotice({ text: t.rsvpEmailFailed, error: true });
    }
  };

  const addAttendee = async (eventId: number): Promise<EventAttendee | JoinError> => {
    if (!user) return "failed";
    const draft = { event_id: eventId, name: displayName(user), user_id: user.id };
    let saved: EventAttendee | JoinError;
    if (usingRemote) {
      saved = await insertAttendee(draft);
    } else {
      saved = { ...draft, id: Date.now(), created_at: new Date().toISOString() };
      saveLocalAttendee(saved);
    }
    if (typeof saved === "string") return saved;
    const attendee = saved;
    setAttendees((prev) => [...prev, attendee]);
    if (usingRemote) sendRsvpEmail(eventId);
    return attendee;
  };

  const handleAddClick = () => {
    if (user) setIsModalOpen(true);
    else openSignIn();
  };

  const handleAddEvent = async (draft: EventDraft, chatUrl: string | null) => {
    if (!user) return false;
    const full = { ...draft, host_name: displayName(user), user_id: user.id, status: "pending" as const };
    let saved: StudyEvent | null = null;
    if (usingRemote) {
      saved = await insertEvent(full);
    } else {
      saved = { ...full, id: Date.now(), created_at: new Date().toISOString() };
      saveLocalEvent(saved);
    }
    if (!saved) return false;
    // Хүлээгдэж буй эвентийг нийтийн жагсаалтад нэмэхгүй — админ зөвшөөрнө.
    if (chatUrl) {
      if (usingRemote) await saveChatLink(saved.id, chatUrl);
      else saveLocalChatLink(saved.id, chatUrl);
    }
    setNotice({ text: t.eventSubmitted });
    return true;
  };

  const handleJoin = async (event: StudyEvent) => {
    if (!authReady) return;
    if (!user) {
      openSignIn();
      return;
    }
    if (myAttendance(event.id)) return;
    setNotice(null);
    const result = await addAttendee(event.id);
    if (typeof result !== "string") return;
    setNotice({
      text: result === "event_full" ? t.joinFull : result === "event_ended" ? t.joinEnded : t.rsvpSaveFailed,
      error: true,
    });
    // Өөр хүн сүүлийн суудлыг авсан бол жинхэнэ тоог харуулна.
    if (result === "event_full" && usingRemote) {
      const fresh = await fetchAttendees();
      if (fresh) setAttendees(fresh);
    }
  };

  const handleLeave = async (event: StudyEvent) => {
    const attendance = myAttendance(event.id);
    if (!attendance) return;
    setNotice(null);
    if (usingRemote) {
      if (!(await deleteAttendee(attendance.id))) {
        setNotice({ text: t.rsvpCancelFailed, error: true });
        return;
      }
    } else {
      removeLocalAttendee(attendance.id);
    }
    setAttendees((prev) => prev.filter((attendee) => attendee.id !== attendance.id));
  };

  const renderGrid = (list: StudyEvent[], isPast: boolean) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {list.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          attendees={attendeesFor(event.id)}
          isGoing={Boolean(myAttendance(event.id))}
          isHost={Boolean(user && event.user_id === user.id)}
          isPast={isPast}
          onJoin={handleJoin}
          onLeave={handleLeave}
          onOpen={(opened) => setOpenEventId(opened.id)}
        />
      ))}
    </div>
  );

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen font-sans pb-12">
      <Header onAddClick={handleAddClick} addLabel={t.createEvent} />
      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-8">
        {notice ? (
          <p
            className={`text-sm rounded-xl px-4 py-3 border ${
              notice.error
                ? "text-rose-200 bg-rose-950/60 border-rose-800/50"
                : "text-indigo-200 bg-indigo-950/60 border-indigo-800/50"
            }`}
          >
            {notice.text}
          </p>
        ) : null}
        <section aria-label={t.filterBarLabel} className="space-y-3 bg-slate-800/40 p-3 sm:p-4 rounded-2xl border border-slate-800">
          <div className="relative">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.eventsSearchPlaceholder}
              aria-label={t.eventsSearchLabel}
              className="w-full h-10 bg-slate-800 border border-slate-700 text-white placeholder-slate-400 pl-10 pr-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm" aria-hidden="true">
              🔍
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {WHEN_OPTIONS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={when === value}
                onClick={() => setWhen(value)}
                className={chipClass(when === value)}
              >
                {t[label]}
              </button>
            ))}
            <span className="hidden sm:block w-px h-5 bg-slate-700 mx-1" aria-hidden="true" />
            <button
              type="button"
              aria-pressed={onlyMine}
              disabled={!user}
              onClick={() => setOnlyMine(!onlyMine)}
              className={chipClass(onlyMine)}
            >
              ✋ {t.onlyMine}
            </button>
            <button type="button" aria-pressed={hasSpots} onClick={() => setHasSpots(!hasSpots)} className={chipClass(hasSpots)}>
              🪑 {t.hasSpots}
            </button>
            {filtersActive ? (
              <button type="button" onClick={clearFilters} className="text-xs text-indigo-300 hover:text-white ml-auto">
                {t.clearFilters}
              </button>
            ) : null}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              {t.upcomingEvents}
            </h2>
            <span className="text-xs text-indigo-400 font-mono bg-indigo-950/60 border border-indigo-800/50 px-2.5 py-1 rounded-md">
              {t.eventCount(shownUpcoming.length)}
            </span>
          </div>
          {loading ? (
            <p className="text-center text-slate-500 py-12 text-sm">{t.loading}</p>
          ) : upcoming.length > 0 && shownUpcoming.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-slate-500 text-sm">{t.noEventsMatch}</p>
              <button type="button" onClick={clearFilters} className="text-xs text-indigo-300 hover:text-white">
                {t.clearFilters}
              </button>
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-slate-500 text-sm">{t.noEvents}</p>
              <button
                onClick={handleAddClick}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold"
              >
                {t.createEventButton}
              </button>
            </div>
          ) : (
            renderGrid(shownUpcoming, false)
          )}
        </section>

        {shownPast.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-500 border-b border-slate-800 pb-2">
              {t.pastEvents}
            </h2>
            {renderGrid(shownPast, true)}
          </section>
        ) : null}
      </main>
      <AddEventModal
        isOpen={isModalOpen}
        spots={spots}
        hostName={user ? displayName(user) : ""}
        onClose={() => setIsModalOpen(false)}
        onAddEvent={handleAddEvent}
      />
      {openEvent ? (
        <EventDetailDialog
          event={openEvent}
          attendees={attendeesFor(openEvent.id)}
          isGoing={Boolean(myAttendance(openEvent.id))}
          isHost={Boolean(user && openEvent.user_id === user.id)}
          isPast={openEventIsPast}
          usingRemote={usingRemote}
          onJoin={handleJoin}
          onLeave={handleLeave}
          onClose={closeEvent}
        />
      ) : null}
    </div>
  );
}
