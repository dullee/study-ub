"use client";

import { useState } from "react";
import { EventAttendee, googleMapsUrl, StudyEvent } from "@/types";
import { formatEventTime } from "@/lib/format";
import { useI18n } from "@/components/LanguageProvider";

interface EventCardProps {
  event: StudyEvent;
  attendees: EventAttendee[];
  isGoing: boolean;
  isHost: boolean;
  isPast: boolean;
  onJoin: (event: StudyEvent) => Promise<void> | void;
  onLeave: (event: StudyEvent) => Promise<void> | void;
  // Карт дарахад дэлгэрэнгүй, групп чатын цонх нээнэ.
  onOpen: (event: StudyEvent) => void;
}

export default function EventCard({
  event,
  attendees,
  isGoing,
  isHost,
  isPast,
  onJoin,
  onLeave,
  onOpen,
}: EventCardProps) {
  const [busy, setBusy] = useState(false);

  const { t, locale } = useI18n();
  const isFull = event.max_people !== null && attendees.length >= event.max_people;
  const hasCoords = event.lat !== null && event.lng !== null;

  const handleJoin = async () => {
    setBusy(true);
    await onJoin(event);
    setBusy(false);
  };

  const handleLeave = async () => {
    setBusy(true);
    await onLeave(event);
    setBusy(false);
  };

  return (
    <article
      className={`relative bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 flex flex-col gap-3 shadow-lg cursor-pointer has-focus-visible:ring-2 has-focus-visible:ring-indigo-500 ${
        isPast ? "opacity-60" : "hover:border-slate-500 transition-all"
      }`}
    >
      <div className="flex justify-between items-start gap-3">
        <h3 className="font-bold text-white text-base">
          {event.title}
          {isHost ? (
            <span className="ml-2 align-middle text-[10px] font-semibold bg-indigo-600/30 text-indigo-200 px-1.5 py-0.5 rounded">
              {t.yourEvent}
            </span>
          ) : null}
        </h3>
        <span className="shrink-0 text-[11px] font-semibold bg-slate-900/90 text-indigo-400 px-2.5 py-1 rounded-lg border border-slate-700">
          {formatEventTime(event.starts_at, undefined, locale)}
        </span>
      </div>

      <div className="text-xs text-slate-400 space-y-1">
        <p className="flex items-center gap-1">
          📍 {event.place_name}
          {hasCoords ? (
            <a
              href={googleMapsUrl({ lat: event.lat as number, lng: event.lng as number })}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 text-indigo-300 hover:text-indigo-200 ml-1"
            >
              Google Maps ↗
            </a>
          ) : null}
        </p>
        <p>{t.host} {event.host_name}</p>
      </div>

      {event.description ? (
        <p className="text-sm text-slate-200 whitespace-pre-line line-clamp-3">{event.description}</p>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-300">
          {t.attending} {attendees.length}
          {event.max_people !== null ? ` / ${event.max_people}` : ""}
        </p>
        {attendees.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {attendees.map((attendee) => (
              <span
                key={attendee.id}
                className="text-[11px] bg-slate-900/80 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-md"
              >
                {attendee.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500">{t.noAttendees}</p>
        )}
      </div>

      <div className="mt-auto pt-1">
        {isPast ? (
          <p className="text-center text-xs text-slate-500 py-2">{t.pastEvent}</p>
        ) : isGoing ? (
          <button
            onClick={handleLeave}
            disabled={busy}
            className="relative z-10 w-full py-2 bg-emerald-900/40 hover:bg-slate-700 text-emerald-300 hover:text-white text-xs font-semibold rounded-xl transition-all border border-emerald-700/60 disabled:opacity-60"
          >
            {t.youreGoing}
          </button>
        ) : (
          <button
            onClick={handleJoin}
            disabled={busy || isFull}
            className="relative z-10 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:shadow-none disabled:bg-slate-700"
          >
            {isFull ? t.eventFull : t.imGoing}
          </button>
        )}
      </div>

      {/* Карт бүхэлдээ дарагдана — Google Maps холбоос, бүртгэлийн товч z-10-оор дээр нь. */}
      <button
        type="button"
        onClick={() => onOpen(event)}
        aria-label={t.openEvent(event.title)}
        className="absolute inset-0 rounded-2xl focus:outline-none"
      />
    </article>
  );
}
