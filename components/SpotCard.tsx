"use client";

import { googleMapsUrl, PLACEHOLDER_IMAGE, RatingSummary, StudySpot } from "@/types";
import Stars from "@/components/Stars";

interface SpotCardProps {
  spot: StudySpot;
  onFocus: (lat: number, lng: number) => void;
  onOpenDetails: (spot: StudySpot) => void;
  // null — үнэлгээ ачаалж байна; undefined — сэтгэгдэлгүй.
  rating: RatingSummary | undefined | null;
}

export default function SpotCard({ spot, onFocus, onOpenDetails, rating }: SpotCardProps) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-500 transition-all group shadow-lg">
      <div>
        <button
          type="button"
          onClick={() => onOpenDetails(spot)}
          aria-label={`${spot.name} — дэлгэрэнгүй`}
          className="relative block h-44 w-full overflow-hidden bg-slate-900 cursor-pointer"
        >
          <img
            src={spot.image || PLACEHOLDER_IMAGE}
            alt={spot.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <span className="absolute top-3 right-3 text-[11px] font-semibold bg-slate-900/90 backdrop-blur text-indigo-400 px-2.5 py-1 rounded-lg border border-slate-700">
            ⏰ {spot.hours}
          </span>
        </button>
        <div className="p-4 space-y-3">
          <h3 className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors">
            <button type="button" onClick={() => onOpenDetails(spot)} className="text-left">
              {spot.name}
            </button>
          </h3>
          <div className="flex items-center gap-1.5 text-xs min-h-4">
            {rating === null ? (
              <span className="h-3 w-28 rounded bg-slate-700/70 animate-pulse" aria-hidden="true" />
            ) : rating ? (
              <>
                <Stars value={rating.average} />
                <span className="text-slate-300 font-semibold">{rating.average.toFixed(1)}</span>
                <span className="text-slate-500">({rating.count})</span>
              </>
            ) : (
              <span className="text-slate-500">Үнэлгээгүй</span>
            )}
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1">📍 {spot.location}</p>
          {(spot.wifi_speed || spot.quiet_score || spot.socket_score) && (
            <p className="text-[11px] text-slate-400">
              {spot.wifi_speed ? `⚡ ${spot.wifi_speed}` : ""}
              {spot.quiet_score ? ` · 🤫 ${spot.quiet_score}` : ""}
              {spot.socket_score ? ` · 🔌 ${spot.socket_score}` : ""}
            </p>
          )}
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
          onClick={() => onFocus(spot.lat, spot.lng)}
          className="w-full py-2 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all border border-slate-700 hover:border-indigo-500"
        >
          Карт дээр 🎯
        </button>
        <a
          href={googleMapsUrl(spot)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all border border-slate-700 text-center"
        >
          Google Maps
        </a>
        <button
          onClick={() => onOpenDetails(spot)}
          className="col-span-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all border border-slate-700"
        >
          Дэлгэрэнгүй ба сэтгэгдэл
        </button>
      </div>
    </div>
  );
}
