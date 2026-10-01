"use client";

import { ReactNode } from "react";

interface ScorePickerProps {
  label: string;
  icon: ReactNode;
  // Индекс = үнэлгээ − 1 (types/index.ts-ийн QUIET_LEVELS, OUTLET_LEVELS).
  levels: readonly string[];
  value: number | null | undefined;
  onChange: (value: number | null) => void;
}

// 1–5 үнэлгээ. Сонгосноо дахин дарвал цуцлагдана — заавал бөглөх шаардлагагүй.
export default function ScorePicker({ label, icon, levels, value, onChange }: ScorePickerProps) {
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 text-ink-muted">
        {icon} {label}
        {value ? <span className="text-ink"> · {levels[value - 1]}</span> : null}
      </p>
      <div className="flex gap-1" role="radiogroup" aria-label={label}>
        {levels.map((levelLabel, index) => {
          const score = index + 1;
          const selected = value === score;
          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${score} — ${levelLabel}`}
              title={levelLabel}
              onClick={() => onChange(selected ? null : score)}
              className={`h-8 w-8 rounded-md border text-xs font-semibold transition-colors ${
                value && score <= value
                  ? "bg-azure border-azure text-white"
                  : "bg-panel border-line text-ink-muted hover:border-line-strong"
              }`}
            >
              {score}
            </button>
          );
        })}
      </div>
    </div>
  );
}
