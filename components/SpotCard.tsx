"use client";

import { googleMapsUrl, OUTLET_LEVELS, PLACEHOLDER_IMAGE, QUIET_LEVELS, StudySpot } from "@/types";
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

// Карт бүхэлдээ дарагдана: гарчгийн товчны after:inset-0 картыг бүрхэнэ, доорх товчнууд z-10-оор дээр нь гарна.
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
  const rating = summary?.rating;
  const level = (levels: readonly string[], value: number) => levels[Math.round(value) - 1];
  const scoreLine = [
    summary?.wifi ? `⚡ ${formatWifi(summary.wifi)}` : null,
    summary?.quiet ? `🤫 ${level(QUIET_LEVELS, summary.quiet.value)}` : null,
    summary?.outlets ? `🔌 ${level(OUTLET_LEVELS, summary.outlets.value)}` : null,
  ].filter(Boolean);
  return (
    <div className="relative bg-slate-800/50 border border-slate-700/60 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-500 transition-all group shadow-lg cursor-pointer has-focus-visible:ring-2 has-focus-visible:ring-indigo-500">
      <div>
        <div className="relative h-44 w-full overflow-hidden bg-slate-900">
          <img
            src={spot.image || PLACEHOLDER_IMAGE}
            alt={spot.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <span
            className={`absolute top-3 right-3 text-[11px] font-semibold bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-700 ${
              status ? STATUS_TONE[status.tone] : "text-indigo-400"
            }`}
          >
            {now === null ? "⏰" : status ? `● ${status.short}` : `⏰ ${spot.hours}`}
          </span>
        </div>
        <div className="p-4 space-y-3">
          <h3 className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors">
            <button
              type="button"
              data-card-open
              onClick={() => onOpenDetails(spot)}
              aria-label={`${spot.name} — дэлгэрэнгүй ба сэтгэгдэл`}
              className="text-left focus:outline-none after:absolute after:inset-0 after:content-['']"
            >
              {spot.name}
            </button>
          </h3>
          <div className="flex items-center gap-1.5 text-xs min-h-4">
            {ratingsLoading ? (
              <span className="h-3 w-28 rounded bg-slate-700/70 animate-pulse" aria-hidden="true" />
            ) : rating ? (
              <>
                <Stars value={rating.value} />
                <span className="text-slate-300 font-semibold">{rating.value.toFixed(1)}</span>
                <span className="text-slate-500">({rating.count})</span>
              </>
            ) : (
              <span className="text-slate-500">Үнэлгээгүй</span>
            )}
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            📍 {spot.location}
            {distanceKm !== undefined ? (
              <span className="ml-auto shrink-0 font-semibold text-indigo-300">🚶 {formatDistance(distanceKm)}</span>
            ) : null}
          </p>
          {scoreLine.length > 0 ? <p className="text-[11px] text-slate-400">{scoreLine.join(" · ")}</p> : null}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {spot.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-slate-900/80 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-md font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 pt-0 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onFocus(spot.lat, spot.lng)}
          className="relative z-10 w-full py-2 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all border border-slate-700 hover:border-indigo-500"
        >
          Карт дээр 🎯
        </button>
        <a
          href={googleMapsUrl(spot)}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 block w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all border border-slate-700 text-center"
        >
          Google Maps
        </a>
      </div>
    </div>
  );
}
