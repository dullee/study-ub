"use client";

import { BusynessLevel, busynessInfo, BusynessSummary } from "@/lib/busyness";
import { useI18n } from "@/components/LanguageProvider";

// Картын дээд булан, газрын зургийн popup-д: одоогийн ачаалал. Мэдээлэлгүй бол юу ч харуулахгүй.
export default function BusynessBadge({
  summary,
  now,
  className = "",
}: {
  summary: BusynessSummary | undefined;
  now: number | null;
  className?: string;
}) {
  const { t, locale } = useI18n();
  if (!summary || now === null) return null;
  const info = busynessInfo(summary.level);
  const minutesAgo = Math.max(0, Math.round((now - Date.parse(summary.latestAt)) / 60_000));
  const detail = t.busynessDetail(summary.count, minutesAgo);
  return (
    <span
      title={detail}
      aria-label={`${info.label[locale]}: ${detail}`}
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 rounded-md font-semibold backdrop-blur bg-slate-900/85 ${info.tone} ${className}`}
    >
      <BusynessMeter level={summary.level} />
      {info.label[locale]}
    </span>
  );
}

// 5 баганатай жижиг хэмжүүр — өнгөнөөс гадна дүрсээр ч ялгагдана.
export function BusynessMeter({ level }: { level: BusynessLevel }) {
  return (
    <span className="inline-flex items-end gap-0.5 h-3.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((bar) => (
        <span
          key={bar}
          className={`w-1 rounded-sm ${bar <= level ? "bg-current" : "bg-slate-600"}`}
          style={{ height: `${bar * 20}%` }}
        />
      ))}
    </span>
  );
}
