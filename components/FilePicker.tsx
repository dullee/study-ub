"use client";

import { ChangeEvent } from "react";
import { ImageUp } from "lucide-react";
import { useI18n } from "@/components/LanguageProvider";

// Хөтчийн "Choose File / No file chosen" (үргэлж хөтчийн хэлээр)-ийн оронд: сайтын хэлээр товч + файлын нэр.
// Жинхэнэ <input type="file"> нь label дотор нуугдсан тул гар, дэлгэц уншигчид хэвийн ажиллана.
export default function FilePicker({
  accept,
  fileName,
  onChange,
}: {
  accept: string;
  fileName: string | null;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const { t } = useI18n();
  return (
    <label className="flex items-center gap-3 w-full cursor-pointer rounded-md border border-line-strong bg-sheet p-1.5 has-focus-visible:ring-2 has-focus-visible:ring-azure">
      <span className="inline-flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded bg-azure text-white text-xs font-semibold">
        <ImageUp aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
        {t.chooseImage}
      </span>
      <span className={`min-w-0 truncate text-xs ${fileName ? "text-ink" : "text-ink-muted"}`}>
        {fileName ?? t.noFileChosen}
      </span>
      <input type="file" accept={accept} onChange={onChange} className="sr-only" />
    </label>
  );
}
