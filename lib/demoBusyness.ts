"use client";

import { useSyncExternalStore } from "react";
import { BusynessLevel, PatternCell, SpotCheckin } from "@/lib/busyness";

// Танилцуулгад: "Би энд байна" мэдээлэл 90 минутад хуучирдаг тул өгөгдлийн санд урьдчилж оруулах боломжгүй.
// Демо горим нь хөтөч дээр жишээ мэдээлэл үүсгэнэ (одоогоос тооцсон цагтай) — карт, газрын зураг, шүүлтүүр,
// "Сул нь эхэнд" эрэмбэ, газрын цонх, "Ихэвчлэн хэр дүүрэн" график бүгд ажиллана. Юу ч хадгалахгүй, өгөгдлийн санд бичихгүй.
// Асаах: /demo, унтраах: /demo/off (энэ хөтөчид санагдана). Эдгээр хуудас нь /?demo=1, /?demo=0 руу шилжүүлнэ.
const KEY = "studyspots_ub_demo_busyness";
const EVENT = "studyspots:demo-busyness-changed";

function read() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useDemoBusyness() {
  return useSyncExternalStore(subscribe, read, () => false);
}

// Хаягийн ?demo=1 / ?demo=0-г уншиж горимыг сольж, параметрийг хаягаас арилгана. Өөрчлөгдсөн бол шинэ төлөвийг буцаана.
export function applyDemoBusynessParam(): "on" | "off" | null {
  const url = new URL(window.location.href);
  const value = url.searchParams.get("demo");
  if (value !== "1" && value !== "0") return null;
  url.searchParams.delete("demo");
  window.history.replaceState(window.history.state, "", url);
  try {
    if (value === "1") localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {
    return null;
  }
  window.dispatchEvent(new Event(EVENT));
  return value === "1" ? "on" : "off";
}

// Газрын id-аас тогтмол "санамсаргүй" тоо [0, 1) — хуудсыг дахин ачаалахад, карт болон цонхонд ижил утга гарна.
function rand(spotId: number, salt: number) {
  let x = (Math.imul(spotId, 0x9e3779b1) + Math.imul(salt + 1, 0x85ebca6b)) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x21f0aaad);
  x = Math.imul(x ^ (x >>> 15), 0x735a2d97);
  x ^= x >>> 15;
  return (x >>> 0) / 2 ** 32;
}

const clampLevel = (value: number) => Math.min(5, Math.max(1, Math.round(value))) as BusynessLevel;
// Түвшний тархалт (хуримтлагдсан): хоосон 20%, сул 25%, дунд 25%, их хүнтэй 20%, суудал алга 10%.
const LEVEL_WEIGHTS = [0.2, 0.45, 0.7, 0.9, 1];

// Хуудас ачаалагдсан мөч — мэдээллүүдийн "хэдэн минутын өмнө" нь үүнээс тооцогдоно.
let base: number | null = null;

// Сүүлийн 3–45 минутын жишээ мэдээлэл: газар бүрт 1–4 хүн, бүх түвшин (1–5) таарна.
// Ойролцоогоор 5 газрын 1 нь мэдээлэлгүй үлдэнэ — "мэдээлэлгүй" төлөв ч харагдана.
export function demoCheckins(spotIds: number[]): SpotCheckin[] {
  base ??= Date.now();
  const rows: SpotCheckin[] = [];
  for (const spotId of spotIds) {
    if (rand(spotId, 0) < 0.2) continue;
    const roll = rand(spotId, 6);
    const level = 1 + LEVEL_WEIGHTS.findIndex((weight) => roll < weight);
    const people = 1 + Math.floor(rand(spotId, 2) * 4);
    for (let i = 0; i < people; i++) {
      const drift = rand(spotId, 10 + i);
      const minutesAgo = 3 + Math.floor(rand(spotId, 20 + i) * 42);
      rows.push({
        // Сөрөг id — жинхэнэ мөртэй давхцахгүй.
        id: -(spotId * 10 + i + 1),
        spot_id: spotId,
        user_id: `demo_user_${i + 1}`,
        level: clampLevel(level + (drift < 0.15 ? -1 : drift > 0.85 ? 1 : 0)),
        created_at: new Date(base - minutesAgo * 60_000).toISOString(),
      });
    }
  }
  return rows;
}

// "Ихэвчлэн хэр дүүрэн" графикийн жишээ: 08–21 цаг, үдийн болон оройн оргилтой; газар, гараг бүрт бага зэрэг өөр.
export function demoPattern(spotId: number): PatternCell[] {
  const cells: PatternCell[] = [];
  const busy = 0.6 + rand(spotId, 3) * 0.4;
  for (let weekday = 0; weekday < 7; weekday++) {
    const dayFactor = (weekday >= 5 ? 0.8 : 1) * (0.85 + rand(spotId, 30 + weekday) * 0.3);
    for (let hour = 8; hour <= 21; hour++) {
      const lunch = Math.exp(-((hour - 13) ** 2) / 8);
      const evening = Math.exp(-((hour - 19) ** 2) / 6);
      const noise = (rand(spotId, 100 + weekday * 24 + hour) - 0.5) * 0.6;
      const level = 1 + 4 * Math.max(lunch * 0.8, evening) * busy * dayFactor + noise;
      cells.push({
        weekday,
        hour,
        avg_level: Math.round(Math.min(5, Math.max(1, level)) * 100) / 100,
        reports: 2 + Math.floor(rand(spotId, 500 + weekday * 24 + hour) * 6),
      });
    }
  }
  return cells;
}
