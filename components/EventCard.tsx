"use client";

import { useState } from "react";
import { EventAttendee, googleMapsUrl, StudyEvent } from "@/types";
import { formatEventTime } from "@/lib/format";

interface EventCardProps {
  event: StudyEvent;
  attendees: EventAttendee[];
  isGoing: boolean;
  isHost: boolean;
  isPast: boolean;
  onJoin: (event: StudyEvent) => Promise<void> | void;
  onLeave: (event: StudyEvent) => Promise<void> | void;
}

export default function EventCard({
  event,
  attendees,
  isGoing,
  isHost,
  isPast,
  onJoin,
  onLeave,
}: EventCardProps) {
  const [busy, setBusy] = useState(false);

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
      className={`bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 flex flex-col gap-3 shadow-lg ${
        isPast ? "opacity-60" : "hover:border-slate-500 transition-all"
      }`}
    >
      <div className="flex justify-between items-start gap-3">
        <h3 className="font-bold text-white text-base">
          {event.title}
          {isHost ? (
            <span className="ml-2 align-middle text-[10px] font-semibold bg-indigo-600/30 text-indigo-200 px-1.5 py-0.5 rounded">
              Таны эвент
            </span>
          ) : null}
        </h3>
        <span className="shrink-0 text-[11px] font-semibold bg-slate-900/90 text-indigo-400 px-2.5 py-1 rounded-lg border border-slate-700">
          {formatEventTime(event.starts_at)}
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
              className="text-indigo-300 hover:text-indigo-200 ml-1"
            >
              Google Maps ↗
            </a>
          ) : null}
        </p>
        <p>🙋 Зохион байгуулагч: {event.host_name}</p>
      </div>

      {event.description ? (
        <p className="text-sm text-slate-200 whitespace-pre-line">{event.description}</p>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-300">
          👥 Ирэх хүмүүс: {attendees.length}
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
          <p className="text-[11px] text-slate-500">Одоогоор хэн ч бүртгүүлээгүй байна.</p>
        )}
      </div>

      <div className="mt-auto pt-1">
        {isPast ? (
          <p className="text-center text-xs text-slate-500 py-2">Өнгөрсөн эвент</p>
        ) : isGoing ? (
          <button
            onClick={handleLeave}
            disabled={busy}
            className="w-full py-2 bg-emerald-900/40 hover:bg-slate-700 text-emerald-300 hover:text-white text-xs font-semibold rounded-xl transition-all border border-emerald-700/60 disabled:opacity-60"
          >
            ✓ Та ирнэ гэж бүртгүүлсэн · Болих
          </button>
        ) : (
          <button
            onClick={handleJoin}
            disabled={busy || isFull}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:shadow-none disabled:bg-slate-700"
          >
            {isFull ? "Хүн дүүрсэн" : "✋ Би ирнэ"}
          </button>
        )}
      </div>
    </article>
  );
}
