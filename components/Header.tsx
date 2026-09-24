"use client";

import Link from "next/link";

interface HeaderProps {
  onAddClick: () => void;
}

export default function Header({ onAddClick }: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-[1000]">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl p-2 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
            💻
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              StudySpots{" "}
              <span className="text-xs font-mono bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                UB
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Улаанбаатарын тухтай, Wi-Fi хурдан, чимээгүй газруудын гид
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin"
            className="text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold border border-slate-700 hover:border-slate-500"
          >
            Админ
          </Link>
          <button
            onClick={onAddClick}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1"
          >
            <span>➕</span> Шинэ газар нэмэх
          </button>
        </div>
      </div>
    </header>
  );
}
