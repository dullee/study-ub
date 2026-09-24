"use client";

import { googleMapsUrl, OUTLET_LEVELS, PLACEHOLDER_IMAGE, QUIET_LEVELS, spotCategory, StudySpot } from "@/types";
import Stars from "@/components/Stars";
import { openStatus, STATUS_TONE, useNow } from "@/lib/openHours";
import { formatWifi, SpotSummary } from "@/lib/scores";
import { formatDistance } from "@/lib/geo";

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
}

const MAX_TAGS = 3;

const iconButtonClass =
  "relative z-10 h-9 w-9 sm:h-8 sm:w-8 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition-colors";

// Нягт карт: нэр, үнэлгээ, төлөв, зай зураг дээр; хажууд нь жижиг хоёр товч.
// Карт бүхэлдээ дарагдана — хамгийн сүүлийн товч картыг бүрхэж, жижиг товчнууд z-10-оор дээр нь гарна.
export default function SpotCard({
  spot,
  onFocus,
  onOpenDetails,
  summary,
  ratingsLoading,
  distanceKm,
}: SpotCardProps) {
  const now = useNow();
  const status = now === null ? null : openStatus(spot, now);
  const category = spotCategory(spot.category);
  const rating = summary?.rating;
  const level = (levels: readonly string[], value: number) => levels[Math.round(value) - 1];
  const scoreLine = [
    summary?.wifi ? `⚡ ${formatWifi(summary.wifi)}` : null,
    summary?.quiet ? `🤫 ${level(QUIET_LEVELS, summary.quiet.value)}` : null,
    summary?.outlets ? `🔌 ${level(OUTLET_LEVELS, summary.outlets.value)}` : null,
  ].filter(Boolean);
  const hiddenTags = spot.tags.length - MAX_TAGS;

  return (
    <article className="relative bg-slate-800/50 border border-slate-700/60 rounded-2xl overflow-hidden hover:border-slate-500 transition-all group shadow-lg cursor-pointer has-focus-visible:ring-2 has-focus-visible:ring-indigo-500">
      <div className="relative h-36 w-full overflow-hidden bg-slate-900">
        <img
          src={spot.image || PLACEHOLDER_IMAGE}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        <div className="absolute top-2 left-2 right-2 flex justify-between items-start gap-2 text-[11px] font-semibold">
          {distanceKm !== undefined ? (
            <span className="bg-slate-900/85 backdrop-blur px-2 py-0.5 rounded-md border border-slate-700 text-indigo-300">
              🚶 {formatDistance(distanceKm)}
            </span>
          ) : (
            <span />
          )}
          <span
            className={`bg-slate-900/85 backdrop-blur px-2 py-0.5 rounded-md border border-slate-700 ${
              status ? STATUS_TONE[status.tone] : "text-indigo-300"
            }`}
          >
            {now === null ? "⏰" : status ? `● ${status.short}` : `⏰ ${spot.hours}`}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2">
          <h3 className="font-bold text-white text-base leading-tight drop-shadow group-hover:text-indigo-300 transition-colors truncate">
            {category ? (
              <span aria-hidden="true" className="mr-1">
                {category.icon}
              </span>
            ) : null}
            {spot.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs min-h-4 mt-0.5">
            {ratingsLoading ? (
              <span className="h-3 w-24 rounded bg-slate-600/70 animate-pulse" aria-hidden="true" />
            ) : rating ? (
              <>
                <Stars value={rating.value} />
                <span className="text-white font-semibold">{rating.value.toFixed(1)}</span>
                <span className="text-slate-300">({rating.count})</span>
              </>
            ) : (
              <span className="text-slate-300">Үнэлгээгүй</span>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 flex gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-xs text-slate-400 truncate">📍 {spot.location}</p>
          {scoreLine.length > 0 ? (
            <p className="text-[11px] text-slate-400 truncate">{scoreLine.join(" · ")}</p>
          ) : null}
          {spot.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {spot.tags.slice(0, MAX_TAGS).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] bg-slate-900/80 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded-md font-medium"
                >
                  {tag}
                </span>
              ))}
              {hiddenTags > 0 ? (
                <span className="text-[10px] text-slate-500 px-1 py-0.5">+{hiddenTags}</span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onFocus(spot.lat, spot.lng)}
            aria-label={`${spot.name} — карт дээр харах`}
            title="Карт дээр харах"
            className={iconButtonClass}
          >
            🎯
          </button>
          <a
            href={googleMapsUrl(spot)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${spot.name} — Google Maps дээр нээх`}
            title="Google Maps дээр нээх"
            className={iconButtonClass}
          >
            ↗
          </a>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpenDetails(spot)}
        aria-label={`${spot.name} — дэлгэрэнгүй ба сэтгэгдэл`}
        className="absolute inset-0 focus:outline-none"
      />
    </article>
  );
}
