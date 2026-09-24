"use client";

import { LOCALES } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/components/LanguageProvider";

const SHORT: Record<(typeof LOCALES)[number], string> = { mn: "МН", en: "EN" };

// Header дахь хэл сонгогч: МН (үндсэн) | EN.
export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t.languageLabel}
      className="flex h-9 rounded-xl border border-slate-700 overflow-hidden text-[11px] font-bold shrink-0"
    >
      {LOCALES.map((option) => {
        const active = option === locale;
        return (
          <button
            key={option}
            type="button"
            lang={option}
            aria-pressed={active}
            title={option === "mn" ? "Монгол" : "English"}
            onClick={() => {
              if (!active) setLocale(option);
            }}
            className={`px-2 transition-colors ${
              active ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            {SHORT[option]}
          </button>
        );
      })}
    </div>
  );
}
