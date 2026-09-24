"use client";

import { Localized } from "@/types";
import { useI18n } from "@/components/LanguageProvider";

type Option = { key: string; icon: string; label: Localized };

interface OptionPickerProps {
  options: readonly Option[];
  value: string[];
  onChange: (value: string[]) => void;
}

// Газар нэмэх болон админы засах хэсэгт үйлчилгээ, хүртээмжийг олноор сонгоно.
export default function OptionPicker({ options, value, onChange }: OptionPickerProps) {
  const { locale } = useI18n();
  const toggle = (key: string) =>
    onChange(value.includes(key) ? value.filter((item) => item !== key) : [...value, key]);

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const selected = value.includes(option.key);
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(option.key)}
            className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
              selected
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
            }`}
          >
            <span aria-hidden="true">{option.icon}</span> {option.label[locale]}
          </button>
        );
      })}
    </div>
  );
}
