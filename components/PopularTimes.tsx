"use client";

import { useEffect, useId, useState } from "react";
import {
  busynessInfo,
  busynessPattern,
  MIN_CELL_REPORTS,
  MIN_PATTERN_REPORTS,
  nearestLevel,
  PATTERN_WEEKS,
  PatternCell,
  ubWeekdayHour,
  WEEKDAY_LABELS,
} from "@/lib/busyness";
import { fetchBusynessPattern } from "@/lib/supabase/checkins";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { checkinsForSpot } from "@/lib/localStore";
import { useNow } from "@/lib/openHours";
import { useI18n } from "@/components/LanguageProvider";
import { ChevronDown } from "lucide-react";

// Google-ийн "Popular times" шиг: сонгосон гарагийн цаг тус бүрийн дундаж дүүргэлт (1–5), багана.
// Нэг цуваа тул бүх багана нэг өнгө (өндөр нь утгаа харуулна); одоогийн цаг өөр өнгө + "Одоо" шошго.
// Өнгийг dataviz validator-оор шалгасан (харанхуй самбар #172c48 дээр): тэнгэрийн хөх / нарны улбар шар — одоогийн цаг.
const BAR = "#3d8ef0";
const BAR_NOW = "#e86a10";
// Тэнхлэгийн шугамууд: Хоосон (1), Дунд (3), Суудал алга (5).
const GRID_LEVELS = [1, 3, 5] as const;
const pad = (hour: number) => String(hour).padStart(2, "0");

// Анхдагчаар хаалттай: гарчиг нь товч, дарахад график нээгдэнэ. Өгөгдлийг анх нээхэд л ачаална.
export default function PopularTimes({ spotId }: { spotId: number }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const buttonId = useId();
  const panelId = useId();

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-ink">
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
          className="w-full flex items-center justify-between gap-2 text-left hover:text-link"
        >
          {t.popularTimesHeading}
          <span aria-hidden="true" className={`shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}>
            <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
        </button>
      </h4>
      {open ? (
        <div id={panelId}>
          <PopularTimesChart spotId={spotId} labelledBy={buttonId} />
        </div>
      ) : null}
    </div>
  );
}

function PopularTimesChart({ spotId, labelledBy }: { spotId: number; labelledBy: string }) {
  const { t, locale } = useI18n();
  const now = useNow();
  const [cells, setCells] = useState<PatternCell[] | null>(null);
  const [chosenDay, setChosenDay] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const remote = isSupabaseConfigured ? await fetchBusynessPattern(spotId) : null;
      if (cancelled) return;
      setCells(remote ?? busynessPattern(checkinsForSpot(spotId), Date.now()));
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [spotId]);

  if (cells === null || now === null) {
    return <div className="h-40 rounded-md bg-sheet animate-pulse" aria-hidden="true" />;
  }

  const total = cells.reduce((sum, cell) => sum + cell.reports, 0);
  if (total < MIN_PATTERN_REPORTS) {
    return (
      <section aria-labelledby={labelledBy}>
        <p className="text-xs text-ink-muted">{t.popularTimesNotEnough(total, MIN_PATTERN_REPORTS)}</p>
      </section>
    );
  }

  const today = ubWeekdayHour(now);
  const day = chosenDay ?? today.weekday;
  // Нэг цагт 2-оос цөөн мэдээлэлтэй бол "ихэвчлэн" гэж хэлэхэд хангалтгүй.
  const usable = cells.filter((cell) => cell.reports >= MIN_CELL_REPORTS);
  const dayCells = new Map(usable.filter((cell) => cell.weekday === day).map((cell) => [cell.hour, cell]));
  const daysWithData = new Set(usable.map((cell) => cell.weekday));
  // Бүх гарагт ижил цагийн хүрээ (07–22, мэдээлэл түүнээс гадуур байвал өргөтгөнө) — гараг солиход тэнхлэг үсрэхгүй.
  const allHours = usable.map((cell) => cell.hour);
  const first = Math.min(7, ...allHours);
  const last = Math.max(22, ...allHours);
  const hours = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const isToday = day === today.weekday;
  const dayLabel = WEEKDAY_LABELS[locale][day];
  const hoveredCell = hovered === null ? undefined : dayCells.get(hovered);

  return (
    <section aria-labelledby={labelledBy} className="space-y-3">

      <div className="flex gap-1" role="group" aria-label={t.popularTimesDays}>
        {WEEKDAY_LABELS[locale].map((label, index) => (
          <button
            key={label}
            type="button"
            aria-pressed={index === day}
            onClick={() => {
              setChosenDay(index);
              setHovered(null);
            }}
            className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-colors ${
              index === day
                ? "bg-sheet text-ink shadow-sheet"
                : daysWithData.has(index)
                  ? "text-ink hover:bg-sheet"
                  : "text-ink-faint hover:bg-sheet"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {dayCells.size === 0 ? (
        <p className="text-xs text-ink-muted py-6 text-center">{t.popularTimesNoDay}</p>
      ) : (
        <div className="flex gap-2">
          {/* Y тэнхлэг: түвшний нэр (текстийн өнгө — өгөгдлийн өнгө биш). */}
          <div className="relative w-16 shrink-0 h-32 mt-10" aria-hidden="true">
            {GRID_LEVELS.map((level) => (
              <span
                key={level}
                className="absolute right-0 translate-y-1/2 text-[10px] leading-none text-ink-muted text-right"
                style={{ bottom: `${(level / 5) * 100}%` }}
              >
                {busynessInfo(level).label[locale]}
              </span>
            ))}
          </div>

          <div className="flex-1 min-w-0">
            {/* Tooltip-ийн тусдаа зурвас — өндөр баганын дээр гарахдаа гарагийн товчийг халхлахгүй. */}
            <div className="relative h-10">
              {hoveredCell && hovered !== null ? (
                <div
                  role="status"
                  className="pointer-events-none absolute bottom-1 z-10 -translate-x-1/2 rounded-md bg-night px-2.5 py-1.5 shadow-lift whitespace-nowrap"
                  style={{ left: `clamp(3.5rem, ${((hovered - first + 0.5) / hours.length) * 100}%, calc(100% - 3.5rem))` }}
                >
                  <p className="text-xs font-semibold text-white leading-tight">
                    {busynessInfo(nearestLevel(hoveredCell.avg_level)).label[locale]}
                  </p>
                  <p className="text-[10px] text-white/75 leading-tight">
                    {dayLabel} {pad(hovered)}:00 · {t.popularTimesReportCount(hoveredCell.reports)}
                  </p>
                </div>
              ) : null}
            </div>
            <div className="relative h-32 border-b border-line-strong">
              {GRID_LEVELS.map((level) => (
                <div
                  key={level}
                  aria-hidden="true"
                  className="absolute inset-x-0 h-px bg-line"
                  style={{ bottom: `${(level / 5) * 100}%` }}
                />
              ))}

              <div className="absolute inset-0 flex">
                {hours.map((hour) => {
                  const cell = dayCells.get(hour);
                  const isNow = isToday && hour === today.hour;
                  const height = cell ? (cell.avg_level / 5) * 100 : 0;
                  // "Одоо" шошго хөрш баганатай давхцахгүй: баганагүй бол хөршүүдийн дээгүүр.
                  const labelHeight = cell
                    ? height
                    : Math.max(0, ...[hour - 1, hour + 1].map((h) => ((dayCells.get(h)?.avg_level ?? 0) / 5) * 100));
                  return (
                    <div key={hour} className="relative flex-1 h-full flex justify-center">
                      {cell ? (
                        // Хүрэх талбай нь бүтэн өндөр багана — зурсан хэсгээс том.
                        <button
                          type="button"
                          aria-label={`${dayLabel} ${pad(hour)}:00 — ${
                            busynessInfo(nearestLevel(cell.avg_level)).label[locale]
                          }, ${t.popularTimesReportCount(cell.reports)}${isNow ? ` (${t.popularTimesNow})` : ""}`}
                          onPointerEnter={() => setHovered(hour)}
                          onPointerLeave={() => setHovered((current) => (current === hour ? null : current))}
                          onFocus={() => setHovered(hour)}
                          onBlur={() => setHovered((current) => (current === hour ? null : current))}
                          className="group h-full w-full flex items-end justify-center px-px focus:outline-none"
                        >
                          <span
                            className={`block w-full max-w-6 rounded-t-[4px] transition-[filter] group-hover:brightness-125 group-focus-visible:brightness-125 group-focus-visible:ring-2 group-focus-visible:ring-ink ${
                              hovered === hour ? "brightness-125" : ""
                            }`}
                            style={{ height: `${height}%`, backgroundColor: isNow ? BAR_NOW : BAR }}
                          />
                        </button>
                      ) : null}
                      {isNow && !cell ? (
                        // Энэ цагт мэдээлэлгүй ч "одоо" хаана байгааг суурь шугам дээр тэмдэглэнэ.
                        <span
                          aria-hidden="true"
                          className="absolute bottom-0 h-[3px] w-full max-w-6 rounded-t-sm"
                          style={{ backgroundColor: BAR_NOW }}
                        />
                      ) : null}
                      {isNow ? (
                        // Захын цагт шошго хүрээнээс гарахгүй: эхний цагт зүүн, сүүлийнх баруун ирмэгт тулна.
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none absolute text-[10px] font-semibold text-sun-deep whitespace-nowrap ${
                            hour === last ? "right-0" : hour === first ? "left-0" : "left-1/2 -translate-x-1/2"
                          }`}
                          style={{ bottom: `calc(${labelHeight}% + 4px)` }}
                        >
                          {t.popularTimesNow}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>

            </div>

            {/* X тэнхлэг: 3 цаг тутам. */}
            <div className="flex mt-1" aria-hidden="true">
              {hours.map((hour) => (
                <span key={hour} className="flex-1 text-center text-[10px] leading-none text-ink-muted tabular-nums">
                  {hour % 3 === 0 ? pad(hour) : ""}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-[11px] text-ink-muted">{t.popularTimesBasis(total, PATTERN_WEEKS)}</p>

      {dayCells.size > 0 ? (
        <details className="text-xs">
          <summary className="cursor-pointer select-none text-ink-muted hover:text-ink">{t.popularTimesTable}</summary>
          <table className="mt-2 w-full text-left">
            <caption className="sr-only">
              {t.popularTimesHeading} — {dayLabel}
            </caption>
            <thead className="text-ink-muted">
              <tr>
                <th className="py-1 font-medium">{t.popularTimesHour}</th>
                <th className="py-1 font-medium">{t.popularTimesLevel}</th>
                <th className="py-1 font-medium text-right">{t.popularTimesReports}</th>
              </tr>
            </thead>
            <tbody className="text-ink tabular-nums">
              {[...dayCells.values()]
                .sort((a, b) => a.hour - b.hour)
                .map((cell) => (
                  <tr key={cell.hour} className="border-t border-line">
                    <td className="py-1">{pad(cell.hour)}:00</td>
                    <td className="py-1">
                      {busynessInfo(nearestLevel(cell.avg_level)).label[locale]}{" "}
                      <span className="text-ink-muted">({cell.avg_level.toFixed(1)})</span>
                    </td>
                    <td className="py-1 text-right">{cell.reports}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </details>
      ) : null}
    </section>
  );
}
