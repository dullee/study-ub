"use client";

import { isPopular, POPULAR_WINDOW_DAYS } from "@/lib/popular";
import { useI18n } from "@/components/LanguageProvider";

// Сүүлийн долоо хоногт олон сэтгэгдэл авсан газарт "🔥 Эрэлттэй". Хүрэхгүй бол юу ч харуулахгүй.
export default function PopularBadge({ recentCount, className = "" }: { recentCount: number | undefined; className?: string }) {
  const { t } = useI18n();
  if (!isPopular(recentCount)) return null;
  const detail = t.popularDetail(recentCount as number, POPULAR_WINDOW_DAYS);
  return (
    <span
      title={detail}
      aria-label={`${t.popular}: ${detail}`}
      className={`inline-flex items-center gap-1 bg-orange-500/90 text-white border border-orange-300/40 px-2 py-0.5 rounded-md font-semibold shadow-md shadow-orange-900/30 ${className}`}
    >
      <span aria-hidden="true">🔥</span>
      {t.popular}
    </span>
  );
}
