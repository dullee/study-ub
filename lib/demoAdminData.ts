import { initialSpots } from "@/data/initialSpots";
import { EventAttendee, Review, StudyEvent, StudySpot, normalizeTags } from "@/types";
import { SpotReport } from "@/lib/reports";

// Админы демо (/admin/demo)-ийн жишээ өгөгдөл: бодит газрууд (data/initialSpots.ts) + зохиомол хүлээгдэж буй газар,
// сэтгэгдэл, эвент, мэдэгдэл. Санах ойд л байна — юу ч хадгалагдахгүй, сүлжээ шаардахгүй.
// Огноог одоогоос тооцно: эвентүүд үргэлж "удахгүй", мэдэгдлүүд "саяхан" харагдана.

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export function demoAdminData(now = Date.now()) {
  const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();
  const approved = initialSpots.map((spot) => ({
    ...spot,
    status: "approved" as const,
    tags: normalizeTags(spot.tags ?? []),
  }));

  const pending: StudySpot[] = [
    {
      id: 9001,
      name: "Номин Коворкинг",
      category: "coworking",
      location: "Баянзүрх дүүрэг, Энхтайвны өргөн чөлөө",
      hours: "08:00 - 22:00",
      lat: 47.9178,
      lng: 106.9412,
      tags: ["Wi-Fi хурдан", "Залгуур ихтэй"],
      wifi_mbps: 120,
      quiet_rating: 4,
      outlet_rating: 5,
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop",
      description: "Шинэ коворкинг — өдрийн тасалбартай, уулзалтын өрөөтэй.",
      amenities: ["restroom", "water"],
      status: "pending",
      user_id: "demo_user_1",
      created_at: iso(-3 * HOUR),
    },
    {
      id: 9002,
      name: "Study Hub 24/7",
      category: "cafe",
      location: "Сүхбаатар дүүрэг, Сөүлийн гудамж",
      hours: "24/7",
      is_24h: true,
      lat: 47.9139,
      lng: 106.9183,
      tags: ["24 цаг"],
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop",
      description: "Шөнөжин ажилладаг кафе, оюутнуудад хямдралтай.",
      status: "pending",
      user_id: "demo_user_2",
      created_at: iso(-26 * HOUR),
    },
    {
      id: 9003,
      name: "Тест газар",
      category: "other",
      location: "Тодорхойгүй",
      hours: "Тодорхойгүй",
      lat: 47.92,
      lng: 106.9,
      tags: [],
      image: "",
      status: "rejected",
      user_id: "demo_user_3",
      created_at: iso(-4 * DAY),
    },
  ];

  const reviews: Review[] = [
    { id: 1, spot_id: 1, rating: 5, comment: "Маш чимээгүй, залгуур хангалттай. Шалгалтын үеэр эрт очоорой.", author_name: "Сараа", quiet_rating: 5, outlet_rating: 4, wifi_mbps: 35, created_at: iso(-2 * DAY) },
    { id: 2, spot_id: 1, rating: 4, comment: "Wi-Fi заримдаа тасардаг ч орчин сайхан.", author_name: "Bat", wifi_mbps: 18, created_at: iso(-5 * DAY) },
    { id: 3, spot_id: 3, rating: 5, comment: "Кофе нь амттай, ширээ бүрт залгууртай.", author_name: "Анхаа", outlet_rating: 5, created_at: iso(-1 * DAY) },
    { id: 4, spot_id: 4, rating: 3, comment: "Үдээс хойш хэтэрхий дүүрэн, суудал олдохгүй.", author_name: "Tuya", quiet_rating: 2, created_at: iso(-3 * DAY) },
    { id: 5, spot_id: 6, rating: 4, comment: "Сурах өрөө нь тав тухтай, гэхдээ 18:00-д хаадаг.", author_name: "Тэмүүлэн", created_at: iso(-6 * DAY) },
    { id: 6, spot_id: 8, rating: 2, comment: "spam spam spam 🔥🔥🔥 check my profile", author_name: "random123", created_at: iso(-2 * HOUR) },
  ];

  const at = (daysFromNow: number, hour: number) => {
    const d = new Date(now + daysFromNow * DAY);
    // Улаанбаатарын цагаар hour:00 (UTC+8).
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour - 8)).toISOString();
  };
  const spotRef = (id: number) => {
    const spot = approved.find((item) => item.id === id) ?? approved[0];
    return { spot_id: spot.id, place_name: spot.name, lat: spot.lat, lng: spot.lng };
  };
  const events: StudyEvent[] = [
    { id: 101, title: "Математикийн шалгалтын бэлтгэл", description: "Calculus II — хамтдаа бодлого бодно. Тооны машинаа авчраарай.", ...spotRef(1), starts_at: at(1, 14), host_name: "Сараа", max_people: 12, created_at: iso(-2 * DAY), user_id: "demo_user_1", status: "approved" },
    { id: 102, title: "IELTS speaking club", description: "Weekly speaking practice, all levels welcome.", ...spotRef(3), starts_at: at(3, 18), host_name: "Bat", max_people: 8, created_at: iso(-1 * DAY), user_id: "demo_user_4", status: "approved" },
    { id: 103, title: "Программчлалын хакатоны баг бүрдүүлэх", description: "Дараа сарын хакатонд оролцох баг хайж байна.", ...spotRef(6), starts_at: at(5, 10), host_name: "Анхаа", max_people: null, created_at: iso(-5 * HOUR), user_id: "demo_user_5", status: "pending" },
    { id: 104, title: "Англи хэлний уншлагын бүлэг", description: "Өнгөрсөн долоо хоногийн уулзалт.", ...spotRef(2), starts_at: at(-4, 16), host_name: "Tuya", max_people: 10, created_at: iso(-9 * DAY), user_id: "demo_user_6", status: "approved" },
  ];
  const attendees: EventAttendee[] = [
    ...["Сараа", "Bat", "Анхаа", "Номин", "Tuya", "Дөлгөөн", "Тэмүүлэн"].map((name, index) => ({ id: 200 + index, event_id: 101, name, user_id: `demo_att_${index}`, created_at: iso(-DAY + index * HOUR) })),
    ...["Bat", "Номин", "Zoloo"].map((name, index) => ({ id: 300 + index, event_id: 102, name, user_id: `demo_att_b${index}`, created_at: iso(-10 * HOUR) })),
  ];
  const phones: Record<number, string> = { 101: "+976 9911 2233", 102: "8800 1122" };

  const reports: SpotReport[] = [
    { id: 1, spot_id: 3, user_id: "demo_user_7", author_name: "Номин", topics: ["hours"], message: "Одоо 10:00-аас нээгддэг болсон, 08:00 биш.", status: "open", created_at: iso(-40 * 60_000), resolved_at: null },
    { id: 2, spot_id: 5, user_id: "demo_user_8", author_name: "Bat", topics: ["closed"], message: "Засварын улмаас сарын эцэс хүртэл хаалттай байна.", status: "open", created_at: iso(-5 * HOUR), resolved_at: null },
    { id: 3, spot_id: 1, user_id: "demo_user_9", author_name: "Tuya", topics: ["wifi", "amenities"], message: "Wi-Fi-ийн нууц үг өөрчлөгдсөн, 2 давхрын залгуурууд ажиллахгүй.", status: "open", created_at: iso(-DAY), resolved_at: null },
    { id: 4, spot_id: 2, user_id: "demo_user_10", author_name: "Сараа", topics: ["location"], message: "Байршил буруу — хойд талын байранд нүүсэн.", status: "resolved", created_at: iso(-6 * DAY), resolved_at: iso(-5 * DAY) },
  ];

  return { spots: [...pending, ...approved], reviews, events, attendees, phones, reports };
}
