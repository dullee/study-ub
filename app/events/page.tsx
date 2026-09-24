"use client";

import { useEffect, useMemo, useState } from "react";
import { EventAttendee, StudyEvent, StudySpot } from "@/types";
import { initialSpots } from "@/data/initialSpots";
import Header from "@/components/Header";
import EventCard from "@/components/EventCard";
import AddEventModal from "@/components/AddEventModal";
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
  loadMyName,
  loadMyRsvps,
  removeLocalAttendee,
  saveLocalAttendee,
  saveLocalEvent,
  saveMyName,
  saveMyRsvps,
} from "@/lib/localStore";

// Эхэлснээс хойш 3 цаг хүртэл идэвхтэй гэж үзнэ.
const ACTIVE_WINDOW_MS = 3 * 60 * 60 * 1000;

export default function EventsPage() {
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [spots, setSpots] = useState<StudySpot[]>(initialSpots);
  const [myRsvps, setMyRsvps] = useState<Record<string, number>>({});
  const [myName, setMyName] = useState("");
  const [usingRemote, setUsingRemote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setMyRsvps(loadMyRsvps());
      setMyName(loadMyName());
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

  const rememberName = (name: string) => {
    setMyName(name);
    saveMyName(name);
  };

  const rememberRsvp = (eventId: number, attendeeId: number | null) => {
    const next = { ...loadMyRsvps() };
    if (attendeeId === null) delete next[eventId];
    else next[eventId] = attendeeId;
    setMyRsvps(next);
    saveMyRsvps(next);
  };

  const addAttendee = async (eventId: number, name: string) => {
    const draft = { event_id: eventId, name };
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
    return attendee;
  };

  const handleAddEvent = async (draft: Omit<StudyEvent, "id" | "created_at">) => {
    let saved: StudyEvent | null = null;
    if (usingRemote) {
      saved = await insertEvent(draft);
    } else {
      saved = { ...draft, id: Date.now(), created_at: new Date().toISOString() };
      saveLocalEvent(saved);
    }
    if (!saved) return;
    const event = saved;
    setEvents((prev) => [...prev, event]);
    rememberName(event.host_name);
    // Зохион байгуулагч өөрөө автоматаар ирэх хүмүүсийн жагсаалтад орно.
    const host = await addAttendee(event.id, event.host_name);
    if (host) rememberRsvp(event.id, host.id);
  };

  const handleJoin = async (event: StudyEvent, name: string) => {
    if (myRsvps[event.id]) return;
    rememberName(name);
    const attendee = await addAttendee(event.id, name);
    if (attendee) rememberRsvp(event.id, attendee.id);
  };

  const handleLeave = async (event: StudyEvent) => {
    const attendeeId = myRsvps[event.id];
    if (!attendeeId) return;
    if (usingRemote) await deleteAttendee(attendeeId);
    else removeLocalAttendee(attendeeId);
    setAttendees((prev) => prev.filter((attendee) => attendee.id !== attendeeId));
    rememberRsvp(event.id, null);
  };

  const renderGrid = (list: StudyEvent[], isPast: boolean) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {list.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          attendees={attendeesFor(event.id)}
          isGoing={Boolean(myRsvps[event.id])}
          isPast={isPast}
          myName={myName}
          onJoin={handleJoin}
          onLeave={handleLeave}
        />
      ))}
    </div>
  );

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen font-sans pb-12">
      <Header onAddClick={() => setIsModalOpen(true)} addLabel="Эвент үүсгэх" />
      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-8">
        <section className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              📅 Удахгүй болох эвентүүд
            </h2>
            <span className="text-xs text-indigo-400 font-mono bg-indigo-950/60 border border-indigo-800/50 px-2.5 py-1 rounded-md">
              {upcoming.length} эвент
            </span>
          </div>
          {loading ? (
            <p className="text-center text-slate-500 py-12 text-sm">Ачаалж байна...</p>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-slate-500 text-sm">Одоогоор эвент алга. Хамт хичээллэх хүмүүсээ урь!</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold"
              >
                ➕ Эвент үүсгэх
              </button>
            </div>
          ) : (
            renderGrid(upcoming, false)
          )}
        </section>

        {past.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-500 border-b border-slate-800 pb-2">
              Өнгөрсөн эвентүүд
            </h2>
            {renderGrid(past, true)}
          </section>
        ) : null}
      </main>
      <AddEventModal
        isOpen={isModalOpen}
        spots={spots}
        defaultHostName={myName}
        onClose={() => setIsModalOpen(false)}
        onAddEvent={handleAddEvent}
      />
    </div>
  );
}
