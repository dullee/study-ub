"use client";

import { useEffect } from "react";
import { PLACEHOLDER_IMAGE, spotCategory, StudySpot } from "@/types";
import { useI18n } from "@/components/LanguageProvider";

interface MySubmissionsDialogProps {
  spots: StudySpot[];
  onClose: () => void;
}

// Хэрэглэгчийн илгээсэн, хараахан нийтлэгдээгүй газрууд: хүлээгдэж буй нь эхэнд, зөвшөөрөгдөөгүй нь доор.
export default function MySubmissionsDialog({ spots, onClose }: MySubmissionsDialogProps) {
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

  const sorted = [...spots].sort((a, b) => Number(a.status === "rejected") - Number(b.status === "rejected"));
  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "en-CA", { dateStyle: "medium" }) : null;

  return (
    <div
      className="fixed inset-0 z-[1100] bg-slate-950/80 backdrop-blur-sm flex items-stretch sm:items-center justify-center p-0 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="my-submissions-title"
        className="relative w-full max-w-lg bg-slate-900 sm:border border-slate-800 rounded-none sm:rounded-2xl shadow-2xl h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[85vh] overflow-y-auto px-5 pb-5"
      >
        <div className="sticky top-0 z-10 -mx-5 mb-4 px-5 pt-5 pb-3 bg-slate-900 border-b border-slate-800 flex items-start justify-between gap-3">
          <div>
            <h2 id="my-submissions-title" className="font-bold text-white">
              {t.mySubmissionsTitle}
            </h2>
            <p className="text-xs text-slate-400">{t.mySubmissionsIntro}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="h-9 w-9 shrink-0 rounded-full bg-slate-800 text-slate-200 hover:text-white border border-slate-700"
          >
            ✕
          </button>
        </div>

        <ul className="space-y-2">
          {sorted.map((spot) => {
            const category = spotCategory(spot.category);
            const rejected = spot.status === "rejected";
            const date = formatDate(spot.created_at);
            return (
              <li
                key={spot.id}
                className={`flex gap-3 items-center rounded-xl border border-slate-800 bg-slate-800/40 p-2.5 ${
                  rejected ? "opacity-70" : ""
                }`}
              >
                <img
                  src={spot.image || PLACEHOLDER_IMAGE}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-lg object-cover border border-slate-700"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-white truncate">
                    {category ? <span aria-hidden="true">{category.icon} </span> : null}
                    {spot.name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">📍 {spot.location}</p>
                  {date ? <p className="text-[11px] text-slate-500">{t.submittedOn(date)}</p> : null}
                </div>
                <span
                  className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    rejected
                      ? "bg-rose-500/10 border-rose-500/40 text-rose-300"
                      : "bg-amber-500/10 border-amber-500/40 text-amber-300"
                  }`}
                >
                  {rejected ? t.statusNotApproved : t.statusPending}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
