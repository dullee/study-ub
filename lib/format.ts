const WEEKDAYS = ["Ням", "Дав", "Мяг", "Лха", "Пүр", "Баа", "Бям"];

// Хөтчүүд mn-MN locale-ийг тогтвортой дэмждэггүй тул гараар форматлана.
// timeZone өгөөгүй бол хөтчийн цагийн бүсээр; сервер (UTC) дээр "Asia/Ulaanbaatar" өгнө.
export function formatEventTime(iso: string, timeZone?: string) {
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
