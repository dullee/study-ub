"use client";

import { useId, useState } from "react";
import { Localized } from "@/types";
import { useI18n } from "@/components/LanguageProvider";
import { ChevronDown } from "lucide-react";
import KeyIcon from "@/components/KeyIcon";

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
        className={`w-full flex items-center gap-2 bg-panel border rounded-md p-2.5 text-left text-xs transition-colors ${
          open ? "border-azure" : "border-line hover:border-line-strong"
        }`}
      >
        <span className={`flex-1 min-w-0 truncate ${selected.length > 0 ? "text-ink" : "text-ink-muted"}`}>
          {selected.length > 0
            ? selected.map((option) => option.label[locale]).join(", ")
            : t.choose}
        </span>
        {selected.length > 0 ? (
          <span className="shrink-0 rounded-md bg-azure px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {t.selectedCount(selected.length)}
          </span>
        ) : null}
        <span aria-hidden="true" className={`shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}>
          <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
      </button>
      {open ? (
        <div id={panelId} className="flex flex-wrap gap-1.5 bg-panel border border-line rounded-md p-2">
          {options.map((option) => {
            const isSelected = value.includes(option.key);
            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggle(option.key)}
                className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
                  isSelected
                    ? "bg-azure border-azure text-white"
                    : "bg-panel border-line text-ink-muted hover:border-line-strong"
                }`}
              >
                <KeyIcon k={option.key} className="h-3.5 w-3.5 inline -mt-0.5" /> {option.label[locale]}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
