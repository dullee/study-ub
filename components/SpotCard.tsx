"use client";

import { googleMapsUrl, OUTLET_LEVELS, PLACEHOLDER_IMAGE, QUIET_LEVELS, spotCategory, StudySpot, tagLabel } from "@/types";
import Stars from "@/components/Stars";
import { openStatus, STATUS_TONE, useNow } from "@/lib/openHours";
import { formatWifi, levelLabel, SpotSummary } from "@/lib/scores";
import { formatDistance } from "@/lib/geo";
import { useI18n } from "@/components/LanguageProvider";
import PopularBadge from "@/components/PopularBadge";

interface SpotCardProps {
  spot: StudySpot;
  onFocus: (lat: number, lng: number) => void;
  onOpenDetails: (spot: StudySpot) => void;
  // Газар нэмэгч + сэтгэгдлүүдээс нэгтгэсэн оноо (lib/scores.ts).
  summary: SpotSummary | undefined;
  // Сэтгэгдэл ачаалж байх үед одны үнэлгээний оронд placeholder.
  ratingsLoading: boolean;
  // Хэрэглэгчээс хүрэх зай (км). Байршил мэдэгдэхгүй бол undefined.
  distanceKm?: number;
  // Сүүлийн долоо хоногийн сэтгэгдлийн тоо — хангалттай бол "🔥 Эрэлттэй".
  recentReviews?: number;
}

const MAX_TAGS = 3;

const iconButtonClass =
  "pointer-events-auto h-9 w-9 sm:h-8 sm:w-8 flex items-center justify-center rounded-lg bg-slate-900/70 border border-white/15 text-sm text-slate-200 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition-colors";

// Нягт карт: нэр, үнэлгээ, төлөв, зай зураг дээр; хажууд нь жижиг хоёр товч.
// Карт бүхэлдээ дарагдана: бүрхэх товч доор, агуулга z-10-оор дээр боловч pointer-events-none тул
// дарахад доорх товч хүлээж авна. Зөвхөн жижиг товчнууд pointer-events-auto.
// (backdrop-blur шинэ stacking context үүсгэдэг тул товчны өөрийн z-index хангалтгүй.)
export default function SpotCard({
  spot,
  onFocus,
  onOpenDetails,
  summary,
  ratingsLoading,
  distanceKm,
  recentReviews,
}: SpotCardProps) {
  const { t, locale } = useI18n();
  const now = useNow();
  const status = now === null ? null : openStatus(spot, now, t);
  const category = spotCategory(spot.category);
  const rating = summary?.rating;
  const scoreLine = [
    summary?.wifi ? `⚡ ${formatWifi(summary.wifi)}` : null,
    summary?.quiet ? `🤫 ${levelLabel(QUIET_LEVELS, summary.quiet.value, locale)}` : null,
    summary?.outlets ? `🔌 ${levelLabel(OUTLET_LEVELS, summary.outlets.value, locale)}` : null,
  ].filter(Boolean);
  const hiddenTags = spot.tags.length - MAX_TAGS;

  return (
    <article className="relative isolate flex min-h-60 flex-col bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden hover:border-slate-500 transition-all group shadow-lg cursor-pointer has-focus-visible:ring-2 has-focus-visible:ring-indigo-500">
      {/* Зураг картын бүх талбайд; доош нь бараан болж бичвэр уншигдана. */}
      <img
        src={spot.image || PLACEHOLDER_IMAGE}
        alt=""
        className="absolute inset-0 -z-10 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/10" />

      <div className="relative z-10 pointer-events-none flex justify-between items-start gap-2 p-2 text-[11px] font-semibold">
        <div className="flex flex-wrap items-center gap-1.5">
          <PopularBadge recentCount={recentReviews} />
          {distanceKm !== undefined ? (
            <span className="bg-slate-900/85 backdrop-blur px-2 py-0.5 rounded-md border border-slate-700 text-indigo-300">
              🚶 {formatDistance(distanceKm, t)}
            </span>
          ) : null}
        </div>
        <span
          className={`bg-slate-900/85 backdrop-blur px-2 py-0.5 rounded-md border border-slate-700 ${
            status ? STATUS_TONE[status.tone] : "text-indigo-300"
          }`}
        >
          {now === null ? "⏰" : status ? `● ${status.short}` : `⏰ ${spot.hours}`}
        </span>
      </div>

      <div className="relative z-10 pointer-events-none mt-auto">
        <div className="px-3 pb-2">
          <h3 className="font-bold text-white text-base leading-tight drop-shadow-md group-hover:text-indigo-300 transition-colors truncate">
            {category ? (
              <span aria-hidden="true" className="mr-1">
                {category.icon}
              </span>
            ) : null}
            {spot.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs min-h-4 mt-0.5 drop-shadow">
            {ratingsLoading ? (
              <span className="h-3 w-24 rounded bg-slate-600/70 animate-pulse" aria-hidden="true" />
            ) : rating ? (
              <>
                <Stars value={rating.value} />
                <span className="text-white font-semibold">{rating.value.toFixed(1)}</span>
                <span className="text-slate-300">({rating.count})</span>
              </>
            ) : (
              <span className="text-slate-300">{t.noRating}</span>
            )}
          </div>
        </div>

        {/* Байршил, оноо, шошгын ард бараан, бүдгэрүүлсэн давхарга — зураг харагдсаар ч бичвэр тод. */}
        <div className="p-3 flex gap-3 bg-slate-950/60 backdrop-blur-md border-t border-white/10">
          <div className="flex-1 min-w-0 space-y-1.5">
            <p className="text-xs text-slate-300 truncate">📍 {spot.location}</p>
            {scoreLine.length > 0 ? (
              <p className="text-[11px] text-slate-300 truncate">{scoreLine.join(" · ")}</p>
            ) : null}
            {spot.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {spot.tags.slice(0, MAX_TAGS).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] bg-slate-900/70 border border-white/10 text-slate-200 px-1.5 py-0.5 rounded-md font-medium"
                  >
                    {tagLabel(tag, locale)}
                  </span>
                ))}
                {hiddenTags > 0 ? (
                  <span className="text-[10px] text-slate-400 px-1 py-0.5">+{hiddenTags}</span>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onFocus(spot.lat, spot.lng)}
              aria-label={t.showOnMapFor(spot.name)}
              title={t.showOnMap}
              className={iconButtonClass}
            >
              🎯
            </button>
            <a
              href={googleMapsUrl(spot)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.openInGoogleMapsFor(spot.name)}
              title={t.openInGoogleMaps}
              className={iconButtonClass}
            >
              ↗
            </a>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpenDetails(spot)}
        aria-label={t.openDetails(spot.name)}
        className="absolute inset-0 focus:outline-none"
      />
    </article>
  );
}
