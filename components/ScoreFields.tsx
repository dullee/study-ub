"use client";

import { OUTLET_LEVELS, QUIET_LEVELS } from "@/types";
import ScorePicker from "@/components/ScorePicker";

export type ScoreValues = {
  wifi_mbps?: number | null;
  quiet_rating?: number | null;
  outlet_rating?: number | null;
};

interface ScoreFieldsProps {
  value: ScoreValues;
  onChange: (value: ScoreValues) => void;
}

// Wi-Fi хурд, чимээгүй байдал, розетка — газар нэмэх, сэтгэгдэл, админы засварт адилхан.
export default function ScoreFields({ value, onChange }: ScoreFieldsProps) {
  return (
    <div className="space-y-3">
      <label className="block space-y-1">
        <span className="block text-slate-400">⚡ Wi-Fi хурд (Mbps)</span>
        <input
          type="number"
          min={0}
          max={10000}
          step="any"
          value={value.wifi_mbps ?? ""}
          onChange={(e) =>
            onChange({ ...value, wifi_mbps: e.target.value === "" ? null : Number(e.target.value) })
          }
          placeholder="Ж: 72 — fast.com дээр шалгаж болно"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
        />
      </label>
      <ScorePicker
        label="Чимээгүй байдал"
        icon="🤫"
        levels={QUIET_LEVELS}
        value={value.quiet_rating}
        onChange={(quiet_rating) => onChange({ ...value, quiet_rating })}
      />
      <ScorePicker
        label="Розетка"
        icon="🔌"
        levels={OUTLET_LEVELS}
        value={value.outlet_rating}
        onChange={(outlet_rating) => onChange({ ...value, outlet_rating })}
      />
    </div>
  );
}
