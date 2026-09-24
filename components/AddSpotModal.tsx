"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import {
  ACCESSIBILITY,
  AMENITIES,
  PLACEHOLDER_IMAGE,
  SPOT_CATEGORIES,
  SpotCategory,
  StudySpot,
} from "@/types";
import ScoreFields, { ScoreValues } from "@/components/ScoreFields";
import { isCloudinaryConfigured, MAX_IMAGE_BYTES, uploadImage } from "@/lib/cloudinary";
import { isShortMapsLink, MapsLinkInfo, parseMapsLink } from "@/lib/maps";
import OptionPicker from "@/components/OptionPicker";
import { useI18n } from "@/components/LanguageProvider";

// "hint"-ийн бичвэрийг харуулахдаа сонгосон хэлээр авна; бусдыг үүсэх үед нь.
type MapsStatus = { kind: "hint" | "loading" | "ok" | "error"; text: string };

const MAPS_HINT: MapsStatus = { kind: "hint", text: "" };

interface AddSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSpot: (spot: Omit<StudySpot, "id">) => Promise<void> | void;
}

const emptyForm = {
  name: "",
  location: "",
  hours: "",
  lat: "",
  lng: "",
  image: "",
  tags: "",
  maps_url: "",
  amenities: [] as string[],
  accessibility: [] as string[],
  scores: {} as ScoreValues,
  category: "" as SpotCategory | "",
  description: "",
};

export default function AddSpotModal({ isOpen, onClose, onAddSpot }: AddSpotModalProps) {
  const { t, locale } = useI18n();
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [mapsStatus, setMapsStatus] = useState<MapsStatus>(MAPS_HINT);
  // Хамгийн сүүлд оруулсан холбоосын хариуг л ашиглана.
  const latestLink = useRef("");

  if (!isOpen) return null;

  const applyMapsInfo = (info: MapsLinkInfo) => {
    setFormData((prev) => ({
      ...prev,
      lat: String(info.lat),
      lng: String(info.lng),
      name: prev.name || info.name || "",
    }));
    setMapsStatus({ kind: "ok", text: t.mapsCoordsFound(info.lat, info.lng) });
  };

  const handleMapsLinkChange = async (value: string) => {
    setFormData((prev) => ({ ...prev, maps_url: value }));
    latestLink.current = value;
    const link = value.trim();
    if (!link) {
      setMapsStatus(MAPS_HINT);
      return;
    }
    const direct = parseMapsLink(link);
    if (direct) {
      applyMapsInfo(direct);
      return;
    }
    if (!isShortMapsLink(link)) {
      setMapsStatus({ kind: "error", text: t.mapsCoordsMissing });
      return;
    }
    setMapsStatus({ kind: "loading", text: t.mapsCoordsLoading });
    try {
      const res = await fetch(`/api/maps/resolve?url=${encodeURIComponent(link)}`);
      if (latestLink.current !== value) return;
      if (!res.ok) throw new Error();
      applyMapsInfo((await res.json()) as MapsLinkInfo);
    } catch {
      if (latestLink.current !== value) return;
      setMapsStatus({ kind: "error", text: t.mapsCoordsMissing });
    }
  };

  const resetImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setImageFile(null);
    setPreview("");
  };

  const handleClose = () => {
    resetImage();
    setError("");
    setMapsStatus(MAPS_HINT);
    onClose();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    resetImage();
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t.onlyImages);
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(t.imageTooBig);
      e.target.value = "";
      return;
    }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    let image = formData.image;
    if (imageFile) {
      try {
        image = await uploadImage(imageFile);
      } catch (err) {
        console.error("Image upload:", err);
        setError(t.imageUploadFailed);
        setSaving(false);
        return;
      }
    }
    const tags = formData.tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const newSpot: Omit<StudySpot, "id"> = {
      name: formData.name,
      location: formData.location,
      hours: formData.hours || "Тодорхойгүй",
      lat: parseFloat(formData.lat),
      lng: parseFloat(formData.lng),
      image: image || PLACEHOLDER_IMAGE,
      tags,
      is_24h: tags.includes("24 цаг") || /24/.test(formData.hours),
      maps_url: formData.maps_url.trim() || undefined,
      amenities: formData.amenities,
      accessibility: formData.accessibility,
      wifi_mbps: formData.scores.wifi_mbps ?? undefined,
      quiet_rating: formData.scores.quiet_rating ?? undefined,
      outlet_rating: formData.scores.outlet_rating ?? undefined,
      category: formData.category || undefined,
      description: formData.description.trim() || undefined,
    };
    await onAddSpot(newSpot);
    setSaving(false);
    handleClose();
    setFormData(emptyForm);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[1100] flex items-stretch sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 sm:border border-slate-800 w-full max-w-lg rounded-none sm:rounded-2xl px-5 pb-5 sm:px-6 sm:pb-6 space-y-4 relative shadow-2xl h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 -mx-5 sm:-mx-6 px-5 sm:px-6 pt-5 sm:pt-6 pb-3 bg-slate-900 flex justify-between items-center border-b border-slate-800">
          <h3 className="text-base font-bold text-white">{t.addSpotTitle}</h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-white text-lg" type="button">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">{t.mapsLink}</label>
            <input
              type="url"
              value={formData.maps_url}
              onChange={(e) => handleMapsLinkChange(e.target.value)}
              placeholder="https://maps.app.goo.gl/..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
            <p
              className={`mt-1 ${
                mapsStatus.kind === "error"
                  ? "text-rose-400"
                  : mapsStatus.kind === "ok"
                  ? "text-emerald-400"
                  : "text-slate-500"
              }`}
            >
              {mapsStatus.kind === "hint" ? t.mapsHint : mapsStatus.text}
            </p>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">{t.spotName}</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t.spotNamePlaceholder}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">{t.spotType}</label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as SpotCategory | "" })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="" disabled>
                {t.choose}
              </option>
              {SPOT_CATEGORIES.map((category) => (
                <option key={category.key} value={category.key}>
                  {category.icon} {category.label[locale]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">{t.shortDescription}</label>
            <textarea
              rows={3}
              maxLength={500}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t.descriptionPlaceholder}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">{t.locationShort}</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={t.locationPlaceholder}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">{t.openingHours}</label>
              <input
                type="text"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                placeholder={t.hoursPlaceholder}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                placeholder="47.9188"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                placeholder="106.9176"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          {isCloudinaryConfigured ? (
            <div>
              <label className="block text-slate-400 mb-1">{t.imageUpTo5mb}</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-300 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-indigo-600 file:text-white file:text-xs file:font-semibold"
              />
              {preview ? (
                <img src={preview} alt={t.imagePreview} className="mt-2 h-32 w-full object-cover rounded-lg border border-slate-700" />
              ) : null}
            </div>
          ) : (
            <div>
              <label className="block text-slate-400 mb-1">{t.imageUrl}</label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
          <fieldset className="space-y-3 bg-slate-800/30 border border-slate-800 rounded-xl p-3">
            <legend className="px-1 text-slate-400">{t.environmentRatings}</legend>
            <ScoreFields
              value={formData.scores}
              onChange={(scores) => setFormData({ ...formData, scores })}
            />
          </fieldset>
          <div>
            <label className="block text-slate-400 mb-1">{t.tagsLabel}</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder={t.tagsPlaceholder}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">{t.amenities}</label>
            <OptionPicker
              options={AMENITIES}
              value={formData.amenities}
              onChange={(amenities) => setFormData({ ...formData, amenities })}
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">{t.accessibility}</label>
            <OptionPicker
              options={ACCESSIBILITY}
              value={formData.accessibility}
              onChange={(accessibility) => setFormData({ ...formData, accessibility })}
            />
          </div>
          {error ? <p className="text-rose-400">{error}</p> : null}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 mt-2"
          >
            {saving ? (imageFile ? t.uploadingImage : t.saving) : t.submitSpot}
          </button>
        </form>
      </div>
    </div>
  );
}
