"use client";

import { ReactNode, useRef, useState } from "react";
import { UserLocationState } from "@/lib/geo";
import { useHeightVar } from "@/lib/useHeightVar";
import Dropdown from "@/components/Dropdown";
import { useI18n } from "@/components/LanguageProvider";
import { ACCESSIBILITY, AMENITIES, SPOT_CATEGORIES, tagLabel } from "@/types";
import { Armchair, ArrowDownUp, Check, Clock, Flame, Heart, Locate, Search, SlidersHorizontal, Star, X } from "lucide-react";
import KeyIcon from "@/components/KeyIcon";
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
  leastBusy: "sortLeastBusy",
} as const satisfies Record<SortKey, string>;

// Тэнгэрийн туузан дээрх идэвхтэй шүүлтүүр (✕ дарж хасна).
const removableChipClass =
  "inline-flex items-center gap-1 text-[11px] font-medium bg-white/15 border border-white/30 text-white hover:bg-white/25 pl-2 pr-1.5 py-0.5 rounded";
const removeIcon = <X aria-hidden="true" className="h-3 w-3" strokeWidth={2.5} />;
const chipIcon = "h-3.5 w-3.5";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-ink-muted">{title}</p>
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
      <summary className="cursor-pointer select-none text-xs font-semibold text-ink-muted hover:text-ink">
        {title}
        {count > 0 ? ` (${count})` : ""}
      </summary>
      <div className="flex flex-wrap gap-2 pt-2">{children}</div>
    </details>
  );
}

const chipClass = (active: boolean) =>
  `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
    active ? "bg-azure text-white" : "bg-panel text-ink hover:bg-line"
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
      className="text-white sticky top-0 lg:top-[var(--header-h,120px)] z-[900]"
    >
      {/* Тэнгэрийн өнгө зөвхөн агуулгын өргөнд (max-w-7xl) — өргөн дэлгэцэнд хажуу тал нь газрын өнгөөр үлдэнэ. */}
      <div className="sky-band max-w-7xl mx-auto px-4 pt-2 pb-3 space-y-2 min-[1280px]:rounded-b-md">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchLabel}
            className="w-full h-10 bg-sheet text-ink pl-10 pr-3 rounded-md text-sm shadow-sheet focus:outline-none focus:ring-2 focus:ring-sun transition-shadow"
          />
          <Search aria-hidden="true" className="absolute left-3 top-2.5 h-5 w-5 text-ink-faint" strokeWidth={2} />
        </div>

        {/* Утсан дээр бичвэр нуугддаг тул дэлгэц уншигчид нэрийг ariaLabel-ээр өгнө. */}
        <Dropdown
          align="right"
          active={filters.sort !== "recommended"}
          ariaLabel={`${t.sortLabel}: ${sortLabel}`}
          label={
            <>
              <ArrowDownUp aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
              <span className="hidden sm:inline">{filters.sort === "recommended" ? t.sortLabel : sortLabel}</span>
            </>
          }
        >
          {(close) => (
            <>
              <p className="text-xs font-semibold text-ink-muted">{t.sortLabel}</p>
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
                      className={`flex items-center gap-2 text-left px-3 py-2 rounded-md text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        filters.sort === key ? "bg-azure-soft text-link font-semibold" : "text-ink hover:bg-panel"
                      }`}
                    >
                      <Check aria-hidden="true" className={`h-4 w-4 ${filters.sort === key ? "" : "invisible"}`} strokeWidth={2.5} />
                      {t[SORT_LABEL[key]]}
                    </button>
                  );
                })}
              </div>
              {!ready ? <p className="text-xs text-ink-muted">{t.sortDistanceHint}</p> : null}
            </>
          )}
        </Dropdown>

        <Dropdown
          align="right"
          active={filterCount > 0}
          ariaLabel={filterCount > 0 ? `${t.filters} (${filterCount})` : t.filters}
          label={
            <>
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
              <span className="hidden sm:inline">{t.filters}</span>
              {filterCount > 0 ? (
                <span className="bg-sun text-night rounded-full px-1.5 text-[10px] font-bold leading-4 tabular-nums">{filterCount}</span>
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
                <Star aria-hidden="true" className={chipIcon} strokeWidth={0} fill="currentColor" />
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
              <Clock aria-hidden="true" className={chipIcon} strokeWidth={2} /> {t.openNow}
            </button>
            <button
              type="button"
              aria-pressed={filters.popularOnly}
              onClick={() => set({ popularOnly: !filters.popularOnly })}
              className={chipClass(filters.popularOnly)}
            >
              <Flame aria-hidden="true" className={chipIcon} strokeWidth={2} /> {t.popular}
            </button>
            <button
              type="button"
              aria-pressed={filters.notBusyNow}
              onClick={() => set({ notBusyNow: !filters.notBusyNow })}
              className={chipClass(filters.notBusyNow)}
              title={t.notBusyNowHint}
            >
              <Armchair aria-hidden="true" className={chipIcon} strokeWidth={2} /> {t.notBusyNow}
            </button>
            <button
              type="button"
              aria-pressed={filters.savedOnly}
              onClick={() => set({ savedOnly: !filters.savedOnly })}
              className={chipClass(filters.savedOnly)}
            >
              <Heart aria-hidden="true" className={chipIcon} strokeWidth={2} /> {t.savedOnly}
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
                <KeyIcon k={category.key} className={chipIcon} /> {category.label[locale]}
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
                  <KeyIcon k={item.key} className={chipIcon} /> {item.label[locale]}
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
                  <KeyIcon k={item.key} className={chipIcon} /> {item.label[locale]}
                </button>
              ))}
          </Collapsible>

          {filterCount > 0 ? (
            <button type="button" onClick={onClearAll} className="text-xs font-semibold text-link hover:text-link underline">
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
              <Locate aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
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
          <p className="text-xs font-semibold text-ink-muted" id="distance-label">
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
            <p className="text-xs text-danger">{t[location.error]}</p>
          ) : !ready ? (
            <p className="text-xs text-ink-muted">
              {t.locationHint}
            </p>
          ) : location.accuracy > 500 ? (
            <p className="text-xs text-sun-deep">
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
              <Star aria-hidden="true" className="h-3 w-3" strokeWidth={0} fill="currentColor" />
              {t.ratingAtLeast(filters.minRating)} {removeIcon}
            </button>
          ) : null}
          {filters.openNow ? (
            <button type="button" onClick={() => set({ openNow: false })} aria-label={t.removeFilter(t.openNow)} className={removableChipClass}>
              <Clock aria-hidden="true" className="h-3 w-3" strokeWidth={2} /> {t.openNow} {removeIcon}
            </button>
          ) : null}
          {filters.popularOnly ? (
            <button type="button" onClick={() => set({ popularOnly: false })} aria-label={t.removeFilter(t.popular)} className={removableChipClass}>
              <Flame aria-hidden="true" className="h-3 w-3" strokeWidth={2} /> {t.popular} {removeIcon}
            </button>
          ) : null}
          {filters.notBusyNow ? (
            <button type="button" onClick={() => set({ notBusyNow: false })} aria-label={t.removeFilter(t.notBusyNow)} className={removableChipClass}>
              <Armchair aria-hidden="true" className="h-3 w-3" strokeWidth={2} /> {t.notBusyNow} {removeIcon}
            </button>
          ) : null}
          {filters.savedOnly ? (
            <button type="button" onClick={() => set({ savedOnly: false })} aria-label={t.removeFilter(t.savedOnly)} className={removableChipClass}>
              <Heart aria-hidden="true" className="h-3 w-3" strokeWidth={2} /> {t.savedOnly} {removeIcon}
            </button>
          ) : null}
          {SPOT_CATEGORIES.filter((c) => filters.categories.includes(c.key)).map((c) => (
            <button key={c.key} type="button" onClick={() => toggleIn("categories", c.key)} aria-label={t.removeFilter(c.label[locale])} className={removableChipClass}>
              <KeyIcon k={c.key} className="h-3 w-3" /> {c.label[locale]} {removeIcon}
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
              {tagLabel(tag, locale)} {removeIcon}
            </button>
          ))}
          {AMENITIES.filter((a) => filters.amenities.includes(a.key)).map((a) => (
            <button key={a.key} type="button" onClick={() => toggleIn("amenities", a.key)} aria-label={t.removeFilter(a.label[locale])} className={removableChipClass}>
              <KeyIcon k={a.key} className="h-3 w-3" /> {a.label[locale]} {removeIcon}
            </button>
          ))}
          {ACCESSIBILITY.filter((a) => filters.accessibility.includes(a.key)).map((a) => (
            <button key={a.key} type="button" onClick={() => toggleIn("accessibility", a.key)} aria-label={t.removeFilter(a.label[locale])} className={removableChipClass}>
              <KeyIcon k={a.key} className="h-3 w-3" /> {a.label[locale]} {removeIcon}
            </button>
          ))}
          {ready && maxDistanceKm !== null ? (
            <button
              type="button"
              onClick={() => setMaxDistanceKm(null)}
              aria-label={t.removeDistanceFilter}
              className={removableChipClass}
            >
              <Locate aria-hidden="true" className="h-3 w-3" strokeWidth={2} /> {t.withinKm(maxDistanceKm)} {removeIcon}
            </button>
          ) : null}
          {filterCount + (ready && maxDistanceKm !== null ? 1 : 0) > 1 ? (
            <button type="button" onClick={onClearAll} className="text-[11px] font-semibold text-white/85 hover:text-white underline px-1">
              {t.clearAll}
            </button>
          ) : null}
        </div>
      ) : null}
      </div>
    </section>
  );
}
