"use client";

import Link from "next/link";
import { useRef } from "react";
import { useHeightVar } from "@/lib/useHeightVar";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

interface HeaderProps {
  onAddClick: () => void;
  addLabel?: string;
  // Нүүрний "бүтэн өргөн" горимд header-ийн агуулга ч бүтэн өргөнөөр.
  wide?: boolean;
}

const TABS = [
  { href: "/", label: "📍 Газрууд" },
  { href: "/events", label: "📅 Эвентүүд" },
];

export default function Header({ onAddClick, addLabel = "Шинэ газар нэмэх", wide = false }: HeaderProps) {
  const widthClass = wide ? "max-w-none" : "max-w-7xl";
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);

  // Header-ийн өндрийг --header-h болгон нийтэлнэ — том дэлгэцэнд шүүлтүүр, газрын зураг түүний доор наалдана.
  // Утсан дээр header наалдахгүй — дэлгэцийн зайг хэмнэж, зөвхөн шүүлтүүрийн мөр наалдана.
  useHeightVar(headerRef, "--header-h");

  return (
    <header
      ref={headerRef}
      className="border-b border-slate-800 bg-slate-900/90 backdrop-blur relative lg:sticky lg:top-0 z-[1000]"
    >
      <div className={`${widthClass} mx-auto px-4 py-3 sm:py-4 flex justify-between items-center gap-3`}>
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <span className="text-xl sm:text-2xl p-1.5 sm:p-2 bg-indigo-600/20 rounded-xl border border-indigo-500/30 shrink-0">
            💻
          </span>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              StudySpots{" "}
              <span className="text-xs font-mono bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                UB
              </span>
            </h1>
            <p className="hidden sm:block text-xs text-slate-400">
              Улаанбаатарын тухтай, Wi-Fi хурдан, чимээгүй газруудын гид
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onAddClick}
            aria-label={addLabel}
            title={addLabel}
            className="bg-indigo-600 hover:bg-indigo-500 text-white h-9 px-3 sm:px-4 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1"
          >
            <span aria-hidden="true">➕</span>
            <span className="hidden sm:inline">{addLabel}</span>
          </button>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="text-slate-300 hover:text-white h-9 px-3 rounded-xl text-xs font-semibold border border-slate-700 hover:border-slate-500">
                Нэвтрэх
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="hidden sm:block bg-white/10 hover:bg-white/20 text-white h-9 px-3 rounded-xl text-xs font-semibold">
                Бүртгүүлэх
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
      <nav className={`${widthClass} mx-auto px-4 flex gap-1`}>
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
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
