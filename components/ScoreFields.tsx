"use client";

import { OUTLET_LEVELS, QUIET_LEVELS } from "@/types";
import ScorePicker from "@/components/ScorePicker";
import { useI18n } from "@/components/LanguageProvider";

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
  const { t, locale } = useI18n();
  return (
    <div className="space-y-3">
      <label className="block space-y-1">
        <span className="block text-slate-400">{t.wifiSpeedLabel}</span>
        <input
          type="number"
          min={0}
          max={10000}
          step="any"
          value={value.wifi_mbps ?? ""}
          onChange={(e) =>
            onChange({ ...value, wifi_mbps: e.target.value === "" ? null : Number(e.target.value) })
          }
          placeholder={t.wifiPlaceholder}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
        />
      </label>
      <ScorePicker
        label={t.quietLabel}
        icon="🤫"
        levels={QUIET_LEVELS.map((level) => level[locale])}
        value={value.quiet_rating}
        onChange={(quiet_rating) => onChange({ ...value, quiet_rating })}
      />
      <ScorePicker
        label={t.outletsLabel}
        icon="🔌"
        levels={OUTLET_LEVELS.map((level) => level[locale])}
        value={value.outlet_rating}
        onChange={(outlet_rating) => onChange({ ...value, outlet_rating })}
      />
    </div>
  );
}
