"use client";

import { FormEvent, useState } from "react";
import { useI18n } from "@/components/LanguageProvider";
import { StudyEvent, StudySpot } from "@/types";
import { normalizeChatUrl } from "@/lib/chatLinks";

export type EventDraft = Omit<StudyEvent, "id" | "created_at" | "host_name" | "user_id">;

interface AddEventModalProps {
  isOpen: boolean;
  spots: StudySpot[];
  hostName: string;
  onClose: () => void;
  // chatUrl — групп чатын холбоос (заавал биш), эвент үүссэний дараа тусад нь хадгалагдана.
  onAddEvent: (event: EventDraft, chatUrl: string | null) => Promise<boolean>;
}

const OTHER_PLACE = "other";

function toLocalInput(ms: number) {
  const date = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

const inputClass =
  "w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500";

const emptyForm = {
  title: "",
  spotId: "",
  customPlace: "",
  startsAt: "",
  maxPeople: "",
  description: "",
  chatUrl: "",
};

export default function AddEventModal({
  isOpen,
  spots,
  hostName,
  onClose,
  onAddEvent,
}: AddEventModalProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [minStart] = useState(() => toLocalInput(Date.now()));

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const spot = spots.find((item) => String(item.id) === formData.spotId);
    const placeName = spot ? spot.name : formData.customPlace.trim();
    if (!placeName) return;
    const startsAt = new Date(formData.startsAt).getTime();
    if (startsAt < Date.now()) {
      setError(t.eventInPast);
      return;
    }
    const chatUrl = formData.chatUrl.trim() ? normalizeChatUrl(formData.chatUrl) : null;
    if (formData.chatUrl.trim() && !chatUrl) {
      setError(t.chatLinkInvalid);
      return;
    }
    setSaving(true);
    setError("");
    const ok = await onAddEvent({
      title: formData.title.trim(),
      description: formData.description.trim(),
      spot_id: spot?.id ?? null,
      place_name: placeName,
      lat: spot?.lat ?? null,
      lng: spot?.lng ?? null,
      starts_at: new Date(formData.startsAt).toISOString(),
      max_people: formData.maxPeople ? Number(formData.maxPeople) : null,
    }, chatUrl);
    setSaving(false);
    if (!ok) {
      setError(t.eventSaveFailed);
      return;
    }
    onClose();
    setFormData(emptyForm);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[1100] flex items-stretch sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 sm:border border-slate-800 w-full max-w-lg rounded-none sm:rounded-2xl px-5 pb-5 sm:px-6 sm:pb-6 space-y-4 relative shadow-2xl h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 -mx-5 sm:-mx-6 px-5 sm:px-6 pt-5 sm:pt-6 pb-3 bg-slate-900 flex justify-between items-center border-b border-slate-800">
          <h3 className="text-base font-bold text-white">{t.createEventTitle}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg" type="button">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">{t.eventTitle}</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t.eventTitlePlaceholder}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">{t.eventPlace}</label>
            <select
              required
              value={formData.spotId}
              onChange={(e) => setFormData({ ...formData, spotId: e.target.value })}
              className={inputClass}
            >
              <option value="" disabled>
                {t.choosePlace}
              </option>
              {spots.map((spot) => (
                <option key={spot.id} value={spot.id}>
                  {spot.name} — {spot.location}
                </option>
              ))}
              <option value={OTHER_PLACE}>{t.otherPlace}</option>
            </select>
          </div>
          {formData.spotId === OTHER_PLACE ? (
            <div>
              <label className="block text-slate-400 mb-1">{t.placeName}</label>
              <input
                type="text"
                required
                value={formData.customPlace}
                onChange={(e) => setFormData({ ...formData, customPlace: e.target.value })}
                placeholder={t.placeNamePlaceholder}
                className={inputClass}
              />
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">{t.dateTime}</label>
              <input
                type="datetime-local"
                required
                min={minStart}
                value={formData.startsAt}
                onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">{t.maxPeople}</label>
              <input
                type="number"
                min={1}
                value={formData.maxPeople}
                onChange={(e) => setFormData({ ...formData, maxPeople: e.target.value })}
                placeholder={t.unlimited}
                className={inputClass}
              />
            </div>
          </div>
          <p className="text-slate-400">
            {t.host} <span className="text-slate-200 font-semibold">{hostName}</span>
          </p>
          <div>
            <label className="block text-slate-400 mb-1">{t.eventDetails}</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t.eventDetailsPlaceholder}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">{t.chatLinkLabel}</label>
            <input
              type="url"
              inputMode="url"
              value={formData.chatUrl}
              onChange={(e) => setFormData({ ...formData, chatUrl: e.target.value })}
              placeholder={t.chatLinkPlaceholder}
              className={inputClass}
            />
            <p className="mt-1 text-slate-500">{t.chatLinkHint}</p>
          </div>
          {error ? <p className="text-rose-400">{error}</p> : null}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 mt-2"
          >
            {saving ? t.saving : t.publishEvent}
          </button>
        </form>
      </div>
    </div>
  );
}
