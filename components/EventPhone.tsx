"use client";

import { FormEvent, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { StudyEvent } from "@/types";
import { deleteEventPhone, fetchEventPhone, saveEventPhone } from "@/lib/supabase/events";
import { loadLocalEventPhone, saveLocalEventPhone } from "@/lib/localStore";
import { normalizePhone, telHref } from "@/lib/phone";
import { useI18n } from "@/components/LanguageProvider";

interface EventPhoneProps {
  event: StudyEvent;
  // Бүртгүүлсэн эсвэл зохион байгуулагч — зөвхөн тэд дугаарыг харна (RLS ч мөн шалгана).
  isMember: boolean;
  isHost: boolean;
  usingRemote: boolean;
}

// Зохион байгуулагчийн утас: ирэх хүмүүст "залгах" товч, зохион байгуулагчид нэмэх/солих/устгах.
// Нэвтрэх уриалгыг групп чатын хэсэг харуулдаг тул энд давтахгүй.
export default function EventPhone({ event, isMember, isHost, usingRemote }: EventPhoneProps) {
  const { t } = useI18n();
  const { user, isLoaded } = useUser();
  // undefined — ачаалж байна, null — дугаар алга.
  const [phone, setPhone] = useState<string | null | undefined>(undefined);
  const [loadFailed, setLoadFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const canSee = Boolean(user) && isMember;

  useEffect(() => {
    if (!canSee) return;
    let cancelled = false;
    (async () => {
      const value = usingRemote ? await fetchEventPhone(event.id) : loadLocalEventPhone(event.id);
      if (cancelled) return;
      setLoadFailed(value === undefined);
      setPhone(value ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [canSee, event.id, usingRemote]);

  if (!isLoaded || !user) return null;

  const persist = async (value: string | null) => {
    setSaving(true);
    setError("");
    let ok = true;
    if (usingRemote) ok = value ? await saveEventPhone(event.id, value) : await deleteEventPhone(event.id);
    else saveLocalEventPhone(event.id, value);
    setSaving(false);
    if (!ok) {
      setError(t.phoneSaveFailed);
      return;
    }
    setPhone(value);
    setEditing(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const value = normalizePhone(draft);
    if (!value) {
      setError(t.phoneInvalid);
      return;
    }
    persist(value);
  };

  const startEditing = () => {
    setDraft(phone ?? "");
    setError("");
    setEditing(true);
  };

  return (
    <section className="space-y-2 bg-slate-800/30 border border-slate-800 rounded-xl p-4" aria-label={t.phoneHeading}>
      <h3 className="text-sm font-semibold text-slate-200">📞 {t.phoneHeading}</h3>

      {!isMember ? (
        <p className="text-xs text-slate-400">🔒 {t.phoneLocked}</p>
      ) : phone === undefined ? (
        <div className="h-11 rounded-xl bg-slate-800/60 animate-pulse" aria-hidden="true" />
      ) : editing ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <label className="block text-xs text-slate-400" htmlFor={`event-phone-${event.id}`}>
            {t.phoneLabel}
          </label>
          <input
            id={`event-phone-${event.id}`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t.phonePlaceholder}
            autoFocus
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-60"
            >
              {saving ? t.saving : t.save}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              {t.cancel}
            </button>
          </div>
        </form>
      ) : phone ? (
        <div className="space-y-2">
          <a
            href={telHref(phone)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all"
          >
            <span aria-hidden="true">📞</span>
            {t.callPhone(phone)}
          </a>
          {isHost ? (
            <div className="flex justify-center gap-3 text-xs">
              <button type="button" onClick={startEditing} className="text-indigo-300 hover:text-white">
                {t.changePhone}
              </button>
              <button
                type="button"
                onClick={() => persist(null)}
                disabled={saving}
                className="text-rose-300 hover:text-white"
              >
                {t.removePhone}
              </button>
            </div>
          ) : null}
        </div>
      ) : isHost ? (
        <button
          type="button"
          onClick={startEditing}
          className="w-full py-2.5 rounded-xl border border-dashed border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 text-sm font-semibold"
        >
          {t.addPhone}
        </button>
      ) : (
        <p className="text-xs text-slate-500">{loadFailed ? t.phoneLoadFailed : t.phoneNone}</p>
      )}

      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
    </section>
  );
}
