// Тэнгэрийн цаг: Улаанбаатарын бодит нар мандах/жаргах цагаар сайтын тэнгэрийн туузны өнгө, сүүдрийн чиглэлийг тогтооно.
// Өргөрөг 47.9°: өдрийн урт 12-р сард ~8.6 цаг, 6-р сард ~15.6 цаг; нарны үд орон нутгийн цагаар ~13:00 (UTC+8, урт 106.9°).
// Ойролцоо загвар (±10 мин) — тэнгэрийн өнгөнд хангалттай, одон орны нарийвчлал шаардлагагүй.

export type SkyPhase = "dawn" | "day" | "dusk" | "night";

export interface SkyState {
  phase: SkyPhase;
  // Сүүдрийн хэвтээ шилжилт (px): өглөө нар зүүнээс → сүүдэр баруун тийш (сөрөг), орой эсрэгээр.
  sunX: number;
  // Өнөөдрийн нар мандах, жаргах цаг — орон нутгийн өдрийн минутаар.
  sunrise: number;
  sunset: number;
  // Одоогийн орон нутгийн минут.
  minute: number;
}

// Inline <script>-д toString()-оор шууд оруулдаг тул энэ функц бие даасан байх ёстой (гадны хувьсагч, импортгүй).
export function skyState(nowMs: number): SkyState {
  const local = new Date(nowMs + 8 * 3600000);
  const start = Date.UTC(local.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((local.getTime() - start) / 86400000);
  const dayHours = 12 + 3.5 * Math.sin((2 * Math.PI * (dayOfYear - 80)) / 365.25);
  const noon = 13 * 60;
  const sunrise = Math.round(noon - dayHours * 30);
  const sunset = Math.round(noon + dayHours * 30);
  const minute = local.getUTCHours() * 60 + local.getUTCMinutes();
  let phase: SkyPhase = "day";
  if (minute < sunrise - 30 || minute > sunset + 40) phase = "night";
  else if (minute < sunrise + 40) phase = "dawn";
  else if (minute > sunset - 50) phase = "dusk";
  let sunX = 0;
  if (phase !== "night") {
    const t = Math.min(1, Math.max(0, (minute - sunrise) / (sunset - sunrise)));
    sunX = Math.round((t - 0.5) * 8);
  }
  return { phase, sunX, sunrise, sunset, minute };
}

// <html>-д data-sky болон --sun-x тавина. Inline script (зурахаас өмнө) болон минут тутмын шинэчлэлт хоёулаа ашиглана.
export function applySky(state: SkyState, root: HTMLElement) {
  root.dataset.sky = state.phase;
  root.style.setProperty("--sun-x", `${state.sunX}px`);
}

// Layout-ын <head>-д: эхний зурахаас өмнө ажиллаж, шөнө цэнхэр тэнгэр анивчихгүй.
export const SKY_INLINE_SCRIPT = `(function(){try{var s=(${skyState.toString()})(Date.now());var r=document.documentElement;r.dataset.sky=s.phase;r.style.setProperty("--sun-x",s.sunX+"px");}catch(e){}})();`;
