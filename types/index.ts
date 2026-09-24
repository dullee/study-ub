// Зураггүй газарт харуулах ерөнхий зураг. Админ хуудас үүгээр "зураггүй" гэж танина.
export const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&auto=format&fit=crop";

export type SpotStatus = "pending" | "approved" | "rejected";

export interface StudySpot {
  id: number;
  name: string;
  location: string;
  hours: string;
  lat: number;
  lng: number;
  tags: string[];
  image: string;
  // Газар нэмэгчийн өгсөн анхны утга — сэтгэгдлүүдтэй хамт lib/scores.ts-д нэгтгэгдэнэ.
  wifi_mbps?: number;
  quiet_rating?: number;
  outlet_rating?: number;
  is_24h?: boolean;
  status?: SpotStatus;
  maps_url?: string;
  amenities?: string[];
  category?: SpotCategory;
  description?: string;
  accessibility?: string[];
}

// Хүртээмж. group-оор нь цонхонд бүлэглэж харуулна; key нь өгөгдлийн санд хадгалагдана.
export const ACCESSIBILITY_GROUPS = [
  { key: "mobility", label: "Хөдөлгөөн" },
  { key: "vision", label: "Хараа" },
  { key: "hearing", label: "Сонсгол" },
  { key: "other", label: "Бусад" },
] as const;

export const ACCESSIBILITY = [
  { key: "wheelchair", group: "mobility", icon: "♿", label: "Тэргэнцэрээр нэвтрэх боломжтой" },
  { key: "step_free", group: "mobility", icon: "🚪", label: "Шатгүй орц / налуу зам" },
  { key: "elevator", group: "mobility", icon: "🛗", label: "Лифт" },
  { key: "accessible_restroom", group: "mobility", icon: "🚻", label: "Тэргэнцэрт тохирсон ариун цэврийн өрөө" },
  { key: "accessible_parking", group: "mobility", icon: "🅿️", label: "ХБИ-ийн зогсоол" },
  { key: "braille", group: "vision", icon: "⠃", label: "Брайль бичигтэй тэмдэг" },
  { key: "tactile_paving", group: "vision", icon: "🦯", label: "Хараагүй хүний зам" },
  { key: "screen_reader", group: "vision", icon: "🔊", label: "Дэлгэц уншигчтай компьютер" },
  { key: "hearing_loop", group: "hearing", icon: "🦻", label: "Сонсголын гогцоо" },
  { key: "sign_language", group: "hearing", icon: "🤟", label: "Дохионы хэлтэй ажилтан" },
  { key: "visual_alerts", group: "hearing", icon: "💡", label: "Гэрлэн дохиолол" },
  { key: "service_animal", group: "other", icon: "🦮", label: "Туслах амьтан зөвшөөрнө" },
  { key: "quiet_room", group: "other", icon: "🤫", label: "Мэдрэхүйн ачаалалгүй тайван өрөө" },
] as const;

// Газрын төрөл. key нь өгөгдлийн санд хадгалагдана; шинэ төрөл нэмбэл migration-ы check-ийг ч шинэчилнэ.
export const SPOT_CATEGORIES = [
  { key: "library", icon: "📚", label: "Номын сан" },
  { key: "cafe", icon: "☕", label: "Кафе" },
  { key: "coworking", icon: "💼", label: "Коворкинг" },
  { key: "university", icon: "🎓", label: "Их сургууль" },
  { key: "reading_room", icon: "📖", label: "Уншлагын танхим" },
  { key: "other", icon: "📍", label: "Бусад" },
] as const;

export type SpotCategory = (typeof SPOT_CATEGORIES)[number]["key"];

export function spotCategory(key?: string | null) {
  return SPOT_CATEGORIES.find((category) => category.key === key);
}

// Газрын үйлчилгээ. key нь өгөгдлийн санд хадгалагдана — нэрийг нь солиход өгөгдөл өөрчлөгдөхгүй.
export const AMENITIES = [
  { key: "printer", icon: "🖨️", label: "Принтер" },
  { key: "food", icon: "🍽️", label: "Хоол" },
  { key: "drinks", icon: "☕", label: "Кофе, ундаа" },
  { key: "water", icon: "🚰", label: "Үнэгүй ус" },
  { key: "restroom", icon: "🚻", label: "Ариун цэврийн өрөө" },
  { key: "group_room", icon: "👥", label: "Бүлгийн өрөө" },
  { key: "whiteboard", icon: "📝", label: "Самбар" },
  { key: "ac", icon: "❄️", label: "Агааржуулалт" },
  { key: "parking", icon: "🅿️", label: "Зогсоол" },
  { key: "lockers", icon: "🔐", label: "Шүүгээ" },
] as const;

export function googleMapsUrl(spot: Pick<StudySpot, "maps_url" | "lat" | "lng">) {
  const custom = spot.maps_url?.trim();
  if (custom) return custom;
  return `https://www.google.com/maps?q=${spot.lat},${spot.lng}`;
}

export interface Review {
  id: number;
  spot_id: number;
  comment: string;
  rating: number;
  wifi_mbps?: number | null;
  quiet_rating?: number | null;
  outlet_rating?: number | null;
  created_at: string;
  user_id?: string | null;
  author_name?: string | null;
}

// 1–5 үнэлгээний тайлбар. Индекс = үнэлгээ − 1.
export const QUIET_LEVELS = ["Шуугиантай", "Чимээтэй", "Дунд зэрэг", "Чимээгүй", "Маш чимээгүй"] as const;
export const OUTLET_LEVELS = ["Байхгүй", "Цөөн", "Дунд зэрэг", "Ихтэй", "Ширээ бүрт"] as const;

export interface StudyEvent {
  id: number;
  title: string;
  description: string;
  spot_id: number | null;
  place_name: string;
  lat: number | null;
  lng: number | null;
  starts_at: string;
  host_name: string;
  max_people: number | null;
  created_at: string;
  user_id: string | null;
}

export interface EventAttendee {
  id: number;
  event_id: number;
  name: string;
  created_at: string;
  user_id: string | null;
  reminder_sent_at?: string | null;
}

// Clerk хэрэглэгчийн харагдах нэр.
export function displayName(user: {
  fullName?: string | null;
  username?: string | null;
  primaryEmailAddress?: { emailAddress: string } | null;
}) {
  return (
    user.fullName?.trim() ||
    user.username ||
    user.primaryEmailAddress?.emailAddress.split("@")[0] ||
    "Хэрэглэгч"
  );
}

export type TagType =
  | "Бүгд"
  | "Wi-Fi хурдан"
  | "Розетка ихтэй"
  | "Маш чимээгүй"
  | "24 цаг"
  | "Номын сан";

export const AVAILABLE_TAGS: TagType[] = [
  "Бүгд",
  "Wi-Fi хурдан",
  "Розетка ихтэй",
  "Маш чимээгүй",
  "24 цаг",
  "Номын сан",
];

// Цонхонд шошгыг бүлэглэж харуулна. Энд байхгүй (хэрэглэгчийн бичсэн) шошго "Бусад"-д орно.
export const TAG_INFO: Record<string, { group: "type" | "environment" | "amenities"; icon: string }> = {
  "Номын сан": { group: "type", icon: "📚" },
  "Маш чимээгүй": { group: "environment", icon: "🤫" },
  "24 цаг": { group: "environment", icon: "🕒" },
  "Wi-Fi хурдан": { group: "amenities", icon: "⚡" },
  "Розетка ихтэй": { group: "amenities", icon: "🔌" },
};
