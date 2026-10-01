"use client";

import { Plug, VolumeX, Wifi } from "lucide-react";
import { OUTLET_LEVELS, QUIET_LEVELS, Review } from "@/types";
import { useI18n } from "@/components/LanguageProvider";

// Нэг сэтгэгдлийн Wi-Fi, чимээгүй, залгуурын утга — дүрстэй өгөгдлийн мөр.
export default function ReviewScoreLine({
  review,
}: {
  review: Pick<Review, "wifi_mbps" | "quiet_rating" | "outlet_rating">;
}) {
  const { locale } = useI18n();
  const parts = [
    review.wifi_mbps != null ? { key: "wifi", icon: Wifi, text: `${review.wifi_mbps} Mbps` } : null,
    review.quiet_rating ? { key: "quiet", icon: VolumeX, text: QUIET_LEVELS[review.quiet_rating - 1][locale] } : null,
    review.outlet_rating ? { key: "outlets", icon: Plug, text: OUTLET_LEVELS[review.outlet_rating - 1][locale] } : null,
  ].filter((part): part is NonNullable<typeof part> => part !== null);
  if (parts.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-muted tabular-nums">
      {parts.map(({ key, icon: Icon, text }) => (
        <li key={key} className="inline-flex items-center gap-1">
          <Icon aria-hidden="true" className="h-3 w-3" strokeWidth={2} />
          {text}
        </li>
      ))}
    </ul>
  );
}
