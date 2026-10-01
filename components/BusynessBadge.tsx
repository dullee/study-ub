"use client";

import { BusynessLevel, busynessInfo, BusynessSummary } from "@/lib/busyness";
import { useI18n } from "@/components/LanguageProvider";

// Картын дээд булан, газрын зургийн popup-д: одоогийн ачаалал. Мэдээлэлгүй бол юу ч харуулахгүй.
// showEmpty: мэдээлэлгүй үед ч байраа эзэлнэ (картад ачаалал үргэлж нэрийн дараах хамгийн тод элемент).
export default function BusynessBadge({
  summary,
  now,
  className = "",
  showEmpty = false,
  emptyClassName = "border-line-strong text-ink-muted",
}: {
  summary: BusynessSummary | undefined;
  now: number | null;
  className?: string;
  showEmpty?: boolean;
  // Мэдээлэлгүй төлөвийн өнгө (зураг дээр бол бараан суурьтай).
  emptyClassName?: string;
}) {
  const { t, locale } = useI18n();
  if (now === null) return null;
  if (!summary) {
    if (!showEmpty) return null;
    return (
      <span
        title={t.busynessNoneHint}
        className={`inline-flex items-center gap-1.5 border border-dashed px-2 py-0.5 rounded font-medium ${emptyClassName} ${className}`}
      >
        <BusynessMeter level={0} />
        {t.busynessNone}
      </span>
    );
  }
  const info = busynessInfo(summary.level);
  const minutesAgo = Math.max(0, Math.round((now - Date.parse(summary.latestAt)) / 60_000));
  const detail = t.busynessDetail(summary.count, minutesAgo);
  return (
    <span
      title={detail}
      aria-label={`${info.label[locale]}: ${detail}`}
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 rounded font-semibold ${info.tone} ${className}`}
    >
      <BusynessMeter level={summary.level} />
      {info.label[locale]}
    </span>
  );
}

// 5 баганатай жижиг хэмжүүр — өнгөнөөс гадна дүрсээр ч ялгагдана.
export function BusynessMeter({ level }: { level: BusynessLevel | 0 }) {
  return (
    <span className="inline-flex items-end gap-0.5 h-3.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((bar) => (
        <span
          key={bar}
          className={`w-1 rounded-sm ${bar <= level ? "bg-current" : "bg-current/30"}`}
          style={{ height: `${bar * 20}%` }}
        />
      ))}
    </span>
  );
}
