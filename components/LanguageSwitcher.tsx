"use client";

import { useId } from "react";
import { Locale } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/components/LanguageProvider";

// Туг emoji Windows дээр харагддаггүй ("MN" үсэг гарна) тул SVG-ээр зурна. Хоёулаа 1:2 харьцаатай.

function MongoliaFlag() {
  const gold = "#FFD900";
  return (
    <svg viewBox="0 0 60 30" aria-hidden="true" className="h-full w-full">
      <rect width="20" height="30" fill="#DA2032" />
      <rect x="20" width="20" height="30" fill="#015197" />
      <rect x="40" width="20" height="30" fill="#DA2032" />
      {/* Хялбаршуулсан Соёмбо: гал, нар, сар, гурвалжин, арга билэг, босоо баганууд. */}
      <g fill={gold}>
        <path d="M10 2.2 L11.3 5.2 L10 4.6 L8.7 5.2 Z" />
        <circle cx="10" cy="7.3" r="1.6" />
        <path d="M7.6 9.2 A2.4 2.4 0 0 0 12.4 9.2 A2.4 1.6 0 0 1 7.6 9.2 Z" />
        <path d="M8.2 12 H11.8 L10 13.6 Z" />
        <rect x="8.2" y="14.2" width="3.6" height="0.8" />
        <circle cx="10" cy="18" r="2.1" />
        <rect x="8.2" y="21" width="3.6" height="0.8" />
        <path d="M8.2 23.8 H11.8 L10 22.2 Z" />
        <rect x="6.3" y="12" width="1.2" height="12" />
        <rect x="12.5" y="12" width="1.2" height="12" />
      </g>
      <path d="M10 15.9 A2.1 2.1 0 0 1 10 20.1 A1.05 1.05 0 0 1 10 18 A1.05 1.05 0 0 0 10 15.9 Z" fill="#DA2032" />
    </svg>
  );
}

function UnitedKingdomFlag() {
  const id = useId();
  const clip = `${id}-clip`;
  const diagonal = `${id}-diag`;
  return (
    <svg viewBox="0 0 60 30" aria-hidden="true" className="h-full w-full">
      <clipPath id={clip}>
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <clipPath id={diagonal}>
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#${diagonal})`} stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

const FLAGS: Record<Locale, () => React.JSX.Element> = { mn: MongoliaFlag, en: UnitedKingdomFlag };

// Нягт хэл сонгогч: зөвхөн шилжих хэлний тугийг харуулна (монголоор байхад 🇬🇧, англиар байхад 🇲🇳).
export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const next: Locale = locale === "mn" ? "en" : "mn";
  const Flag = FLAGS[next];
  return (
    <button
      type="button"
      lang={next}
      onClick={() => setLocale(next)}
      aria-label={t.switchLanguage}
      title={t.switchLanguage}
      className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl border border-slate-700 hover:border-slate-500 hover:bg-slate-800 transition-colors"
    >
      <span className="block h-3 w-6 overflow-hidden rounded-[3px] ring-1 ring-white/20">
        <Flag />
      </span>
    </button>
  );
}
