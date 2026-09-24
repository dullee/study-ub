"use client";

interface ScorePickerProps {
  label: string;
  icon: string;
  // Индекс = үнэлгээ − 1 (types/index.ts-ийн QUIET_LEVELS, OUTLET_LEVELS).
  levels: readonly string[];
  value: number | null | undefined;
  onChange: (value: number | null) => void;
}

// 1–5 үнэлгээ. Сонгосноо дахин дарвал цуцлагдана — заавал бөглөх шаардлагагүй.
export default function ScorePicker({ label, icon, levels, value, onChange }: ScorePickerProps) {
  return (
    <div className="space-y-1">
      <p className="text-slate-400">
        {icon} {label}
        {value ? <span className="text-slate-200"> · {levels[value - 1]}</span> : null}
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
              className={`h-8 w-8 rounded-lg border text-xs font-semibold transition-colors ${
                value && score <= value
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
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
