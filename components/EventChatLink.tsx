"use client";

import { FormEvent, useEffect, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { StudyEvent } from "@/types";
import { deleteChatLink, fetchChatLink, saveChatLink } from "@/lib/supabase/events";
import { loadLocalChatLink, saveLocalChatLink } from "@/lib/localStore";
import { chatPlatform, normalizeChatUrl } from "@/lib/chatLinks";
import { useI18n } from "@/components/LanguageProvider";
import { Lock, MessageCircle } from "lucide-react";

interface EventChatLinkProps {
  event: StudyEvent;
  // Бүртгүүлсэн эсвэл зохион байгуулагч — зөвхөн тэд холбоосыг харна (RLS ч мөн шалгана).
  isMember: boolean;
  isHost: boolean;
  usingRemote: boolean;
}

// Эвентийн гадаад групп чат (WhatsApp, Discord, Telegram...) — хүмүүс эвентийн өмнө, дараа холбогдоно.
export default function EventChatLink({ event, isMember, isHost, usingRemote }: EventChatLinkProps) {
  const { t } = useI18n();
  const { user, isLoaded } = useUser();
  // undefined — ачаалж байна, null — холбоос алга.
  const [link, setLink] = useState<string | null | undefined>(undefined);
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
      const value = usingRemote ? await fetchChatLink(event.id) : loadLocalChatLink(event.id);
      if (cancelled) return;
      setLoadFailed(value === undefined);
      setLink(value ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [canSee, event.id, usingRemote]);

  const startEditing = () => {
    setDraft(link ?? "");
    setError("");
    setEditing(true);
  };

  const persist = async (url: string | null) => {
    setSaving(true);
    setError("");
    let ok = true;
    if (usingRemote) ok = url ? await saveChatLink(event.id, url) : await deleteChatLink(event.id);
    else saveLocalChatLink(event.id, url);
    setSaving(false);
    if (!ok) {
      setError(t.chatLinkSaveFailed);
      return;
    }
    setLink(url);
    setEditing(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const url = normalizeChatUrl(draft);
    if (!url) {
      setError(t.chatLinkInvalid);
      return;
    }
    persist(url);
  };

  const platform = link ? chatPlatform(link) : null;

  return (
    <section className="space-y-3 bg-panel border border-line rounded-md p-4" aria-label={t.chatHeading}>
      <div>
        <h3 className="text-sm font-semibold text-ink">{t.chatHeading}</h3>
        <p className="text-xs text-ink-muted">{t.chatIntro}</p>
      </div>

      {!isLoaded ? null : !user ? (
        <div className="text-center space-y-2 text-xs">
          <p className="text-ink-muted">{t.chatSignIn}</p>
          <SignInButton mode="modal">
            <button className="bg-azure hover:bg-azure-deep text-white px-4 py-2 rounded-md font-semibold">
              {t.signIn}
            </button>
          </SignInButton>
        </div>
      ) : !isMember ? (
        <p className="text-xs text-ink-muted"><Lock aria-hidden="true" className="h-3.5 w-3.5 inline -mt-0.5 mr-1" strokeWidth={2} />{t.chatLocked}</p>
      ) : link === undefined ? (
        <div className="h-11 rounded-md bg-panel animate-pulse" aria-hidden="true" />
      ) : editing ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <label className="block text-xs text-ink-muted" htmlFor={`chat-link-${event.id}`}>
            {t.chatLinkLabel}
          </label>
          <input
            id={`chat-link-${event.id}`}
            type="url"
            inputMode="url"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t.chatLinkPlaceholder}
            autoFocus
            className="w-full bg-panel border border-line rounded-md p-2.5 text-sm text-ink focus:outline-none focus:border-azure"
          />
          <p className="text-[11px] text-ink-muted">{t.chatLinkHint}</p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-md bg-azure hover:bg-azure-deep text-white text-xs font-semibold disabled:opacity-60"
            >
              {saving ? t.saving : t.save}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="px-4 py-2 rounded-md bg-panel text-ink text-xs font-semibold"
            >
              {t.cancel}
            </button>
          </div>
        </form>
      ) : link && platform ? (
        <div className="space-y-2">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-2 w-full py-3 rounded-md text-ink text-sm font-semibold transition-all ${platform.className}`}
          >
            <MessageCircle aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
            {platform.name ? t.joinChatOn(platform.name) : t.joinChat}
          </a>
          {isHost ? (
            <div className="flex justify-center gap-3 text-xs">
              <button type="button" onClick={startEditing} className="text-link hover:text-ink">
                {t.changeChatLink}
              </button>
              <button
                type="button"
                onClick={() => persist(null)}
                disabled={saving}
                className="text-danger hover:text-ink"
              >
                {t.removeChatLink}
              </button>
            </div>
          ) : null}
        </div>
      ) : isHost ? (
        <button
          type="button"
          onClick={startEditing}
          className="w-full py-2.5 rounded-md border border-dashed border-line-strong text-ink-muted hover:text-ink hover:border-line-strong text-sm font-semibold"
        >
          {t.addChatLink}
        </button>
      ) : (
        <p className="text-xs text-ink-muted">{loadFailed ? t.chatLoadFailed : t.chatNone}</p>
      )}

      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </section>
  );
}
