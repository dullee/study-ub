import { Locale } from "@/lib/i18n/dictionaries";
import { LIMITS } from "@/lib/limits";

// OpenStreetMap-ийн opening_hours ("Mo-Fr 09:00-18:00; Sa 10:00-16:00", "24/7") → сайтын "09:00 - 18:00" хэлбэр.
// Сайт нэг өдрийн цагийн хүрээ хадгалдаг (lib/openHours.ts): хамгийн олон өдөрт хамаарах хуваарь үндсэн,
// өдрөөр ялгаатай бол бүх хуваарийг хаалтанд нэмнэ. Ойлгомжгүй бол null — хэрэглэгч гараар бичнэ.

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
const DAY_LABELS: Record<Locale, Record<(typeof DAYS)[number], string>> = {
  mn: { Mo: "Да", Tu: "Мя", We: "Лх", Th: "Пү", Fr: "Ба", Sa: "Бя", Su: "Ня" },
  en: { Mo: "Mon", Tu: "Tue", We: "Wed", Th: "Thu", Fr: "Fri", Sa: "Sat", Su: "Sun" },
};

const TIME = "(\\d{1,2}):(\\d{2})";
const RANGE = new RegExp(`^${TIME}\\s*-\\s*${TIME}\\+?$`);

type Rule = { days: string | null; dayCount: number; open: string; close: string };

const pad = (hours: string, minutes: string) => `${hours.padStart(2, "0")}:${minutes}`;

// "Mo-Fr,Su" → өдрийн тоо; танихгүй (PH, огноо гэх мэт) бол null.
function countDays(selector: string): number | null {
  let count = 0;
  for (const part of selector.split(",")) {
    const [from, to] = part.trim().split("-") as [string, string | undefined];
    const start = DAYS.indexOf(from as (typeof DAYS)[number]);
    const end = to === undefined ? start : DAYS.indexOf(to as (typeof DAYS)[number]);
    if (start < 0 || end < 0) return null;
    count += end >= start ? end - start + 1 : 7 - start + end + 1;
  }
  return count;
}

function parseRule(text: string): Rule | null {
  const rule = text.trim();
  const match = /^(?:([A-Za-z,\- ]+?)\s+)?(\d.*)$/.exec(rule);
  if (!match) return null;
  const days = match[1]?.replace(/\s/g, "") || null;
  const dayCount = days ? countDays(days) : 7;
  if (!dayCount) return null;
  // "09:00-12:00,13:00-18:00" (үдийн завсарлага) → эхний нээх, сүүлийн хаах цаг.
  const ranges = match[2].split(",").map((range) => RANGE.exec(range.trim()));
  if (ranges.length === 0 || ranges.some((range) => !range)) return null;
  const first = ranges[0] as RegExpExecArray;
  const last = ranges[ranges.length - 1] as RegExpExecArray;
  return { days, dayCount, open: pad(first[1], first[2]), close: pad(last[3], last[4]) };
}

function dayLabel(selector: string, locale: Locale) {
  return selector.replace(/Mo|Tu|We|Th|Fr|Sa|Su/g, (day) => DAY_LABELS[locale][day as (typeof DAYS)[number]]);
}

export function osmHoursToText(value: string, locale: Locale): string | null {
  const text = value.trim();
  if (/^24\/7$/.test(text)) return "24/7";
  // "off"/"closed" (амралтын өдөр), PH/SH (баяр, сургуулийн амралт) мөрүүд үндсэн хуваарьт нөлөөлөхгүй.
  const rules = text
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part && !/\b(off|closed)\b/i.test(part) && !/^(PH|SH)\b/.test(part))
    .map(parseRule);
  if (rules.length === 0 || rules.some((rule) => !rule)) return null;
  const parsed = rules as Rule[];

  const main = parsed.reduce((best, rule) => (rule.dayCount > best.dayCount ? rule : best));
  const range = `${main.open} - ${main.close}`;
  const sameEveryDay = parsed.every((rule) => rule.open === main.open && rule.close === main.close);
  if (sameEveryDay) {
    if (parsed.reduce((sum, rule) => sum + rule.dayCount, 0) >= 7) return range;
    // Зөвхөн зарим өдөр, бүгд ижил цаг: "09:00 - 18:00 (Да-Ба)".
    return `${range} (${parsed.map((rule) => dayLabel(rule.days ?? "", locale)).join(", ")})`;
  }

  const detail = parsed
    .map((rule) => `${rule.days ? `${dayLabel(rule.days, locale)} ` : ""}${rule.open}-${rule.close}`)
    .join("; ");
  const full = `${range} (${detail})`;
  return full.length <= LIMITS.spotHours ? full : range;
}
