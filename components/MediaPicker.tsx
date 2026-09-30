"use client";

import { ChangeEvent, useRef, useState } from "react";
import { SpotMedia } from "@/types";
import { isCloudinaryConfigured, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, uploadMedia } from "@/lib/cloudinary";
import { isFacebookPostPermalink, isInstagramStory, isShortSocialLink, parseSocialLink } from "@/lib/socialMedia";
import { MediaThumb } from "@/components/MediaGallery";
import { useI18n } from "@/components/LanguageProvider";

export const MAX_MEDIA = 30; // supabase/migrations/20260925000004_spot_media.sql-тэй тохирно.

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i;

interface MediaPickerProps {
  value: SpotMedia[];
  onChange: (value: SpotMedia[]) => void;
  // Хуулж байх үед маягтыг илгээхгүй байхын тулд эцэг компонентод мэдэгдэнэ.
  onUploadingChange?: (uploading: boolean) => void;
}

// Нэмэлт зураг, бичлэг: олныг зэрэг сонгоход шууд Cloudinary руу хуулж, жижиг зургаар харуулна.
// Холбоосоор ч нэмнэ: YouTube, TikTok, Instagram, Facebook, X, Vimeo пост/бичлэг эсвэл зураг, бичлэгийн шууд холбоос.
export default function MediaPicker({ value, onChange, onUploadingChange }: MediaPickerProps) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [link, setLink] = useState("");
  const [resolving, setResolving] = useState(false);
  // Засаж буй холбоосын байрлал: null — шинээр нэмнэ.
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const setBusy = (count: number) => {
    setUploading(count);
    onUploadingChange?.(count > 0);
  };

  const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    const problems: string[] = [];
    const room = MAX_MEDIA - value.length;
    if (files.length > room) problems.push(t.mediaLimit(MAX_MEDIA));
    const accepted = files.slice(0, Math.max(room, 0)).filter((file) => {
      const isVideo = file.type.startsWith("video/");
      if (!isVideo && !file.type.startsWith("image/")) {
        problems.push(t.onlyImages);
        return false;
      }
      if (file.size > (isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) {
        problems.push(t.mediaTooBig(file.name));
        return false;
      }
      return true;
    });
    setErrors(problems);
    if (accepted.length === 0) return;

    setBusy(accepted.length);
    const results = await Promise.allSettled(accepted.map((file) => uploadMedia(file)));
    const added: SpotMedia[] = [];
    results.forEach((result, index) => {
      if (result.status === "fulfilled") added.push(result.value);
      else {
        console.error("Media upload:", result.reason);
        problems.push(t.mediaUploadFailed(accepted[index].name));
      }
    });
    setErrors([...problems]);
    onChange([...value, ...added]);
    setBusy(0);
  };

  const addLink = async () => {
    let trimmed = link.trim();
    if (!trimmed) return;
    if (editingIndex === null && value.length >= MAX_MEDIA) {
      setErrors([t.mediaLimit(MAX_MEDIA)]);
      return;
    }
    if (isInstagramStory(trimmed)) {
      setErrors([t.mediaStoryUnsupported]);
      return;
    }
    // Утаснаас хуваалцсан богино холбоос (vt.tiktok.com, fb.watch, instagram.com/share/…) — сервер дээр жинхэнэ холбоос руу нь.
    const wasShort = isShortSocialLink(trimmed);
    // Facebook story.php пост — reel бол бичлэгийн хаягийг нь олохыг оролдоно; бүтэхгүй бол постоор нь нэмнэ.
    if (wasShort || isFacebookPostPermalink(trimmed)) {
      setResolving(true);
      try {
        const res = await fetch(`/api/media/resolve?url=${encodeURIComponent(trimmed)}`, {
          signal: AbortSignal.timeout(10000),
        });
        const body = await res.json();
        if (res.ok && body.url) trimmed = body.url;
      } catch {
        // Доорх шалгалт алдааг харуулна.
      } finally {
        setResolving(false);
      }
    }
    const social = parseSocialLink(trimmed);
    let item: SpotMedia | null = social ? { url: social.url, type: "social", platform: social.platform } : null;
    if (!item) {
      try {
        const url = new URL(trimmed);
        // Сошиал сүлжээний таньж чадаагүй холбоос (профайл, хайлт гэх мэт) зураг биш — буруу гэж үзнэ.
        const socialHost = /(^|\.)(youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com|fb\.watch|x\.com|twitter\.com|vimeo\.com)$/i;
        if (url.protocol === "https:" && !socialHost.test(url.hostname)) {
          item = { url: url.href, type: VIDEO_EXT.test(url.pathname) ? "video" : "image" };
        }
      } catch {
        item = null;
      }
    }
    if (!item) {
      setErrors([wasShort ? t.mediaShortLinkFailed : t.mediaUrlInvalid]);
      return;
    }
    if (value.some((existing, index) => existing.url === item.url && index !== editingIndex)) {
      setErrors([t.mediaDuplicate]);
      return;
    }
    const saved = item;
    onChange(editingIndex === null ? [...value, saved] : value.map((existing, index) => (index === editingIndex ? saved : existing)));
    setEditingIndex(null);
    setLink("");
    setErrors([]);
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
    if (editingIndex !== null) cancelEdit();
  };

  // Холбоосоор нэмсэн зүйлийн холбоосыг солих (Cloudinary-д хуулсан файлыг биш).
  const isLink = (item: SpotMedia) => item.type === "social" || !item.url.includes("res.cloudinary.com");
  const startEdit = (index: number) => {
    setEditingIndex(index);
    setLink(value[index].url);
    setErrors([]);
    linkInputRef.current?.focus();
    linkInputRef.current?.select();
  };
  const cancelEdit = () => {
    setEditingIndex(null);
    setLink("");
    setErrors([]);
  };

  return (
    <div className="space-y-2">
      {value.length > 0 || uploading > 0 ? (
        <ul className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {value.map((item, index) => (
            <li key={`${item.url}-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
              <MediaThumb item={item} />
              {isLink(item) ? (
                <button
                  type="button"
                  onClick={() => startEdit(index)}
                  aria-label={t.editMediaLink}
                  title={t.editMediaLink}
                  className={`absolute top-1 left-1 h-6 w-6 rounded-full text-white text-xs ${
                    editingIndex === index ? "bg-indigo-600" : "bg-slate-950/80 hover:bg-indigo-600"
                  }`}
                >
                  ✏️
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={t.removeMedia}
                title={t.removeMedia}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-slate-950/80 text-white text-xs hover:bg-rose-600"
              >
                ✕
              </button>
            </li>
          ))}
          {Array.from({ length: uploading }).map((_, index) => (
            <li
              key={`uploading-${index}`}
              className="aspect-square rounded-lg border border-dashed border-slate-600 bg-slate-800/60 animate-pulse flex items-center justify-center text-[10px] text-slate-400 text-center px-1"
            >
              {t.mediaUploading}
            </li>
          ))}
        </ul>
      ) : null}

      {isCloudinaryConfigured ? (
        <label className="flex items-center justify-center gap-2 w-full cursor-pointer rounded-lg border border-dashed border-slate-600 hover:border-indigo-500 bg-slate-800/40 px-3 py-2.5 text-slate-300 hover:text-white">
          {t.addMedia}
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            disabled={uploading > 0 || value.length >= MAX_MEDIA}
            onChange={handleFiles}
            className="sr-only"
          />
        </label>
      ) : null}
      <div className="flex gap-2">
        <input
          ref={linkInputRef}
          type="url"
          inputMode="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addLink();
            }
          }}
          placeholder={t.mediaUrlPlaceholder}
          aria-label={t.mediaLinkLabel}
          className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
        />
        <button
          type="button"
          onClick={addLink}
          disabled={resolving || !link.trim()}
          className="shrink-0 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold"
        >
          {resolving ? "…" : editingIndex !== null ? t.save : t.addLink}
        </button>
        {editingIndex !== null ? (
          <button type="button" onClick={cancelEdit} className="shrink-0 px-3 rounded-lg bg-slate-700 text-slate-200 font-semibold">
            {t.cancel}
          </button>
        ) : null}
      </div>
      <p className="text-slate-500">{t.mediaHint}</p>
      {errors.map((message, index) => (
        <p key={index} className="text-rose-400">
          {message}
        </p>
      ))}
    </div>
  );
}
