"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  // danger — устгах, татгалзах (улаан); approve — зөвшөөрөх (ногоон).
  tone?: "danger" | "approve";
};

const TONES = {
  danger: { icon: "⚠", iconClass: "bg-rose-500/15 text-rose-400", buttonClass: "bg-rose-600 hover:bg-rose-500" },
  approve: { icon: "✓", iconClass: "bg-emerald-500/15 text-emerald-400", buttonClass: "bg-emerald-600 hover:bg-emerald-500" },
};

type Pending = ConfirmOptions & { resolve: (confirmed: boolean) => void };

// Устгах, зөвшөөрөх, татгалзах гэх мэт чухал үйлдлийн өмнө баталгаажуулна.
// const [confirm, confirmDialog] = useConfirm(); ... if (await confirm({...})) { ... }  — confirmDialog-ийг JSX-д байрлуулна.
export function useConfirm(): [(options: ConfirmOptions) => Promise<boolean>, ReactNode] {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    []
  );

  const close = (confirmed: boolean) => {
    pending?.resolve(confirmed);
    setPending(null);
  };

  const dialog = pending ? (
    <ConfirmDialog {...pending} onCancel={() => close(false)} onConfirm={() => close(true)} />
  ) : null;

  return [confirm, dialog];
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  onCancel,
  onConfirm,
}: ConfirmOptions & { onCancel: () => void; onConfirm: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const style = TONES[tone];

  // Эхний focus "Болих" дээр — Enter санамсаргүй дарахад устгахгүй. Esc дарахад цуцална.
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[1300] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4"
      >
        <div className="flex gap-3">
          <span
            aria-hidden="true"
            className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-lg ${style.iconClass}`}
          >
            {style.icon}
          </span>
          <div className="space-y-1">
            <h2 id="confirm-title" className="font-semibold text-white">
              {title}
            </h2>
            <p id="confirm-message" className="text-sm text-slate-400">
              {message}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-semibold text-slate-100"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${style.buttonClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
