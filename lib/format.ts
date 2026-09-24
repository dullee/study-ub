import { Locale } from "@/lib/i18n/dictionaries";

const WEEKDAYS = ["Ням", "Дав", "Мяг", "Лха", "Пүр", "Баа", "Бям"];

// Хөтчүүд mn-MN locale-ийг тогтвортой дэмждэггүй тул монголыг гараар форматлана; англи нь Intl-ээр.
// timeZone өгөөгүй бол хөтчийн цагийн бүсээр; сервер (UTC) дээр "Asia/Ulaanbaatar" өгнө.
// Имэйл (lib/email.ts) монгол хэвээр — locale өгөхгүй.
export function formatEventTime(iso: string, timeZone?: string, locale: Locale = "mn") {
  if (locale === "en") {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(iso));
  }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((part) => [part.type, part.value])
  );
  const weekday = new Date(
    new Date(iso).toLocaleString("en-US", { timeZone })
  ).getDay();
  return `${parts.month}-р сарын ${parts.day} (${WEEKDAYS[weekday]}) ${parts.hour}:${parts.minute}`;
}
