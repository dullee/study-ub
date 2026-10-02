"use client";

import { ReactNode, useEffect } from "react";
import SmartImage from "@/components/SmartImage";
import { PLACEHOLDER_IMAGE, spotCategory, SpotStatus, StudyEvent, StudySpot } from "@/types";
import { useI18n } from "@/components/LanguageProvider";
import { formatEventTime } from "@/lib/format";
import { CalendarDays, MapPin, X } from "lucide-react";
import KeyIcon from "@/components/KeyIcon";

// Эвентийн хуудсанд events, бусад хуудсанд spots дамжуулна.
type MySubmissionsDialogProps = { onClose: () => void } & (
  | { spots: StudySpot[]; events?: undefined }
  | { events: StudyEvent[]; spots?: undefined }
);

const byRejectedLast = <T extends { status?: SpotStatus }>(items: T[]) =>
  [...items].sort((a, b) => Number(a.status === "rejected") - Number(b.status === "rejected"));

// Хэрэглэгчийн илгээсэн, хараахан нийтлэгдээгүй газрууд эсвэл эвентүүд: хүлээгдэж буй нь эхэнд, зөвшөөрөгдөөгүй нь доор.
export default function MySubmissionsDialog({ spots, events, onClose }: MySubmissionsDialogProps) {
  const { t, locale } = useI18n();

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

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "en-CA", { dateStyle: "medium" }) : null;

  const renderRow = (
    id: number,
    status: SpotStatus | undefined,
    createdAt: string | undefined,
    thumb: ReactNode,
    body: ReactNode
  ) => {
    const rejected = status === "rejected";
    const date = formatDate(createdAt);
    return (
      <li
        key={id}
        className={`flex gap-3 items-center rounded-md border border-line bg-panel p-2.5 ${
          rejected ? "opacity-70" : ""
        }`}
      >
        {thumb}
        <div className="min-w-0 flex-1">
          {body}
          {date ? <p className="text-[11px] text-ink-muted">{t.submittedOn(date)}</p> : null}
        </div>
        <span
          className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
            rejected
              ? "bg-alert-soft border-alert/40 text-danger"
              : "bg-sun-soft border-sun/40 text-sun-deep"
          }`}
        >
          {rejected ? t.statusNotApproved : t.statusPending}
        </span>
      </li>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[1100] bg-night/55 flex items-stretch sm:items-center justify-center p-0 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="my-submissions-title"
        className="relative w-full max-w-lg bg-sheet sm:border border-line rounded-none sm:rounded-md shadow-dialog h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[85vh] overflow-y-auto px-5 pb-5"
      >
        <div className="sticky top-0 z-10 -mx-5 mb-4 px-5 pt-5 pb-3 bg-sheet border-b border-line flex items-start justify-between gap-3">
          <div>
            <h2 id="my-submissions-title" className="font-bold text-ink">
              {events ? t.myEventSubmissionsTitle : t.mySubmissionsTitle}
            </h2>
            <p className="text-xs text-ink-muted">{events ? t.myEventSubmissionsIntro : t.mySubmissionsIntro}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="flex items-center justify-center h-9 w-9 shrink-0 rounded-full bg-panel text-ink hover:bg-line transition-colors"
          >
            <X aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>

        <ul className="space-y-2">
          {events
            ? byRejectedLast(events).map((event) =>
                renderRow(
                  event.id,
                  event.status,
                  event.created_at,
                  <span
                    aria-hidden="true"
                    className="flex items-center justify-center h-14 w-14 shrink-0 rounded-md border border-line bg-azure-soft text-link"
                  >
                    <CalendarDays className="h-6 w-6" strokeWidth={2} />
                  </span>,
                  <>
                    <p className="font-semibold text-sm text-ink truncate">{event.title}</p>
                    <p className="text-xs text-ink-muted truncate">
                      <MapPin aria-hidden="true" className="h-3 w-3 inline -mt-0.5 mr-1" strokeWidth={2} />
                      {event.place_name}
                    </p>
                    <p className="text-xs text-ink-muted truncate">
                      <CalendarDays aria-hidden="true" className="h-3 w-3 inline -mt-0.5 mr-1" strokeWidth={2} />
                      {formatEventTime(event.starts_at, undefined, locale)}
                    </p>
                  </>
                )
              )
            : byRejectedLast(spots).map((spot) => {
                const category = spotCategory(spot.category);
                return renderRow(
                  spot.id,
                  spot.status,
                  spot.created_at,
                  <SmartImage
                    src={spot.image || PLACEHOLDER_IMAGE}
                    alt=""
                    width={56}
                    height={56}
                    className="h-14 w-14 shrink-0 rounded-md object-cover border border-line"
                  />,
                  <>
                    <p className="font-semibold text-sm text-ink truncate">
                      {category ? <KeyIcon k={category.key} className="h-3.5 w-3.5 inline -mt-0.5 mr-1 text-ink-muted" /> : null}
                      {spot.name}
                    </p>
                    <p className="text-xs text-ink-muted truncate"><MapPin aria-hidden="true" className="h-3 w-3 inline -mt-0.5 mr-1" strokeWidth={2} />{spot.location}</p>
                  </>
                );
              })}
        </ul>
      </div>
    </div>
  );
}
