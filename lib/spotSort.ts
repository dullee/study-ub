import { StudySpot } from "@/types";

// Шүүлтүүр бүрийн утгыг тоо болгоно: их нь эхэнд. Утгагүй газар хамгийн сүүлд.
function wifiMbps(spot: StudySpot) {
  const match = /(\d+(?:[.,]\d+)?)\s*(gbps|mbps)?/i.exec(spot.wifi_speed ?? "");
  if (!match) return null;
  const value = Number(match[1].replace(",", "."));
  return match[2]?.toLowerCase() === "gbps" ? value * 1000 : value;
}

function quietScore(spot: StudySpot) {
  const match = /(\d+(?:[.,]\d+)?)/.exec(spot.quiet_score ?? "");
  return match ? Number(match[1].replace(",", ".")) : null;
}

function socketScore(spot: StudySpot) {
  const text = (spot.socket_score ?? "").toLowerCase();
  if (!text) return null;
  if (text.includes("ширээ бүрт")) return 3;
  if (text.includes("их")) return 2;
  if (text.includes("дунд")) return 1;
  return 0;
}

const SCORE_BY_TAG: Record<string, (spot: StudySpot) => number | null> = {
  "Wi-Fi хурдан": wifiMbps,
  "Маш чимээгүй": quietScore,
  "Розетка ихтэй": socketScore,
};

// Сонгосон дарааллаар нь эрэмбэлнэ: эхний шүүлтүүр гол, дараагийнх нь тэнцсэн үед.
export function sortByActiveTags(spots: StudySpot[], activeTags: string[]) {
  const scorers = activeTags.map((tag) => SCORE_BY_TAG[tag]).filter(Boolean);
  if (scorers.length === 0) return spots;
  return [...spots].sort((a, b) => {
    for (const score of scorers) {
      const sa = score(a) ?? -Infinity;
      const sb = score(b) ?? -Infinity;
      if (sa !== sb) return sb - sa;
    }
    return 0;
  });
}
