import { createElement } from "react";
import {
  Accessibility,
  ArrowUpDown,
  Ban,
  BookOpen,
  Briefcase,
  Clock,
  Coffee,
  CupSoda,
  DoorOpen,
  Ear,
  Footprints,
  GlassWater,
  GraduationCap,
  Hand,
  HandMetal,
  Image as ImageIcon,
  Library,
  Lightbulb,
  Lock,
  LucideIcon,
  MapPin,
  MessageSquare,
  Moon,
  PawPrint,
  PenLine,
  Plug,
  Printer,
  Snowflake,
  SquareParking,
  Tag,
  Toilet,
  Users,
  Utensils,
  Volume2,
  VolumeX,
  Wifi,
} from "lucide-react";

// Ангилал, үйлчилгээ, хүртээмж, шошго, мэдэгдлийн сэдэв бүрийн зурсан дүрс (emoji биш). Түлхүүр нь types/index.ts-тэй ижил.
const ICONS: Record<string, LucideIcon> = {
  // Ангилал
  library: Library,
  cafe: Coffee,
  coworking: Briefcase,
  university: GraduationCap,
  reading_room: BookOpen,
  other: MapPin,
  // Үйлчилгээ
  printer: Printer,
  food: Utensils,
  drinks: CupSoda,
  water: GlassWater,
  restroom: Toilet,
  group_room: Users,
  whiteboard: PenLine,
  ac: Snowflake,
  parking: SquareParking,
  lockers: Lock,
  // Хүртээмж
  wheelchair: Accessibility,
  step_free: DoorOpen,
  elevator: ArrowUpDown,
  accessible_restroom: Toilet,
  accessible_parking: SquareParking,
  braille: Hand,
  tactile_paving: Footprints,
  screen_reader: Volume2,
  hearing_loop: Ear,
  sign_language: HandMetal,
  visual_alerts: Lightbulb,
  service_animal: PawPrint,
  quiet_room: Moon,
  // Шошго (монгол нэрээр хадгалагддаг)
  "Номын сан": Library,
  "Маш чимээгүй": VolumeX,
  "24 цаг": Clock,
  "Wi-Fi хурдан": Wifi,
  "Залгуур ихтэй": Plug,
  // Мэдэгдлийн сэдэв
  hours: Clock,
  location: MapPin,
  wifi: Wifi,
  amenities: Plug,
  photos: ImageIcon,
  closed: Ban,
  // Баримт
  quiet: VolumeX,
  outlets: Plug,
};

export function iconFor(key: string | undefined | null): LucideIcon {
  return (key && ICONS[key]) || Tag;
}

// Шошгоны хажуудах жижиг дүрс; утга нь хажуугийн бичвэрт тул чимэглэл.
export default function KeyIcon({
  k,
  className = "h-4 w-4",
  strokeWidth = 1.75,
}: {
  k: string | undefined | null;
  className?: string;
  strokeWidth?: number;
}) {
  // Дүрс нь тогтмол модулийн түвшний зурагнаас сонгогдоно (render бүрт шинэ компонент үүсэхгүй).
  return createElement(k === "other-message" ? MessageSquare : iconFor(k), {
    "aria-hidden": true,
    focusable: "false",
    className: `shrink-0 ${className}`,
    strokeWidth,
  });
}
