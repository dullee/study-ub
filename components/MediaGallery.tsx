"use client";

import { useEffect } from "react";
import { SpotMedia } from "@/types";
import { videoPoster } from "@/lib/cloudinary";
import { useI18n } from "@/components/LanguageProvider";

// Газрын цонхны "Зураг, бичлэг" мөр: хэвтээ гүйлгэх жижиг зургууд; дарахад томоор нээнэ.
export function MediaStrip({ items, onOpen }: { items: SpotMedia[]; onOpen: (index: number) => void }) {
  const { t } = useI18n();
  return (
    <ul className="flex gap-2 overflow-x-auto pb-1 snap-x">
      {items.map((item, index) => {
        const poster = item.type === "video" ? videoPoster(item.url) : item.url;
        return (
          <li key={`${item.url}-${index}`} className="shrink-0 snap-start">
            <button
              type="button"
              onClick={() => onOpen(index)}
              aria-label={t.viewMedia(index + 1, items.length)}
              className="relative block h-24 w-32 sm:h-28 sm:w-40 rounded-xl overflow-hidden border border-slate-700 hover:border-indigo-400 bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {poster ? (
                <img src={poster} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <video src={item.url} preload="metadata" muted className="h-full w-full object-cover" />
              )}
              {item.type === "video" ? (
                <span className="absolute inset-0 flex items-center justify-center bg-slate-950/30">
                  <span className="h-9 w-9 rounded-full bg-slate-950/70 text-white flex items-center justify-center text-sm">▶</span>
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// Бүтэн дэлгэцийн харагч: ‹ › товч, сум товчлуур. Газрын цонхонд Esc-ийг цонх өөрөө барина (эхлээд энэ хаагдана);
// бусад газар (админ) closeOnEscape-ээр харагч өөрөө хаагдана.
export function MediaViewer({
  items,
  index,
  onIndexChange,
  onClose,
  closeOnEscape = false,
}: {
  items: SpotMedia[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  closeOnEscape?: boolean;
}) {
  const { t } = useI18n();
  const item = items[index];
  const count = items.length;
  const go = (delta: number) => onIndexChange((index + delta + count) % count);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onIndexChange((index + 1) % count);
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + count) % count);
      if (e.key === "Escape" && closeOnEscape) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, count, onIndexChange, onClose, closeOnEscape]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.mediaHeading}
      className="fixed inset-0 z-[1250] bg-black/95 flex items-center justify-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute top-3 left-4 text-sm text-slate-300 font-semibold">
        {index + 1} / {count}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={t.close}
        className="absolute top-3 right-3 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
      >
        ✕
      </button>

      <div className="max-h-[85dvh] max-w-[92vw] flex items-center justify-center">
        {item.type === "video" ? (
          <video
            key={item.url}
            src={item.url}
            poster={videoPoster(item.url)}
            controls
            autoPlay
            playsInline
            className="max-h-[85dvh] max-w-[92vw] rounded-lg"
          />
        ) : (
          <img key={item.url} src={item.url} alt="" className="max-h-[85dvh] max-w-[92vw] object-contain rounded-lg" />
        )}
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t.previous}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t.next}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl"
          >
            ›
          </button>
        </>
      ) : null}
    </div>
  );
}
