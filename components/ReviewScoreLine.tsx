"use client";

import { OUTLET_LEVELS, QUIET_LEVELS, Review } from "@/types";
import { useI18n } from "@/components/LanguageProvider";

// Нэг сэтгэгдлийн Wi-Fi, чимээгүй, розеткын утга: "⚡ 72 Mbps · 🤫 Чимээгүй · 🔌 Ихтэй".
export default function ReviewScoreLine({
  review,
}: {
  review: Pick<Review, "wifi_mbps" | "quiet_rating" | "outlet_rating">;
}) {
  const { locale } = useI18n();
  const parts = [
    review.wifi_mbps != null ? `⚡ ${review.wifi_mbps} Mbps` : null,
    review.quiet_rating ? `🤫 ${QUIET_LEVELS[review.quiet_rating - 1][locale]}` : null,
    review.outlet_rating ? `🔌 ${OUTLET_LEVELS[review.outlet_rating - 1][locale]}` : null,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return <p className="text-xs text-slate-400">{parts.join(" · ")}</p>;
}
