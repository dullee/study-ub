"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { EventAttendee, googleMapsUrl, StudyEvent } from "@/types";
import { formatEventTime } from "@/lib/format";
import { useI18n } from "@/components/LanguageProvider";
import GoogleMapsIcon from "@/components/GoogleMapsIcon";
import { MapPin } from "lucide-react";

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
  // Clerk ачаалагдаж дуусаагүй үед дарвал нэвтэрсэн хэрэглэгч ч "нэвтрээгүй" мэт болж юу ч болохгүй байсан.
  const { isLoaded: authReady } = useAuth();

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
      className={`relative bg-panel border border-line rounded-md p-4 flex flex-col gap-3 shadow-lift cursor-pointer has-focus-visible:ring-2 has-focus-visible:ring-azure ${
        isPast ? "opacity-60" : "hover:border-line-strong transition-all"
      }`}
    >
      <div className="flex justify-between items-start gap-3">
        <h3 className="font-bold text-ink text-base">
          {event.title}
          {isHost ? (
            <span className="ml-2 align-middle text-[10px] font-semibold bg-azure-soft text-link px-1.5 py-0.5 rounded">
              {t.yourEvent}
            </span>
          ) : null}
        </h3>
        <span className="shrink-0 text-[11px] font-semibold bg-sheet text-link px-2.5 py-1 rounded-md border border-line">
          {formatEventTime(event.starts_at, undefined, locale)}
        </span>
      </div>

      <div className="text-xs text-ink-muted space-y-1">
        <p className="flex items-center gap-1">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={2} /> {event.place_name}
          {hasCoords ? (
            <a
              href={googleMapsUrl({ lat: event.lat as number, lng: event.lng as number })}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 inline-flex items-center gap-1 text-link hover:text-link ml-1"
            >
              <GoogleMapsIcon className="h-3.5 w-3.5" />
              Google Maps
            </a>
          ) : null}
        </p>
        <p>{t.host} {event.host_name}</p>
      </div>

      {event.description ? (
        <p className="text-sm text-ink whitespace-pre-line line-clamp-3">{event.description}</p>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-ink-muted">
          {t.attending} {attendees.length}
          {event.max_people !== null ? ` / ${event.max_people}` : ""}
        </p>
        {attendees.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {attendees.map((attendee) => (
              <span
                key={attendee.id}
                className="text-[11px] bg-sheet border border-line text-ink-muted px-2 py-0.5 rounded-md"
              >
                {attendee.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-ink-muted">{t.noAttendees}</p>
        )}
      </div>

      <div className="mt-auto pt-1">
        {isPast ? (
          <p className="text-center text-xs text-ink-muted py-2">{t.pastEvent}</p>
        ) : isGoing ? (
          <button
            onClick={handleLeave}
            disabled={busy}
            className="relative z-10 w-full py-2 bg-ok-soft hover:bg-alert-soft text-good hover:text-danger border border-ok/30 text-xs font-semibold rounded-md transition-all border border-ok/40 disabled:opacity-60"
          >
            {t.youreGoing}
          </button>
        ) : (
          <button
            onClick={handleJoin}
            disabled={busy || isFull || !authReady}
            className="relative z-10 w-full py-2 bg-azure hover:bg-azure-deep text-white text-xs font-semibold rounded-md transition-all shadow-sheet disabled:opacity-50 disabled:shadow-none disabled:bg-panel"
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
        className="absolute inset-0 rounded-md focus:outline-none"
      />
    </article>
  );
}
