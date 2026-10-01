"use client";

import { useEffect, useState } from "react";
import { SpotMedia } from "@/types";
import { videoPoster } from "@/lib/cloudinary";
import { isFacebookPostPermalink, isShortSocialLink, parseSocialLink, PLATFORM_INFO, SocialPlatform } from "@/lib/socialMedia";
import { useI18n } from "@/components/LanguageProvider";
import SmartImage from "@/components/SmartImage";
import { ArrowUpRight, ChevronLeft, ChevronRight, Link2, Play, X } from "lucide-react";

// Жижиг зураг: зураг, бичлэгийн эхний кадр, эсвэл сошиал холбоосын зураг (YouTube) / платформын өнгөт хавтан.
export function MediaThumb({ item }: { item: SpotMedia }) {
  const { t } = useI18n();
  if (item.type === "social") {
    const embed = parseSocialLink(item.url);
    // Хуучин/таньж чадаагүй холбоос (ж: Facebook /share/…) — хадгалсан платформын өнгө, нэрээр.
    const platform = embed?.platform ?? item.platform;
    const info = platform ? PLATFORM_INFO[platform] : null;
    return (
      <span className={`relative flex h-full w-full items-center justify-center ${info?.tile ?? "bg-panel"}`}>
        {embed?.thumbnail ? (
          <SmartImage src={embed.thumbnail} alt="" fill sizes="160px" className="object-cover" />
        ) : (
          <span aria-hidden="true" className="text-white">
            <Link2 aria-hidden="true" className="h-7 w-7" strokeWidth={2} />
          </span>
        )}
        <span className="absolute bottom-1 left-1 text-[10px] font-semibold bg-night/80 text-white px-1.5 rounded">
          {info?.name ?? t.video}
        </span>
      </span>
    );
  }
  const poster = item.type === "video" ? videoPoster(item.url) : item.url;
  return (
    <>
      {poster ? (
        <SmartImage src={poster} alt="" fill sizes="160px" className="object-cover" />
      ) : (
        <video src={item.url} preload="metadata" muted className="h-full w-full object-cover" />
      )}
      {item.type === "video" ? (
        <span className="absolute inset-0 flex items-center justify-center bg-night/25">
          <span className="h-9 w-9 rounded-full bg-night/70 text-white flex items-center justify-center"><Play aria-hidden="true" className="h-4 w-4 ml-0.5" strokeWidth={0} fill="currentColor" /></span>
        </span>
      ) : null}
    </>
  );
}

// Газрын цонхны "Зураг, бичлэг" мөр: хэвтээ гүйлгэх жижиг зургууд; дарахад томоор нээнэ.
export function MediaStrip({ items, onOpen }: { items: SpotMedia[]; onOpen: (index: number) => void }) {
  const { t } = useI18n();
  return (
    <ul className="flex gap-2 overflow-x-auto pb-1 snap-x">
      {items.map((item, index) => (
        <li key={`${item.url}-${index}`} className="shrink-0 snap-start">
          <button
            type="button"
            onClick={() => onOpen(index)}
            aria-label={t.viewMedia(index + 1, items.length)}
            className="relative block h-24 w-32 sm:h-28 sm:w-40 rounded-md overflow-hidden bg-panel hover:ring-2 hover:ring-azure focus:outline-none focus-visible:ring-2 focus-visible:ring-azure-500"
          >
            <MediaThumb item={item} />
          </button>
        </li>
      ))}
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
      className="fixed inset-0 z-[1250] bg-[#071526]/95 flex items-center justify-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute top-3 left-4 text-sm text-white/80 font-semibold tabular-nums">
        {index + 1} / {count}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={t.close}
        className="flex items-center justify-center absolute top-3 right-3 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
      >
        <X aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
      </button>

      <div className="max-h-[85dvh] max-w-[92vw] flex items-center justify-center">
        {item.type === "social" ? (
          <SocialEmbedFrame key={item.url} url={item.url} platform={item.platform} />
        ) : item.type === "video" ? (
          <video
            key={item.url}
            src={item.url}
            poster={videoPoster(item.url)}
            controls
            autoPlay
            playsInline
            className="max-h-[85dvh] max-w-[92vw] rounded-md"
          />
        ) : (
          <SmartImage
            key={item.url}
            src={item.url}
            alt=""
            width={1600}
            height={1200}
            sizes="92vw"
            loading="eager"
            className="h-auto w-auto max-h-[85dvh] max-w-[92vw] object-contain rounded-md"
          />
        )}
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t.previous}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <ChevronLeft aria-hidden="true" className="h-6 w-6" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t.next}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <ChevronRight aria-hidden="true" className="h-6 w-6" strokeWidth={2.25} />
          </button>
        </>
      ) : null}
    </div>
  );
}

// Сошиал пост/бичлэгийг платформын албан ёсны embed-ээр. Хаалттай пост, хязгаарлалттай бичлэг embed-д гарахгүй
// байж болох тул доор нь эх холбоосыг үргэлж өгнө.
// Ачаалж байх үед (эсвэл платформ хаасан үед) тунгалаг хоосон зай биш, бараан дэвсгэр харагдана.
const FRAME_SIZE = {
  landscape: "w-[min(92vw,960px)] aspect-video bg-[#071526]",
  portrait: "w-[min(92vw,340px)] h-[min(78dvh,620px)] bg-[#071526]",
  post: "w-[min(92vw,540px)] h-[min(78dvh,720px)] bg-white",
} as const;

function SocialEmbedFrame({ url, platform }: { url: string; platform?: SocialPlatform }) {
  const { t } = useI18n();
  // Хуучнаар хадгалсан share холбоос (facebook.com/share/…, fb.watch гэх мэт) — сервер дээр жинхэнэ холбоос руу нь
  // хөрвүүлж тоглуулна. undefined — хөрвүүлж байна, null — чадсангүй.
  // Facebook story.php (пост) хаягийг ч — reel бол бичлэгээр нь тоглуулахын тулд — шалгуулна.
  const needsResolve = (!parseSocialLink(url) && isShortSocialLink(url)) || isFacebookPostPermalink(url);
  const [resolved, setResolved] = useState<string | null | undefined>(needsResolve ? undefined : null);
  useEffect(() => {
    if (!needsResolve) return;
    let cancelled = false;
    fetch(`/api/media/resolve?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(10000) })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!cancelled) setResolved(body?.url ?? null);
      })
      .catch(() => {
        if (!cancelled) setResolved(null);
      });
    return () => {
      cancelled = true;
    };
  }, [needsResolve, url]);

  if (resolved === undefined) {
    return <div className="h-40 w-[min(92vw,340px)] rounded-md bg-white/10 animate-pulse" aria-busy="true" />;
  }
  const embed = parseSocialLink(resolved ?? url);
  if (!embed) {
    // Энд тоглуулж болохгүй холбоос (ж: хуучнаар хадгалсан share холбоос) — платформ дээр нь нээх товч.
    const name = platform ? PLATFORM_INFO[platform].name : new URL(url).hostname.replace(/^www\./, "");
    return (
      <div className="max-w-sm text-center space-y-4 px-4">
        <p className="text-sm text-white/80">{t.embedUnavailable}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm font-semibold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full"
        >
          {t.openOnPlatform(name)} <ArrowUpRight aria-hidden="true" className="h-4 w-4 inline" strokeWidth={2} />
        </a>
      </div>
    );
  }
  const info = PLATFORM_INFO[embed.platform];
  return (
    <div className="flex flex-col items-center gap-3">
      <iframe
        src={embed.embedUrl}
        title={t.socialEmbedTitle(info.name)}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className={`${FRAME_SIZE[embed.shape]} rounded-md border-0`}
      />
      <a
        href={embed.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full"
      >
        {t.openOnPlatform(info.name)} <ArrowUpRight aria-hidden="true" className="h-4 w-4 inline" strokeWidth={2} />
      </a>
    </div>
  );
}
