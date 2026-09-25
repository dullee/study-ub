import { useSyncExternalStore } from "react";
import { StudySpot } from "@/types";
import { Dictionary } from "@/lib/i18n/dictionaries";

// "09:00 - 20:00", "9:00–20:00", "24 Цаг", "24/7" гэх мэт чөлөөт текстээс нээлттэй эсэхийг Улаанбаатарын цагаар тооцно.

const DAY = 24 * 60;
const SOON = 3 * 60;
const TIME_ZONE = "Asia/Ulaanbaatar";

type Hours = { kind: "24h" } | { kind: "range"; open: number; close: number };

export type OpenStatus = {
  open: boolean;
  tone: "open" | "soon" | "closed";
  // Карт дээрх нэг үг: "Нээлттэй" / "Хаалттай".
  label: string;
  // Заагч очиход гулсаж гарах нэмэлт: "22:00 хүртэл", "30 минутын дараа хаагдана" гэх мэт.
  hint: string;
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

const duration = (minutes: number) => ({ h: Math.floor(minutes / 60), m: minutes % 60 });

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

// Бичвэрийг сонгосон хэлний толиноос (t) авна: карт дээр товч, цонхонд дэлгэрэнгүй.
export function openStatus(
  spot: Pick<StudySpot, "hours" | "is_24h">,
  now: number,
  t: Dictionary
): OpenStatus | null {
  const hours = parseHours(spot);
  if (!hours) return null;
  if (hours.kind === "24h") {
    return { open: true, tone: "open", label: t.openLabel, hint: t.schedule24, detail: t.open24, schedule: t.schedule24 };
  }

  const { open, close } = hours;
  const schedule = `${clock(open)} – ${clock(close)}`;
  const nowMinutes = minutesNowInUB(now);
  const overnight = open > close;
  const isOpen = overnight ? nowMinutes >= open || nowMinutes < close : nowMinutes >= open && nowMinutes < close;

  if (isOpen) {
    const left = (close - nowMinutes + DAY) % DAY;
    return {
      open: true,
      tone: left <= SOON ? "soon" : "open",
      label: t.openLabel,
      hint: left <= SOON ? t.hintClosesIn(t.durationShort(duration(left))) : t.hintUntil(clock(close)),
      detail: t.openClosesAt(clock(close), t.durationLong(duration(left))),
      schedule,
    };
  }

  const until = (open - nowMinutes + DAY) % DAY;
  const tomorrow = !overnight && nowMinutes >= close;
  return {
    open: false,
    tone: "closed",
    label: t.closed,
    hint: until <= SOON ? t.hintOpensIn(t.durationShort(duration(until))) : t.hintOpensAt(tomorrow, clock(open)),
    detail: t.closedOpensAt(tomorrow, clock(open), t.durationLong(duration(until))),
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
