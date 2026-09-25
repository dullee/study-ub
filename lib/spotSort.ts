import { StudySpot } from "@/types";
import { SpotSummary } from "@/lib/scores";

// Шүүлтүүр бүрийн нэгтгэсэн оноо (газар нэмэгч + сэтгэгдэл): их нь эхэнд. Утгагүй газар хамгийн сүүлд.
const SCORE_BY_TAG: Record<string, (summary: SpotSummary | undefined) => number | undefined> = {
  "Wi-Fi хурдан": (summary) => summary?.wifi?.value,
  "Маш чимээгүй": (summary) => summary?.quiet?.value,
  "Залгуур ихтэй": (summary) => summary?.outlets?.value,
};

// Сонгосон дарааллаар нь эрэмбэлнэ: эхний шүүлтүүр гол, дараагийнх нь тэнцсэн үед.
// Байршил мэдэгдэж байвал эцэст нь ойрынх нь эхэнд (шүүлтүүргүй үед ч).
export function sortByActiveTags(
  spots: StudySpot[],
  activeTags: string[],
  summaries: Record<number, SpotSummary>,
  distances: Record<number, number> | null = null
) {
  const scorers = activeTags.map((tag) => SCORE_BY_TAG[tag]).filter(Boolean);
  if (scorers.length === 0 && !distances) return spots;
  return [...spots].sort((a, b) => {
    for (const score of scorers) {
      const sa = score(summaries[a.id]) ?? -Infinity;
      const sb = score(summaries[b.id]) ?? -Infinity;
      if (sa !== sb) return sb - sa;
    }
    return distances ? distances[a.id] - distances[b.id] : 0;
  });
}
