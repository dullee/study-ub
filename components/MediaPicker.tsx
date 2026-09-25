"use client";

import { ChangeEvent, useState } from "react";
import { SpotMedia } from "@/types";
import { isCloudinaryConfigured, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, uploadMedia, videoPoster } from "@/lib/cloudinary";
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
// Cloudinary тохируулаагүй бол холбоосоор нэмнэ.
export default function MediaPicker({ value, onChange, onUploadingChange }: MediaPickerProps) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [link, setLink] = useState("");

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

  const addLink = () => {
    const trimmed = link.trim();
    try {
      const url = new URL(trimmed);
      if (url.protocol !== "https:") throw new Error();
      if (value.length >= MAX_MEDIA) {
        setErrors([t.mediaLimit(MAX_MEDIA)]);
        return;
      }
      onChange([...value, { url: url.href, type: VIDEO_EXT.test(url.pathname) ? "video" : "image" }]);
      setLink("");
      setErrors([]);
    } catch {
      setErrors([t.mediaUrlInvalid]);
    }
  };

  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      {value.length > 0 || uploading > 0 ? (
        <ul className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {value.map((item, index) => (
            <li key={`${item.url}-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
              {item.type === "video" ? (
                videoPoster(item.url) ? (
                  <img src={videoPoster(item.url)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <video src={item.url} preload="metadata" muted className="h-full w-full object-cover" />
                )
              ) : (
                <img src={item.url} alt="" className="h-full w-full object-cover" />
              )}
              {item.type === "video" ? (
                <span className="absolute bottom-1 left-1 text-[10px] font-semibold bg-slate-950/80 text-white px-1.5 rounded">
                  ▶ {t.video}
                </span>
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
      ) : (
        <div className="flex gap-2">
          <input
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
            className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
          />
          <button type="button" onClick={addLink} className="shrink-0 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
            {t.addLink}
          </button>
        </div>
      )}
      <p className="text-slate-500">{t.mediaHint}</p>
      {errors.map((message, index) => (
        <p key={index} className="text-rose-400">
          {message}
        </p>
      ))}
    </div>
  );
}
