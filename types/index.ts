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
  // Илгээсэн хэрэглэгчийн Clerk id (нэвтрээгүй бол хоосон) ба илгээсэн цаг.
  user_id?: string | null;
  created_at?: string;
  description?: string;
  accessibility?: string[];
}

// Хоёр хэлээр бичсэн нэр. Бүрэлдэхүүн хэсэгт `label[locale]`-ээр харуулна.
export type Localized = { mn: string; en: string };

// Хүртээмж. group-оор нь цонхонд бүлэглэж харуулна; key нь өгөгдлийн санд хадгалагдана.
export const ACCESSIBILITY_GROUPS = [
  { key: "mobility", label: { mn: "Хөдөлгөөн", en: "Mobility" } },
  { key: "vision", label: { mn: "Хараа", en: "Vision" } },
  { key: "hearing", label: { mn: "Сонсгол", en: "Hearing" } },
  { key: "other", label: { mn: "Бусад", en: "Other" } },
] as const;

export const ACCESSIBILITY = [
  { key: "wheelchair", group: "mobility", icon: "♿", label: { mn: "Тэргэнцэрээр нэвтрэх боломжтой", en: "Wheelchair accessible" } },
  { key: "step_free", group: "mobility", icon: "🚪", label: { mn: "Шатгүй орц / налуу зам", en: "Step-free entrance / ramp" } },
  { key: "elevator", group: "mobility", icon: "🛗", label: { mn: "Лифт", en: "Elevator" } },
  { key: "accessible_restroom", group: "mobility", icon: "🚻", label: { mn: "Тэргэнцэрт тохирсон ариун цэврийн өрөө", en: "Wheelchair-accessible restroom" } },
  { key: "accessible_parking", group: "mobility", icon: "🅿️", label: { mn: "ХБИ-ийн зогсоол", en: "Accessible parking" } },
  { key: "braille", group: "vision", icon: "⠃", label: { mn: "Брайль бичигтэй тэмдэг", en: "Braille signage" } },
  { key: "tactile_paving", group: "vision", icon: "🦯", label: { mn: "Хараагүй хүний зам", en: "Tactile paving" } },
  { key: "screen_reader", group: "vision", icon: "🔊", label: { mn: "Дэлгэц уншигчтай компьютер", en: "Computer with screen reader" } },
  { key: "hearing_loop", group: "hearing", icon: "🦻", label: { mn: "Сонсголын гогцоо", en: "Hearing loop" } },
  { key: "sign_language", group: "hearing", icon: "🤟", label: { mn: "Дохионы хэлтэй ажилтан", en: "Staff who use sign language" } },
  { key: "visual_alerts", group: "hearing", icon: "💡", label: { mn: "Гэрлэн дохиолол", en: "Visual (light) alarms" } },
  { key: "service_animal", group: "other", icon: "🦮", label: { mn: "Туслах амьтан зөвшөөрнө", en: "Service animals welcome" } },
  { key: "quiet_room", group: "other", icon: "🤫", label: { mn: "Мэдрэхүйн ачаалалгүй тайван өрөө", en: "Quiet low-sensory room" } },
] as const;

// Газрын төрөл. key нь өгөгдлийн санд хадгалагдана; шинэ төрөл нэмбэл migration-ы check-ийг ч шинэчилнэ.
export const SPOT_CATEGORIES = [
  { key: "library", icon: "📚", label: { mn: "Номын сан", en: "Library" } },
  { key: "cafe", icon: "☕", label: { mn: "Кафе", en: "Café" } },
  { key: "coworking", icon: "💼", label: { mn: "Коворкинг", en: "Coworking" } },
  { key: "university", icon: "🎓", label: { mn: "Их сургууль", en: "University" } },
  { key: "reading_room", icon: "📖", label: { mn: "Уншлагын танхим", en: "Reading room" } },
  { key: "other", icon: "📍", label: { mn: "Бусад", en: "Other" } },
] as const;

export type SpotCategory = (typeof SPOT_CATEGORIES)[number]["key"];

export function spotCategory(key?: string | null) {
  return SPOT_CATEGORIES.find((category) => category.key === key);
}

// Газрын үйлчилгээ. key нь өгөгдлийн санд хадгалагдана — нэрийг нь солиход өгөгдөл өөрчлөгдөхгүй.
export const AMENITIES = [
  { key: "printer", icon: "🖨️", label: { mn: "Принтер", en: "Printer" } },
  { key: "food", icon: "🍽️", label: { mn: "Хоол", en: "Food" } },
  { key: "drinks", icon: "☕", label: { mn: "Кофе, ундаа", en: "Coffee & drinks" } },
  { key: "water", icon: "🚰", label: { mn: "Үнэгүй ус", en: "Free water" } },
  { key: "restroom", icon: "🚻", label: { mn: "Ариун цэврийн өрөө", en: "Restroom" } },
  { key: "group_room", icon: "👥", label: { mn: "Бүлгийн өрөө", en: "Group room" } },
  { key: "whiteboard", icon: "📝", label: { mn: "Самбар", en: "Whiteboard" } },
  { key: "ac", icon: "❄️", label: { mn: "Агааржуулалт", en: "Air conditioning" } },
  { key: "parking", icon: "🅿️", label: { mn: "Зогсоол", en: "Parking" } },
  { key: "lockers", icon: "🔐", label: { mn: "Шүүгээ", en: "Lockers" } },
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
export const QUIET_LEVELS: readonly Localized[] = [
  { mn: "Шуугиантай", en: "Noisy" },
  { mn: "Чимээтэй", en: "Somewhat noisy" },
  { mn: "Дунд зэрэг", en: "Moderate" },
  { mn: "Чимээгүй", en: "Quiet" },
  { mn: "Маш чимээгүй", en: "Very quiet" },
];
export const OUTLET_LEVELS: readonly Localized[] = [
  { mn: "Байхгүй", en: "None" },
  { mn: "Цөөн", en: "Few" },
  { mn: "Дунд зэрэг", en: "Some" },
  { mn: "Ихтэй", en: "Many" },
  { mn: "Ширээ бүрт", en: "At every table" },
];

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
  | "Залгуур ихтэй"
  | "Маш чимээгүй"
  | "24 цаг"
  | "Номын сан";

export const AVAILABLE_TAGS: TagType[] = [
  "Бүгд",
  "Wi-Fi хурдан",
  "Залгуур ихтэй",
  "Маш чимээгүй",
  "24 цаг",
  "Номын сан",
];

// Цонхонд шошгыг бүлэглэж харуулна. Энд байхгүй (хэрэглэгчийн бичсэн) шошго "Бусад"-д орно.
// Шошго өгөгдлийн санд монголоор хадгалагдана; en нь зөвхөн харуулах нэр.
export const TAG_INFO: Record<string, { group: "type" | "environment" | "amenities"; icon: string; en: string }> = {
  "Номын сан": { group: "type", icon: "📚", en: "Library" },
  "Маш чимээгүй": { group: "environment", icon: "🤫", en: "Very quiet" },
  "24 цаг": { group: "environment", icon: "🕒", en: "Open 24 hours" },
  "Wi-Fi хурдан": { group: "amenities", icon: "⚡", en: "Fast Wi-Fi" },
  "Залгуур ихтэй": { group: "amenities", icon: "🔌", en: "Lots of outlets" },
};

// Нэр нь солигдсон шошго: өгөгдлийн санд хуучнаар үлдсэн (эсвэл хэрэглэгч хуучнаар бичсэн) бол шинэ рүү.
const RENAMED_TAGS: Record<string, string> = { "Розетка ихтэй": "Залгуур ихтэй" };

export function normalizeTags(tags: string[]) {
  return [...new Set(tags.map((tag) => RENAMED_TAGS[tag] ?? tag))];
}

// Шошгыг сонгосон хэлээр: суурь шошгыг орчуулна, хэрэглэгчийн бичсэнийг хэвээр нь.
export function tagLabel(tag: string, locale: "mn" | "en") {
  return locale === "en" ? (TAG_INFO[tag]?.en ?? tag) : tag;
}
