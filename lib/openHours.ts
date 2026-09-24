import { useSyncExternalStore } from "react";
import { StudySpot } from "@/types";

// "09:00 - 20:00", "9:00–20:00", "24 Цаг", "24/7" гэх мэт чөлөөт текстээс нээлттэй эсэхийг Улаанбаатарын цагаар тооцно.

const DAY = 24 * 60;
const SOON = 3 * 60;
const TIME_ZONE = "Asia/Ulaanbaatar";

type Hours = { kind: "24h" } | { kind: "range"; open: number; close: number };

export type OpenStatus = {
  open: boolean;
  tone: "open" | "soon" | "closed";
  // Карт дээрх товч бичиг.
  short: string;
  // Дэлгэрэнгүй цонхны бичиг: яг цаг, хэдий хугацааны дараа.
  detail: string;
  // "09:00 – 20:00" эсвэл "24 цаг".
  schedule: string;
};

function parseHours(spot: Pick<StudySpot, "hours" | "is_24h">): Hours | null {
  const text = spot.hours ?? "";
  if (spot.is_24h || /24\s*(\/\s*7|цаг)/i.test(text)) return { kind: "24h" };
  const match = /(\d{1,2})[:.](\d{2})\s*[-–—~]\s*(\d{1,2})[:.](\d{2})/.exec(text);
  if (!match) return null;
  const [open, close] = [
    Number(match[1]) * 60 + Number(match[2]),
    Number(match[3]) * 60 + Number(match[4]),
  ];
  if (open > DAY || close > DAY) return null;
  if (open % DAY === close % DAY) return { kind: "24h" };
  return { kind: "range", open: open % DAY, close: close % DAY };
}

const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

// Карт дээр: "2 ц 15 мин-ийн дараа", дэлгэрэнгүйд: "2 цаг 15 минутын дараа".
function inShort(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} минутын дараа`;
  return m === 0 ? `${h} цагийн дараа` : `${h} ц ${m} мин-ийн дараа`;
}

function inDetail(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} минутын дараа`;
  return m === 0 ? `${h} цагийн дараа` : `${h} цаг ${m} минутын дараа`;
}

function minutesNowInUB(now: number) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(now))
      .map((part) => [part.type, part.value])
  );
  return Number(parts.hour) * 60 + Number(parts.minute);
}

export function openStatus(spot: Pick<StudySpot, "hours" | "is_24h">, now: number): OpenStatus | null {
  const hours = parseHours(spot);
  if (!hours) return null;
  if (hours.kind === "24h") {
    return { open: true, tone: "open", short: "24 цаг нээлттэй", detail: "24 цаг нээлттэй", schedule: "24 цаг" };
  }

  const { open, close } = hours;
  const schedule = `${clock(open)} – ${clock(close)}`;
  const t = minutesNowInUB(now);
  const overnight = open > close;
  const isOpen = overnight ? t >= open || t < close : t >= open && t < close;

  if (isOpen) {
    const left = (close - t + DAY) % DAY;
    const closesAt = `${clock(close)}-д хаагдана`;
    return {
      open: true,
      tone: left <= SOON ? "soon" : "open",
      short: left <= SOON ? `${inShort(left)} хаагдана` : `Нээлттэй · ${clock(close)} хүртэл`,
      detail: `Нээлттэй · ${closesAt} (${inDetail(left)})`,
      schedule,
    };
  }

  const until = (open - t + DAY) % DAY;
  const day = !overnight && t >= close ? "маргааш " : "";
  return {
    open: false,
    tone: "closed",
    short: until <= SOON ? `Хаалттай · ${inShort(until)} нээгдэнэ` : "Хаалттай",
    detail: `Хаалттай · ${day}${clock(open)}-д нээгдэнэ (${inDetail(until)})`,
    schedule,
  };
}

export const STATUS_TONE: Record<OpenStatus["tone"], string> = {
  open: "text-emerald-400",
  soon: "text-amber-400",
  closed: "text-rose-400",
};

// Минут тутам шинэчлэгдэх цаг. Сервер дээр null — нээлттэй эсэхийг зөвхөн хөтөч дээр харуулж, hydration зөрөхгүй.
const MINUTE = 60 * 1000;
const currentMinute = () => Math.floor(Date.now() / MINUTE) * MINUTE;

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 15 * 1000);
  return () => clearInterval(id);
}

export function useNow() {
  return useSyncExternalStore(subscribe, currentMinute, () => null);
}
