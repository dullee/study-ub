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
  wifi_speed?: string;
  quiet_score?: string;
  socket_score?: string;
  is_24h?: boolean;
  status?: SpotStatus;
  maps_url?: string;
}

export function googleMapsUrl(spot: Pick<StudySpot, "maps_url" | "lat" | "lng">) {
  const custom = spot.maps_url?.trim();
  if (custom) return custom;
  return `https://www.google.com/maps?q=${spot.lat},${spot.lng}`;
}

export interface Review {
  id: number;
  spot_id: number;
  comment: string;
  wifi_speed_test: string;
  rating: number;
  created_at: string;
  user_id?: string | null;
  author_name?: string | null;
}

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
