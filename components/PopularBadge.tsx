"use client";

import { isPopular, POPULAR_WINDOW_DAYS } from "@/lib/popular";
import { useI18n } from "@/components/LanguageProvider";
import { Flame } from "lucide-react";

// Сүүлийн долоо хоногт олон сэтгэгдэл авсан газарт "Эрэлттэй" (нарны өнгөөр). Хүрэхгүй бол юу ч харуулахгүй.
export default function PopularBadge({ recentCount, className = "" }: { recentCount: number | undefined; className?: string }) {
  const { t } = useI18n();
  if (!isPopular(recentCount)) return null;
  const detail = t.popularDetail(recentCount as number, POPULAR_WINDOW_DAYS);
  return (
    <span
      title={detail}
      aria-label={`${t.popular}: ${detail}`}
      className={`inline-flex items-center gap-1 text-sun-deep text-[11px] font-medium ${className}`}
    >
      <Flame aria-hidden="true" className="h-3 w-3" strokeWidth={2.25} />
      {t.popular}
    </span>
  );
}
