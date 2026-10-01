"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { EventAttendee, googleMapsUrl, StudyEvent } from "@/types";
import { formatEventTime } from "@/lib/format";
import { useI18n } from "@/components/LanguageProvider";
import GoogleMapsIcon from "@/components/GoogleMapsIcon";
import EventChatLink from "@/components/EventChatLink";
import EventPhone from "@/components/EventPhone";
import { MapPin, X } from "lucide-react";

interface EventDetailDialogProps {
  event: StudyEvent;
  attendees: EventAttendee[];
  isGoing: boolean;
  isHost: boolean;
  isPast: boolean;
  usingRemote: boolean;
  onJoin: (event: StudyEvent) => Promise<void> | void;
  onLeave: (event: StudyEvent) => Promise<void> | void;
  onClose: () => void;
}

// Эвентийн карт дарахад нээгдэнэ: бүх мэдээлэл, бүртгэл, групп чатын холбоос.
export default function EventDetailDialog({
  event,
  attendees,
  isGoing,
  isHost,
  isPast,
  usingRemote,
  onJoin,
  onLeave,
  onClose,
}: EventDetailDialogProps) {
  const { t, locale } = useI18n();
  const [busy, setBusy] = useState(false);
  // Clerk ачаалагдаж дуусаагүй үед дарвал нэвтэрсэн хэрэглэгч ч "нэвтрээгүй" мэт болж юу ч болохгүй байсан.
  const { isLoaded: authReady } = useAuth();
  const isFull = event.max_people !== null && attendees.length >= event.max_people;
  const hasCoords = event.lat !== null && event.lng !== null;

  // Esc дарахад хаагдаж, ард талын хуудас гүйлгэгдэхгүй.
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

  const run = async (action: (event: StudyEvent) => Promise<void> | void) => {
    setBusy(true);
    await action(event);
    setBusy(false);
  };

  return (
    <div
      className="fixed inset-0 bg-night/55 z-[1100] flex items-stretch sm:items-center justify-center p-0 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-dialog-title"
        className="relative bg-sheet sm:border border-line w-full max-w-xl rounded-none sm:rounded-md shadow-dialog h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[92vh] overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6 space-y-5"
      >
        <div className="sticky top-0 z-10 -mx-5 sm:-mx-6 px-5 sm:px-6 pt-5 sm:pt-6 pb-3 bg-sheet border-b border-line flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <span className="inline-block text-[11px] font-semibold bg-panel text-link px-2.5 py-1 rounded-md border border-line">
              {formatEventTime(event.starts_at, undefined, locale)}
            </span>
            <h2 id="event-dialog-title" className="text-xl font-bold text-ink">
              {event.title}
              {isHost ? (
                <span className="ml-2 align-middle text-[10px] font-semibold bg-azure-soft text-link px-1.5 py-0.5 rounded">
                  {t.yourEvent}
                </span>
              ) : null}
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label={t.close}
            className="flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-panel text-ink hover:bg-line transition-colors"
          >
            <X aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>

        <div className="space-y-5">
          <div className="text-sm text-ink-muted space-y-1.5">
            <p>
              <MapPin aria-hidden="true" className="h-4 w-4 inline -mt-0.5 mr-1" strokeWidth={2} />{event.place_name}
              {hasCoords ? (
                <a
                  href={googleMapsUrl({ lat: event.lat as number, lng: event.lng as number })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 align-middle text-link hover:text-link ml-2 text-xs"
                >
                  <GoogleMapsIcon className="h-3.5 w-3.5" />
                  Google Maps
                </a>
              ) : null}
            </p>
            <p>
              {t.host} {event.host_name}
            </p>
          </div>

          {event.description ? (
            <p className="text-sm text-ink whitespace-pre-line">{event.description}</p>
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
                    className="text-[11px] bg-panel border border-line text-ink-muted px-2 py-0.5 rounded-md"
                  >
                    {attendee.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-ink-muted">{t.noAttendees}</p>
            )}
          </div>

          {isPast ? (
            <p className="text-center text-xs text-ink-muted py-2">{t.pastEvent}</p>
          ) : isGoing ? (
            <button
              onClick={() => run(onLeave)}
              disabled={busy}
              className="w-full py-2.5 bg-ok-soft hover:bg-alert-soft text-good hover:text-danger border border-ok/30 text-sm font-semibold rounded-md transition-all border border-ok/40 disabled:opacity-60"
            >
              {t.youreGoing}
            </button>
          ) : (
            <button
              onClick={() => run(onJoin)}
              disabled={busy || isFull || !authReady}
              className="w-full py-2.5 bg-azure hover:bg-azure-deep text-white text-sm font-semibold rounded-md transition-all shadow-sheet disabled:opacity-50 disabled:shadow-none disabled:bg-panel"
            >
              {isFull ? t.eventFull : t.imGoing}
            </button>
          )}

          <EventChatLink event={event} isMember={isGoing || isHost} isHost={isHost} usingRemote={usingRemote} />
          <EventPhone event={event} isMember={isGoing || isHost} isHost={isHost} usingRemote={usingRemote} />
        </div>
      </div>
    </div>
  );
}
