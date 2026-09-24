"use client";

import { useEffect, useMemo, useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useI18n } from "@/components/LanguageProvider";
import { displayName, EventAttendee, StudyEvent, StudySpot } from "@/types";
import { initialSpots } from "@/data/initialSpots";
import Header from "@/components/Header";
import EventCard from "@/components/EventCard";
import AddEventModal, { EventDraft } from "@/components/AddEventModal";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchSpots } from "@/lib/supabase/spots";
import {
  deleteAttendee,
  fetchAttendees,
  fetchEvents,
  insertAttendee,
  insertEvent,
} from "@/lib/supabase/events";
import {
  loadLocalAttendees,
  loadLocalEvents,
  loadLocalSpots,
  removeLocalAttendee,
  saveLocalAttendee,
  saveLocalEvent,
} from "@/lib/localStore";

// Эхэлснээс хойш 3 цаг хүртэл идэвхтэй гэж үзнэ.
const ACTIVE_WINDOW_MS = 3 * 60 * 60 * 1000;

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
  const { user } = useUser();
  const { openSignIn } = useClerk();

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
      setEvents(loadLocalEvents());
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

  const addAttendee = async (eventId: number) => {
    if (!user) return null;
    const draft = { event_id: eventId, name: displayName(user), user_id: user.id };
    let saved: EventAttendee | null = null;
    if (usingRemote) {
      saved = await insertAttendee(draft);
    } else {
      saved = { ...draft, id: Date.now(), created_at: new Date().toISOString() };
      saveLocalAttendee(saved);
    }
    if (!saved) return null;
    const attendee = saved;
    setAttendees((prev) => [...prev, attendee]);
    if (usingRemote) sendRsvpEmail(eventId);
    return attendee;
  };

  const handleAddClick = () => {
    if (user) setIsModalOpen(true);
    else openSignIn();
  };

  const handleAddEvent = async (draft: EventDraft) => {
    if (!user) return false;
    const full = { ...draft, host_name: displayName(user), user_id: user.id };
    let saved: StudyEvent | null = null;
    if (usingRemote) {
      saved = await insertEvent(full);
    } else {
      saved = { ...full, id: Date.now(), created_at: new Date().toISOString() };
      saveLocalEvent(saved);
    }
    if (!saved) return false;
    const event = saved;
    setEvents((prev) => [...prev, event]);
    // Зохион байгуулагч өөрөө автоматаар ирэх хүмүүсийн жагсаалтад орно.
    await addAttendee(event.id);
    return true;
  };

  const handleJoin = async (event: StudyEvent) => {
    if (!user) {
      openSignIn();
      return;
    }
    if (myAttendance(event.id)) return;
    setNotice(null);
    const attendee = await addAttendee(event.id);
    if (!attendee) setNotice({ text: t.rsvpSaveFailed, error: true });
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
        <section className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              {t.upcomingEvents}
            </h2>
            <span className="text-xs text-indigo-400 font-mono bg-indigo-950/60 border border-indigo-800/50 px-2.5 py-1 rounded-md">
              {t.eventCount(upcoming.length)}
            </span>
          </div>
          {loading ? (
            <p className="text-center text-slate-500 py-12 text-sm">{t.loading}</p>
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
            renderGrid(upcoming, false)
          )}
        </section>

        {past.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-500 border-b border-slate-800 pb-2">
              {t.pastEvents}
            </h2>
            {renderGrid(past, true)}
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
    </div>
  );
}
