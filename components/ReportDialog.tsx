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
import { X } from "lucide-react";
import KeyIcon from "@/components/KeyIcon";

const inputClass =
  "w-full bg-sheet border border-line-strong rounded-md p-2.5 text-ink focus:outline-none focus:border-azure";

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
      className="fixed inset-0 bg-night/55 z-[1200] flex items-stretch sm:items-center justify-center p-0 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
        className="relative bg-sheet sm:border border-line w-full max-w-lg rounded-none sm:rounded-md shadow-dialog h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[88vh] overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6 space-y-4"
      >
        <div className="sticky top-0 z-10 -mx-5 sm:-mx-6 px-5 sm:px-6 pt-5 sm:pt-6 pb-3 bg-sheet border-b border-line flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="report-dialog-title" className="text-lg font-bold text-ink">
              {t.reportTitle}
            </h2>
            <p className="text-xs text-ink-muted truncate">{spot.name}</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label={t.close}
            className="flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-panel text-ink hover:bg-line transition-colors"
          >
            <X aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>

        {!isLoaded ? null : !user ? (
          <div className="bg-panel border border-line rounded-md p-4 text-center space-y-2 text-xs">
            <p className="text-ink-muted">{t.signInToReport}</p>
            <SignInButton mode="modal">
              <button className="bg-azure hover:bg-azure-deep text-white px-4 py-2 rounded-md font-semibold">
                {t.signIn}
              </button>
            </SignInButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <p className="text-sm text-ink-muted">{t.reportIntro(spot.name)}</p>
            <fieldset className="space-y-2">
              <legend className="text-ink-muted mb-2">{t.reportWhat}</legend>
              <div className="flex flex-wrap gap-1.5">
                {REPORT_TOPICS.map((topic) => {
                  const selected = topics.includes(topic.key);
                  return (
                    <button
                      key={topic.key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggle(topic.key)}
                      className={`px-2.5 py-1.5 rounded-md border text-xs transition-colors ${
                        selected
                          ? "bg-sun-soft border-sun/40 text-sun-deep"
                          : "bg-panel border-line text-ink-muted hover:border-line-strong"
                      }`}
                    >
                      <KeyIcon k={topic.key === "other" ? "other-message" : topic.key} className="h-3.5 w-3.5 inline -mt-0.5" /> {topic.label[locale]}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div>
              <label htmlFor="report-message" className="block text-ink-muted mb-1">
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
            {error ? <p className="text-danger">{error}</p> : null}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-sun hover:bg-sun disabled:opacity-60 text-night font-semibold py-2.5 rounded-md"
            >
              {saving ? t.sending : t.reportSend}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
