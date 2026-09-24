"use client";

import { AMENITIES } from "@/types";

interface AmenityPickerProps {
  value: string[];
  onChange: (value: string[]) => void;
}

// Газар нэмэх болон админы засах хэсэгт үйлчилгээг сонгоно.
export default function AmenityPicker({ value, onChange }: AmenityPickerProps) {
  const toggle = (key: string) =>
    onChange(value.includes(key) ? value.filter((item) => item !== key) : [...value, key]);

  return (
    <div className="flex flex-wrap gap-1.5">
      {AMENITIES.map((amenity) => {
        const selected = value.includes(amenity.key);
        return (
          <button
            key={amenity.key}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(amenity.key)}
            className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
              selected
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
            }`}
          >
            {amenity.icon} {amenity.label}
          </button>
        );
      })}
    </div>
  );
}
