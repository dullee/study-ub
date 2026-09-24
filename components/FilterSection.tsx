"use client";

import { UserLocationState } from "@/lib/geo";

// Зайн шүүлтүүрийн сонголтууд (км). null — хязгааргүй.
export const DISTANCE_OPTIONS = [1, 3, 5, 10] as const;

interface FilterSectionProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  availableTags: string[];
  activeTags: string[];
  toggleTag: (tag: string) => void;
  location: UserLocationState;
  onLocate: () => void;
  onClearLocation: () => void;
  maxDistanceKm: number | null;
  setMaxDistanceKm: (km: number | null) => void;
}

export default function FilterSection({
  searchQuery,
  setSearchQuery,
  availableTags,
  activeTags,
  toggleTag,
  location,
  onLocate,
  onClearLocation,
  maxDistanceKm,
  setMaxDistanceKm,
}: FilterSectionProps) {
  const ready = location.status === "ready";
  const chipClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
      active
        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
        : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
    }`;

  return (
    <section className="space-y-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Газрын нэр эсвэл байршлаар хайх..."
          className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-400 px-4 py-2.5 pl-10 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <span className="absolute left-3.5 top-3 text-slate-400 text-sm">🔍</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => (
          <button key={tag} type="button" onClick={() => toggleTag(tag)} className={chipClass(activeTags.includes(tag))}>
            {tag}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 pt-4">
        {ready ? (
          <button type="button" onClick={onClearLocation} className={chipClass(true)} title="Байршлыг арилгах">
            📍 Миний байршил ✕
          </button>
        ) : (
          <button
            type="button"
            onClick={onLocate}
            disabled={location.status === "locating"}
            className={chipClass(false)}
          >
            {location.status === "locating" ? "📍 Байршил тодорхойлж байна..." : "📍 Миний байршил"}
          </button>
        )}
        <span className="text-xs text-slate-500" id="distance-label">
          Зай:
        </span>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="distance-label">
          <button
            type="button"
            disabled={!ready}
            aria-pressed={maxDistanceKm === null}
            onClick={() => setMaxDistanceKm(null)}
            className={chipClass(ready && maxDistanceKm === null)}
          >
            Хязгааргүй
          </button>
          {DISTANCE_OPTIONS.map((km) => (
            <button
              key={km}
              type="button"
              disabled={!ready}
              aria-pressed={maxDistanceKm === km}
              onClick={() => setMaxDistanceKm(km)}
              className={chipClass(ready && maxDistanceKm === km)}
            >
              {km} км дотор
            </button>
          ))}
        </div>
        {location.status === "error" ? (
          <p className="basis-full text-xs text-rose-400">{location.message}</p>
        ) : !ready ? (
          <p className="basis-full text-xs text-slate-500">
            Зайгаар шүүх, ойрын газрыг эхэнд харуулахын тулд байршлаа зөвшөөрнө үү.
          </p>
        ) : location.accuracy > 500 ? (
          <p className="basis-full text-xs text-amber-400">
            Байршил ойролцоогоор ({Math.round(location.accuracy)} м нарийвчлалтай) — зай бага зэрэг зөрж болно.
          </p>
        ) : null}
      </div>
    </section>
  );
}
