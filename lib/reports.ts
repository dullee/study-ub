import { Locale } from "@/lib/i18n/dictionaries";

// "Мэдээлэл буруу" мэдэгдлийн сэдвүүд — supabase/migrations/20260930000003_spot_reports.sql-тэй тохирно.
export const REPORT_TOPICS = [
  { key: "hours", icon: "⏰", label: { mn: "Цагийн хуваарь", en: "Opening hours" } },
  { key: "location", icon: "📍", label: { mn: "Байршил", en: "Location" } },
  { key: "wifi", icon: "⚡", label: { mn: "Wi-Fi", en: "Wi-Fi" } },
  { key: "amenities", icon: "🔌", label: { mn: "Үйлчилгээ, тоноглол", en: "Amenities" } },
  { key: "photos", icon: "🖼️", label: { mn: "Зураг", en: "Photos" } },
  { key: "closed", icon: "🚫", label: { mn: "Хаагдсан / байхгүй", en: "Closed / gone" } },
  { key: "other", icon: "💬", label: { mn: "Бусад", en: "Other" } },
] as const satisfies readonly { key: string; icon: string; label: Record<Locale, string> }[];

export type ReportTopic = (typeof REPORT_TOPICS)[number]["key"];

export const REPORT_MESSAGE_LIMIT = 1000;

export interface SpotReport {
  id: number;
  spot_id: number;
  user_id: string;
  author_name: string | null;
  topics: ReportTopic[];
  message: string;
  status: "open" | "resolved";
  created_at: string;
  resolved_at: string | null;
}

export function reportTopic(key: string) {
  return REPORT_TOPICS.find((topic) => topic.key === key);
}
