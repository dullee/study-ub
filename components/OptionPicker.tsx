"use client";

import { useId, useState } from "react";
import { Localized } from "@/types";
import { useI18n } from "@/components/LanguageProvider";

type Option = { key: string; icon: string; label: Localized };

interface OptionPickerProps {
  options: readonly Option[];
  value: string[];
  onChange: (value: string[]) => void;
}

// Газар нэмэх болон админы засах хэсэгт үйлчилгээ, хүртээмжийг олноор сонгоно.
// Анхдагчаар хаалттай: товч дээр сонгосон зүйлс харагдана, дарахад сонголтууд доор нь нээгдэнэ.
// Цонх гүйлгэгддэг тул хөвөгч цэс биш, байрандаа нээгддэг хэсэг (хөвөгч цэс цонхны ирмэгт тасарна).
export default function OptionPicker({ options, value, onChange }: OptionPickerProps) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const toggle = (key: string) =>
    onChange(value.includes(key) ? value.filter((item) => item !== key) : [...value, key]);
  const selected = options.filter((option) => value.includes(option.key));

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className={`w-full flex items-center gap-2 bg-slate-800 border rounded-lg p-2.5 text-left text-xs transition-colors ${
          open ? "border-indigo-500" : "border-slate-700 hover:border-slate-500"
        }`}
      >
        <span className={`flex-1 min-w-0 truncate ${selected.length > 0 ? "text-white" : "text-slate-500"}`}>
          {selected.length > 0
            ? selected.map((option) => `${option.icon} ${option.label[locale]}`).join(", ")
            : t.choose}
        </span>
        {selected.length > 0 ? (
          <span className="shrink-0 rounded-md bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {t.selectedCount(selected.length)}
          </span>
        ) : null}
        <span aria-hidden="true" className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      {open ? (
        <div id={panelId} className="flex flex-wrap gap-1.5 bg-slate-800/40 border border-slate-800 rounded-lg p-2">
          {options.map((option) => {
            const isSelected = value.includes(option.key);
            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggle(option.key)}
                className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                  isSelected
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
                }`}
              >
                <span aria-hidden="true">{option.icon}</span> {option.label[locale]}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
