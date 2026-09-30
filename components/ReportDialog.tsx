"use client";

import { FormEvent, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { displayName, StudySpot } from "@/types";
import { REPORT_MESSAGE_LIMIT, REPORT_TOPICS, ReportTopic, SpotReport } from "@/lib/reports";
import { insertReport } from "@/lib/supabase/reports";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { loadLocalReports, saveLocalReports } from "@/lib/localStore";
import { useI18n } from "@/components/LanguageProvider";

const inputClass =
  "w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500";

// Газрын цонхны дээр нээгдэнэ: аль мэдээлэл буруу байгааг сонгож, тайлбар бичээд админд илгээнэ.
// Esc-ийг SpotDetailDialog барина — эхлээд энэ цонх хаагдана.
export default function ReportDialog({ spot, onClose }: { spot: Pick<StudySpot, "id" | "name">; onClose: () => void }) {
  const { t, locale } = useI18n();
  const { user, isLoaded } = useUser();
  const [topics, setTopics] = useState<ReportTopic[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = (key: ReportTopic) =>
    setTopics((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (topics.length === 0 && !message.trim()) {
      setError(t.reportNeedsSomething);
      return;
    }
    setSaving(true);
    setError("");
    const draft = {
      spot_id: spot.id,
      user_id: user.id,
      author_name: displayName(user),
      topics,
      message: message.trim(),
    };
    let saved: SpotReport | "already_reported" | null;
    if (isSupabaseConfigured) {
      saved = await insertReport(draft);
    } else {
      const all = loadLocalReports();
      if (all.some((item) => item.spot_id === spot.id && item.user_id === user.id && item.status === "open")) {
        saved = "already_reported";
      } else {
        saved = { ...draft, id: Date.now(), status: "open", created_at: new Date().toISOString(), resolved_at: null };
        saveLocalReports([saved, ...all]);
      }
    }
    setSaving(false);
    if (saved === null || saved === "already_reported") {
      setError(saved === "already_reported" ? t.reportAlready : t.reportFailed);
      return;
    }
    toast.success(t.reportSent);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/70 z-[1200] flex items-stretch sm:items-center justify-center p-0 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
        className="relative bg-slate-900 sm:border border-slate-800 w-full max-w-lg rounded-none sm:rounded-2xl shadow-2xl h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[88vh] overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6 space-y-4"
      >
        <div className="sticky top-0 z-10 -mx-5 sm:-mx-6 px-5 sm:px-6 pt-5 sm:pt-6 pb-3 bg-slate-900 border-b border-slate-800 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="report-dialog-title" className="text-lg font-bold text-white">
              {t.reportTitle}
            </h2>
            <p className="text-xs text-slate-400 truncate">{spot.name}</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label={t.close}
            className="h-10 w-10 shrink-0 rounded-full bg-slate-800 text-slate-200 hover:text-white border border-slate-700"
          >
            ✕
          </button>
        </div>

        {!isLoaded ? null : !user ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center space-y-2 text-xs">
            <p className="text-slate-400">{t.signInToReport}</p>
            <SignInButton mode="modal">
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-semibold">
                {t.signIn}
              </button>
            </SignInButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <p className="text-sm text-slate-300">{t.reportIntro(spot.name)}</p>
            <fieldset className="space-y-2">
              <legend className="text-slate-400 mb-2">{t.reportWhat}</legend>
              <div className="flex flex-wrap gap-1.5">
                {REPORT_TOPICS.map((topic) => {
                  const selected = topics.includes(topic.key);
                  return (
                    <button
                      key={topic.key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggle(topic.key)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                        selected
                          ? "bg-amber-500/20 border-amber-500 text-amber-200"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <span aria-hidden="true">{topic.icon}</span> {topic.label[locale]}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div>
              <label htmlFor="report-message" className="block text-slate-400 mb-1">
                {t.reportMessageLabel}
              </label>
              <textarea
                id="report-message"
                rows={4}
                value={message}
                maxLength={REPORT_MESSAGE_LIMIT}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.reportPlaceholder}
                className={`${inputClass} resize-none`}
              />
            </div>
            {error ? <p className="text-rose-400">{error}</p> : null}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-semibold py-2.5 rounded-xl"
            >
              {saving ? t.sending : t.reportSend}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
