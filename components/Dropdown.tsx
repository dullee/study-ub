"use client";

import { ReactNode, useEffect, useId, useRef, useState } from "react";

interface DropdownProps {
  label: ReactNode;
  // Товч идэвхтэй (ж: шүүлтүүр сонгосон) үед өнгөөр ялгана.
  active?: boolean;
  align?: "left" | "right";
  // Функц өгвөл цэсний зүйл сонгосны дараа хаах close()-ийг дамжуулна.
  children: ReactNode | ((close: () => void) => ReactNode);
  buttonClassName?: string;
  ariaLabel?: string;
  // Нягт товчинд (ж: header-ийн ➕) доош заасан сумыг нуух.
  hideCaret?: boolean;
}

// Товч дарахад доош нээгддэг цэс. Гадна дарах эсвэл Esc дарахад хаагдана.
export default function Dropdown({
  label,
  active = false,
  align = "left",
  children,
  buttonClassName,
  ariaLabel,
  hideCaret = false,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="sm:relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={ariaLabel}
        onClick={() => setOpen((value) => !value)}
        className={
          buttonClassName ??
          `h-10 px-3 rounded-xl text-xs font-semibold border flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            active || open
              ? "bg-indigo-600 border-indigo-500 text-white"
              : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
          }`
        }
      >
        {label}
        {hideCaret ? null : (
          <span aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`}>
            ▾
          </span>
        )}
      </button>
      {open ? (
        <div
          id={panelId}
          className={`absolute top-full mt-2 z-50 inset-x-4 sm:inset-x-auto sm:w-[22rem] max-h-[70dvh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 space-y-3 ${
            align === "right" ? "sm:right-0" : "sm:left-0"
          }`}
        >
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      ) : null}
    </div>
  );
}
