"use client";

import { ReactNode, useRef, useState } from "react";
import { UserLocationState } from "@/lib/geo";
import { useHeightVar } from "@/lib/useHeightVar";
import Dropdown from "@/components/Dropdown";
import { useI18n } from "@/components/LanguageProvider";
import { ACCESSIBILITY, AMENITIES, SPOT_CATEGORIES, tagLabel } from "@/types";
import {
  activeFilterCount,
  MIN_RATING_OPTIONS,
  SORT_KEYS,
  SortKey,
  SpotFilters,
  toggleValue,
} from "@/lib/spotFilters";

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
  filters: SpotFilters;
  setFilters: (update: (prev: SpotFilters) => SpotFilters) => void;
  onClearAll: () => void;
}

const SORT_LABEL = {
  recommended: "sortRecommended",
  rating: "sortRating",
  reviews: "sortReviews",
  distance: "sortDistance",
  popular: "sortPopular",
} as const satisfies Record<SortKey, string>;

const removableChipClass =
  "text-[11px] bg-indigo-950/60 border border-indigo-800/60 text-indigo-200 hover:text-white px-2 py-0.5 rounded-md";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-400">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

// Урт жагсаалт: цэс нээгдэх бүрт сонгосон зүйлтэй бол нээлттэй, эс бол хураалттай эхэлнэ.
// Дараа нь хэрэглэгч өөрөө нээж хаана — сонголтоо хасахад гэнэт хаагдахгүй.
function Collapsible({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  const [open, setOpen] = useState(count > 0);
  return (
    <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="cursor-pointer select-none text-xs font-semibold text-slate-400 hover:text-slate-200">
        {title}
        {count > 0 ? ` (${count})` : ""}
      </summary>
      <div className="flex flex-wrap gap-2 pt-2">{children}</div>
    </details>
  );
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
  filters,
  setFilters,
  onClearAll,
}: FilterSectionProps) {
  const { t, locale } = useI18n();
  const barRef = useRef<HTMLElement>(null);
  useHeightVar(barRef, "--filters-h");

  const ready = location.status === "ready";
  const selectedTags = activeTags.filter((tag) => tag !== ALL_TAG);
  const filterCount = selectedTags.length + activeFilterCount(filters);
  const set = (patch: Partial<SpotFilters>) => setFilters((prev) => ({ ...prev, ...patch }));
  const toggleIn = (key: "categories" | "amenities" | "accessibility", value: string) =>
    setFilters((prev) => ({ ...prev, [key]: toggleValue(prev[key], value) }));
  const sortLabel = t[SORT_LABEL[filters.sort]];
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

        {/* Утсан дээр бичвэр нуугддаг тул дэлгэц уншигчид нэрийг ariaLabel-ээр өгнө. */}
        <Dropdown
          align="right"
          active={filters.sort !== "recommended"}
          ariaLabel={`${t.sortLabel}: ${sortLabel}`}
          label={
            <>
              <span aria-hidden="true">↕️</span>
              <span className="hidden sm:inline">{filters.sort === "recommended" ? t.sortLabel : sortLabel}</span>
            </>
          }
        >
          {(close) => (
            <>
              <p className="text-xs font-semibold text-slate-400">{t.sortLabel}</p>
              <div className="grid gap-1" role="radiogroup" aria-label={t.sortLabel}>
                {SORT_KEYS.map((key) => {
                  const disabled = key === "distance" && !ready;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={filters.sort === key}
                      disabled={disabled}
                      onClick={() => {
                        set({ sort: key });
                        close();
                      }}
                      className={`text-left px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        filters.sort === key ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {filters.sort === key ? "✓ " : ""}
                      {t[SORT_LABEL[key]]}
                    </button>
                  );
                })}
              </div>
              {!ready ? <p className="text-xs text-slate-500">{t.sortDistanceHint}</p> : null}
            </>
          )}
        </Dropdown>

        <Dropdown
          align="right"
          active={filterCount > 0}
          ariaLabel={filterCount > 0 ? `${t.filters} (${filterCount})` : t.filters}
          label={
            <>
              <span aria-hidden="true">🏷️</span>
              <span className="hidden sm:inline">{t.filters}</span>
              {filterCount > 0 ? (
                <span className="bg-white/20 rounded-full px-1.5 text-[10px]">{filterCount}</span>
              ) : null}
            </>
          }
        >
          <Section title={t.minRatingLabel}>
            <button
              type="button"
              aria-pressed={filters.minRating === null}
              onClick={() => set({ minRating: null })}
              className={chipClass(filters.minRating === null)}
            >
              {t.anyRating}
            </button>
            {MIN_RATING_OPTIONS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={filters.minRating === value}
                onClick={() => set({ minRating: value })}
                className={chipClass(filters.minRating === value)}
              >
                {t.ratingAtLeast(value)}
              </button>
            ))}
          </Section>

          <Section title={t.quickFilters}>
            <button
              type="button"
              aria-pressed={filters.openNow}
              onClick={() => set({ openNow: !filters.openNow })}
              className={chipClass(filters.openNow)}
            >
              🟢 {t.openNow}
            </button>
            <button
              type="button"
              aria-pressed={filters.popularOnly}
              onClick={() => set({ popularOnly: !filters.popularOnly })}
              className={chipClass(filters.popularOnly)}
            >
              🔥 {t.popular}
            </button>
          </Section>

          <Section title={t.spotType}>
            {SPOT_CATEGORIES.map((category) => (
              <button
                key={category.key}
                type="button"
                aria-pressed={filters.categories.includes(category.key)}
                onClick={() => toggleIn("categories", category.key)}
                className={chipClass(filters.categories.includes(category.key))}
              >
                {category.icon} {category.label[locale]}
              </button>
            ))}
          </Section>

          <Section title={t.featuresLabel}>
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
          </Section>

          <Collapsible title={t.amenities} count={filters.amenities.length}>
              {AMENITIES.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={filters.amenities.includes(item.key)}
                  onClick={() => toggleIn("amenities", item.key)}
                  className={chipClass(filters.amenities.includes(item.key))}
                >
                  {item.icon} {item.label[locale]}
                </button>
              ))}
          </Collapsible>

          <Collapsible title={t.accessibility} count={filters.accessibility.length}>
              {ACCESSIBILITY.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={filters.accessibility.includes(item.key)}
                  onClick={() => toggleIn("accessibility", item.key)}
                  className={chipClass(filters.accessibility.includes(item.key))}
                >
                  {item.icon} {item.label[locale]}
                </button>
              ))}
          </Collapsible>

          {filterCount > 0 ? (
            <button type="button" onClick={onClearAll} className="text-xs text-indigo-300 hover:text-white">
              {t.clearAll}
            </button>
          ) : null}
        </Dropdown>

        <Dropdown
          align="right"
          active={ready}
          ariaLabel={distanceLabel}
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
      {filterCount > 0 || (ready && maxDistanceKm !== null) ? (
        <div className="flex flex-wrap gap-1.5">
          {filters.minRating !== null ? (
            <button
              type="button"
              onClick={() => set({ minRating: null })}
              aria-label={t.removeFilter(t.ratingAtLeast(filters.minRating))}
              className={removableChipClass}
            >
              {t.ratingAtLeast(filters.minRating)} ✕
            </button>
          ) : null}
          {filters.openNow ? (
            <button type="button" onClick={() => set({ openNow: false })} aria-label={t.removeFilter(t.openNow)} className={removableChipClass}>
              🟢 {t.openNow} ✕
            </button>
          ) : null}
          {filters.popularOnly ? (
            <button type="button" onClick={() => set({ popularOnly: false })} aria-label={t.removeFilter(t.popular)} className={removableChipClass}>
              🔥 {t.popular} ✕
            </button>
          ) : null}
          {SPOT_CATEGORIES.filter((c) => filters.categories.includes(c.key)).map((c) => (
            <button key={c.key} type="button" onClick={() => toggleIn("categories", c.key)} aria-label={t.removeFilter(c.label[locale])} className={removableChipClass}>
              {c.icon} {c.label[locale]} ✕
            </button>
          ))}
          {selectedTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              aria-label={t.removeTagFilter(tagLabel(tag, locale))}
              className={removableChipClass}
            >
              {tagLabel(tag, locale)} ✕
            </button>
          ))}
          {AMENITIES.filter((a) => filters.amenities.includes(a.key)).map((a) => (
            <button key={a.key} type="button" onClick={() => toggleIn("amenities", a.key)} aria-label={t.removeFilter(a.label[locale])} className={removableChipClass}>
              {a.icon} {a.label[locale]} ✕
            </button>
          ))}
          {ACCESSIBILITY.filter((a) => filters.accessibility.includes(a.key)).map((a) => (
            <button key={a.key} type="button" onClick={() => toggleIn("accessibility", a.key)} aria-label={t.removeFilter(a.label[locale])} className={removableChipClass}>
              {a.icon} {a.label[locale]} ✕
            </button>
          ))}
          {ready && maxDistanceKm !== null ? (
            <button
              type="button"
              onClick={() => setMaxDistanceKm(null)}
              aria-label={t.removeDistanceFilter}
              className={removableChipClass}
            >
              📍 {t.withinKm(maxDistanceKm)} ✕
            </button>
          ) : null}
          {filterCount + (ready && maxDistanceKm !== null ? 1 : 0) > 1 ? (
            <button type="button" onClick={onClearAll} className="text-[11px] text-slate-400 hover:text-white px-1">
              {t.clearAll}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
