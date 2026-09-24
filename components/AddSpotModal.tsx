"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { PLACEHOLDER_IMAGE, StudySpot } from "@/types";
import { isCloudinaryConfigured, MAX_IMAGE_BYTES, uploadImage } from "@/lib/cloudinary";

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
};

export default function AddSpotModal({ isOpen, onClose, onAddSpot }: AddSpotModalProps) {
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const resetImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setImageFile(null);
    setPreview("");
  };

  const handleClose = () => {
    resetImage();
    setError("");
    onClose();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    resetImage();
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Зөвхөн зургийн файл сонгоно уу.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Зураг 5MB-аас бага байх ёстой.");
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
        setError(err instanceof Error ? err.message : "Зураг хуулахад алдаа гарлаа.");
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
    };
    await onAddSpot(newSpot);
    setSaving(false);
    handleClose();
    setFormData(emptyForm);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-4 relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">➕ Шинэ Study Spot нэмэх</h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-white text-lg" type="button">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Газрын нэр</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ж: Coffee Names (Сүхбаатарын салбар)"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Байршил (Товч)</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ж: Багшийн дээд"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Ажиллах цаг</label>
              <input
                type="text"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                placeholder="Ж: 08:00 - 22:00 эсвэл 24/7"
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
              <label className="block text-slate-400 mb-1">Зураг (5MB хүртэл)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-300 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-indigo-600 file:text-white file:text-xs file:font-semibold"
              />
              {preview ? (
                <img src={preview} alt="Урьдчилан харах" className="mt-2 h-32 w-full object-cover rounded-lg border border-slate-700" />
              ) : null}
            </div>
          ) : (
            <div>
              <label className="block text-slate-400 mb-1">Зургийн URL</label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
          <div>
            <label className="block text-slate-400 mb-1">Google Maps холбоос</label>
            <input
              type="url"
              value={formData.maps_url}
              onChange={(e) => setFormData({ ...formData, maps_url: e.target.value })}
              placeholder="https://maps.app.goo.gl/..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Онцлог Тагууд (Таслалаар тусгаарлах)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Розетка ихтэй, Wi-Fi хурдан, Маш чимээгүй"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          {error ? <p className="text-rose-400">{error}</p> : null}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 mt-2"
          >
            {saving ? (imageFile ? "Зураг хуулж байна..." : "Хадгалж байна...") : "Сайтад байршуулах"}
          </button>
        </form>
      </div>
    </div>
  );
}
