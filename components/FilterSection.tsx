"use client";

import { useRef } from "react";
import { UserLocationState } from "@/lib/geo";
import { useHeightVar } from "@/lib/useHeightVar";
import Dropdown from "@/components/Dropdown";
import { useI18n } from "@/components/LanguageProvider";
import { tagLabel } from "@/types";

// Зайн шүүлтүүрийн сонголтууд (км). null — хязгааргүй.
export const DISTANCE_OPTIONS = [1, 3, 5, 10] as const;

const ALL_TAG = "Бүгд";

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

const chipClass = (active: boolean) =>
  `px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
    active
      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
  }`;

// Header-ийн доор наалдсан хайлтын мөр. Байнга харах шаардлагагүй сонголтууд (шошго, зай) нь цэсэнд.
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
  const { t, locale } = useI18n();
  const barRef = useRef<HTMLElement>(null);
  useHeightVar(barRef, "--filters-h");

  const ready = location.status === "ready";
  const selectedTags = activeTags.filter((tag) => tag !== ALL_TAG);
  const distanceLabel = !ready ? t.locationLabel : maxDistanceKm === null ? t.nearby : t.withinKm(maxDistanceKm);

  return (
    <section
      ref={barRef}
      aria-label={t.filterBarLabel}
      className="sticky top-0 lg:top-[var(--header-h,120px)] z-[900] -mx-4 px-4 py-3 bg-slate-900/95 backdrop-blur border-b border-slate-800 space-y-2"
    >
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchLabel}
            className="w-full h-10 bg-slate-800 border border-slate-700 text-white placeholder-slate-400 pl-10 pr-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm" aria-hidden="true">
            🔍
          </span>
        </div>

        <Dropdown
          align="right"
          active={selectedTags.length > 0}
          label={
            <>
              <span aria-hidden="true">🏷️</span>
              <span className="hidden sm:inline">{t.filters}</span>
              {selectedTags.length > 0 ? (
                <span className="bg-white/20 rounded-full px-1.5 text-[10px]">{selectedTags.length}</span>
              ) : null}
            </>
          }
        >
          <p className="text-xs font-semibold text-slate-400">{t.filtersHeading}</p>
          <div className="flex flex-wrap gap-2">
            {availableTags
              .filter((tag) => tag !== ALL_TAG)
              .map((tag) => (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={activeTags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                  className={chipClass(activeTags.includes(tag))}
                >
                  {tagLabel(tag, locale)}
                </button>
              ))}
          </div>
          {selectedTags.length > 0 ? (
            <button
              type="button"
              onClick={() => toggleTag(ALL_TAG)}
              className="text-xs text-indigo-300 hover:text-white"
            >
              {t.clearAll}
            </button>
          ) : null}
        </Dropdown>

        <Dropdown
          align="right"
          active={ready}
          label={
            <>
              <span aria-hidden="true">📍</span>
              <span className="hidden sm:inline">{distanceLabel}</span>
            </>
          }
        >
          {ready ? (
            <button type="button" onClick={onClearLocation} className={chipClass(true)}>
              {t.myLocationClear}
            </button>
          ) : (
            <button
              type="button"
              onClick={onLocate}
              disabled={location.status === "locating"}
              className={chipClass(false)}
            >
              {location.status === "locating" ? t.locating : t.useMyLocation}
            </button>
          )}
          <p className="text-xs font-semibold text-slate-400" id="distance-label">
            {t.distance}
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="distance-label">
            <button
              type="button"
              disabled={!ready}
              aria-pressed={maxDistanceKm === null}
              onClick={() => setMaxDistanceKm(null)}
              className={chipClass(ready && maxDistanceKm === null)}
            >
              {t.noLimit}
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
                {t.withinKm(km)}
              </button>
            ))}
          </div>
          {location.status === "error" ? (
            <p className="text-xs text-rose-400">{t[location.error]}</p>
          ) : !ready ? (
            <p className="text-xs text-slate-500">
              {t.locationHint}
            </p>
          ) : location.accuracy > 500 ? (
            <p className="text-xs text-amber-400">
              {t.approxLocation(Math.round(location.accuracy))}
            </p>
          ) : null}
        </Dropdown>
      </div>

      {/* Идэвхтэй шүүлтүүрүүд үргэлж харагдана — ✕ дарж хасна. */}
      {selectedTags.length > 0 || (ready && maxDistanceKm !== null) ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              aria-label={t.removeTagFilter(tagLabel(tag, locale))}
              className="text-[11px] bg-indigo-950/60 border border-indigo-800/60 text-indigo-200 hover:text-white px-2 py-0.5 rounded-md"
            >
              {tagLabel(tag, locale)} ✕
            </button>
          ))}
          {ready && maxDistanceKm !== null ? (
            <button
              type="button"
              onClick={() => setMaxDistanceKm(null)}
              aria-label={t.removeDistanceFilter}
              className="text-[11px] bg-indigo-950/60 border border-indigo-800/60 text-indigo-200 hover:text-white px-2 py-0.5 rounded-md"
            >
              📍 {t.withinKm(maxDistanceKm)} ✕
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
