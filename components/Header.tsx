"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useHeightVar } from "@/lib/useHeightVar";
import { useI18n } from "@/components/LanguageProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Dropdown from "@/components/Dropdown";
import MySubmissionsDialog from "@/components/MySubmissionsDialog";
import { useMySubmissions } from "@/lib/useMySubmissions";

interface HeaderProps {
  onAddClick: () => void;
  addLabel?: string;
}

const TABS = [
  { href: "/", label: "navPlaces" },
  { href: "/events", label: "navEvents" },
] as const;

export default function Header({ onAddClick, addLabel }: HeaderProps) {
  const { t } = useI18n();
  const addText = addLabel ?? t.addPlace;
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const { submissions, pendingCount } = useMySubmissions();
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const closeSubmissions = useCallback(() => setSubmissionsOpen(false), []);
  const hasSubmissions = submissions.length > 0;

  // Header-ийн өндрийг --header-h болгон нийтэлнэ — том дэлгэцэнд шүүлтүүр, газрын зураг түүний доор наалдана.
  // Утсан дээр header наалдахгүй — дэлгэцийн зайг хэмнэж, зөвхөн шүүлтүүрийн мөр наалдана.
  useHeightVar(headerRef, "--header-h");

  return (
    <header
      ref={headerRef}
      className="border-b border-slate-800 bg-slate-900/90 backdrop-blur relative lg:sticky lg:top-0 z-[1000]"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              StudySpots{" "}
              <span className="hidden sm:inline text-xs font-mono bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                UB
              </span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Утсан дээр илгээсэн газар байвал ➕ нь "нэмэх / миний илгээсэн" цэс; эс бөгөөс шууд нэмнэ. */}
          <div className={hasSubmissions ? "sm:hidden" : "hidden"}>
            <Dropdown
              align="right"
              hideCaret
              ariaLabel={`${addText} · ${t.mySubmissions}`}
              buttonClassName="relative bg-indigo-600 hover:bg-indigo-500 text-white h-9 w-9 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center"
              label={
                <>
                  <span aria-hidden="true">➕</span>
                  {pendingCount > 0 ? (
                    <span className="absolute -top-1.5 -right-1.5 min-w-5 rounded-full bg-amber-500 text-slate-950 px-1 text-[10px] leading-5 text-center">
                      {pendingCount}
                    </span>
                  ) : null}
                </>
              }
            >
              {(close) => (
                <div className="grid gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      onAddClick();
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold"
                  >
                    <span aria-hidden="true">➕</span> {addText}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      setSubmissionsOpen(true);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-sm font-semibold"
                  >
                    <span aria-hidden="true">⏳</span> {t.mySubmissions}
                    <span className="ml-auto min-w-5 rounded-full bg-amber-500 text-slate-950 px-1.5 text-[10px] leading-5 text-center">
                      {pendingCount}
                    </span>
                  </button>
                </div>
              )}
            </Dropdown>
          </div>
          <button
            onClick={onAddClick}
            aria-label={addText}
            title={addText}
            className={`${hasSubmissions ? "hidden sm:flex" : "flex"} bg-indigo-600 hover:bg-indigo-500 text-white h-9 w-9 sm:w-auto sm:px-4 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all items-center justify-center gap-1`}
          >
            <span aria-hidden="true">➕</span>
            <span className="hidden sm:inline">{addText}</span>
          </button>
          {hasSubmissions ? (
            <button
              type="button"
              onClick={() => setSubmissionsOpen(true)}
              title={t.mySubmissionsPending(pendingCount)}
              aria-label={`${t.mySubmissions}: ${t.mySubmissionsPending(pendingCount)}`}
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 whitespace-nowrap"
            >
              <span aria-hidden="true">⏳</span>
              <span className="hidden md:inline">{t.mySubmissions}</span>
              <span className="min-w-5 rounded-full bg-amber-500 text-slate-950 px-1.5 text-[10px] leading-5 text-center">
                {pendingCount}
              </span>
            </button>
          ) : null}
          <LanguageSwitcher />
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="text-slate-300 hover:text-white h-9 px-3 rounded-xl text-xs font-semibold border border-slate-700 hover:border-slate-500">
                {t.signIn}
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="hidden sm:block bg-white/10 hover:bg-white/20 text-white h-9 px-3 rounded-xl text-xs font-semibold">
                {t.signUp}
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
      <nav className="max-w-7xl mx-auto px-4 flex gap-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                active
                  ? "border-indigo-500 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {t[tab.label]}
            </Link>
          );
        })}
      </nav>
      {/* header-ийн backdrop-blur нь fixed элементийг header дотор барьдаг — цонхыг body-д зурна. */}
      {submissionsOpen && hasSubmissions
        ? createPortal(<MySubmissionsDialog spots={submissions} onClose={closeSubmissions} />, document.body)
        : null}
    </header>
  );
}
