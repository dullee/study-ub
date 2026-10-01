// StudySpots UB-ийн сахиус: манул (Pallas's cat) — Монголын уугуул, бөөрөнхий, үргэлж жаахан дургүйцсэн царайтай зэрлэг муур.
// Цөөн хэлбэрээр зурсан: өргөн хавтгай толгой, хажуудаа бага дугуй чих, хацрын хоёр судал, духны толбо,
// дугуй хүүхэн хараатай шар нүд. variant="head" — лого, жижиг газар; "loaf" — хоосон төлөв (номон дээр хэвтсэн).
// mood="sleepy" — нүдээ аньсан (ачаалж байх, юу ч олдоогүй үед).

type ManulProps = {
  variant?: "head" | "loaf";
  mood?: "grumpy" | "sleepy";
  className?: string;
  // Утга агуулсан газарт (ж: хоосон төлөвийн гол зураг) нэр өгнө; эс бөгөөс чимэглэл.
  title?: string;
};

const FUR = "#b9ad9c";
const FUR_DARK = "#7e6f5f";
const CREAM = "#efe7da";
const MARK = "#4a3f36";
const EYE = "#e9d75a";
const INK = "#16110d";
const NOSE = "#9a6a61";

// Толгой: 64×56 нэгжийн талбайд, (0,0)-оос.
function Head({ mood }: { mood: "grumpy" | "sleepy" }) {
  return (
    <g>
      {/* Чих: хажуудаа, намхан, дугуй. */}
      <ellipse cx="9" cy="19" rx="8" ry="7.5" fill={FUR_DARK} />
      <ellipse cx="55" cy="19" rx="8" ry="7.5" fill={FUR_DARK} />
      <ellipse cx="10" cy="20" rx="4.5" ry="4" fill={CREAM} />
      <ellipse cx="54" cy="20" rx="4.5" ry="4" fill={CREAM} />
      {/* Толгой: өндрөөсөө өргөн, хацрын урт үстэй. */}
      <path
        d="M32 6c14 0 26 8 27 22 .4 5-1 9-4 12l3 5-7-1.5C46 48 39.500 51 32 51s-14-3-19-7.500L6 45l3-5c-3-3-4.400-7-4-12C6 14 18 6 32 6Z"
        fill={FUR}
      />
      {/* Духны толбо. */}
      <g fill={MARK}>
        <circle cx="26" cy="13" r="1.3" />
        <circle cx="32" cy="11.500" r="1.3" />
        <circle cx="38" cy="13" r="1.3" />
        <circle cx="29" cy="17" r="1.1" />
        <circle cx="35" cy="17" r="1.1" />
      </g>
      {/* Хацрын хоёр судал. */}
      <g fill="none" stroke={MARK} strokeWidth="1.8" strokeLinecap="round">
        <path d="M14 33c-3 1-5.500 2.500-7.500 4.500" />
        <path d="M15 37.500c-2.500 1.200-4.500 2.800-6 4.800" />
        <path d="M50 33c3 1 5.500 2.500 7.500 4.500" />
        <path d="M49 37.500c2.500 1.200 4.500 2.800 6 4.800" />
      </g>
      {/* Нүдний эргэн тойрны цайвар хүрээ, хоншоор, эрүү. */}
      <ellipse cx="21.500" cy="28" rx="8" ry="6.500" fill={CREAM} />
      <ellipse cx="42.500" cy="28" rx="8" ry="6.500" fill={CREAM} />
      <ellipse cx="32" cy="40" rx="9.500" ry="7" fill={CREAM} />
      {mood === "sleepy" ? (
        <g fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round">
          <path d="M16.500 29c3 2.200 7 2.200 10 0" />
          <path d="M37.500 29c3 2.200 7 2.200 10 0" />
        </g>
      ) : (
        <>
          {/* Шар нүд, дугуй хүүхэн хараа (манулынх босоо биш). */}
          <circle cx="21.500" cy="29" r="5" fill={EYE} />
          <circle cx="42.500" cy="29" r="5" fill={EYE} />
          <circle cx="22.200" cy="29.500" r="2.300" fill={INK} />
          <circle cx="41.800" cy="29.500" r="2.300" fill={INK} />
          <circle cx="23" cy="28.600" r="0.700" fill="#fff" />
          <circle cx="42.600" cy="28.600" r="0.700" fill="#fff" />
          {/* Хавтгай, дотогшоо налуу зовхи — дургүйцсэн харц. */}
          <path d="M14.500 24.500 28.500 27v-5.500h-14Z" fill={FUR} />
          <path d="M49.500 24.500 35.500 27v-5.500h14Z" fill={FUR} />
          <g fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round">
            <path d="M15 24.800 28 27.200" />
            <path d="M49 24.800 36 27.200" />
          </g>
        </>
      )}
      {/* Хамар, ам (доошоо харсан). */}
      <path d="M29.500 36.500h5l-2.500 3Z" fill={NOSE} stroke={NOSE} strokeWidth="1" strokeLinejoin="round" />
      <g fill="none" stroke={MARK} strokeWidth="1.400" strokeLinecap="round">
        <path d="M32 39.500v2.200" />
        <path d="M32 41.700c-1.500 0-2.800.700-3.600 1.800" />
        <path d="M32 41.700c1.500 0 2.800.700 3.600 1.800" />
      </g>
    </g>
  );
}

export default function Manul({ variant = "head", mood = "grumpy", className = "h-8 w-8", title }: ManulProps) {
  const a11y = title ? { role: "img" as const, "aria-label": title } : { "aria-hidden": true as const };
  if (variant === "head") {
    return (
      <svg viewBox="0 0 64 56" className={`shrink-0 ${className}`} focusable="false" {...a11y}>
        <Head mood={mood} />
      </svg>
    );
  }
  // Номон дээр "талх" болон хэвтсэн: бөөрөнхий бие, цагирагтай бүдүүн сүүл, урд нь нээлттэй ном.
  return (
    <svg viewBox="0 0 120 104" className={`shrink-0 ${className}`} focusable="false" {...a11y}>
      {/* Сүүл: бүдүүн, бараан цагирагтай, үзүүр нь хар. */}
      <path d="M92 74c12 2 20-3 20-11s-7-12-14-10" fill="none" stroke={FUR} strokeWidth="11" strokeLinecap="round" />
      <g fill="none" stroke={MARK} strokeWidth="11" strokeLinecap="butt">
        <path d="M109.500 69.500c1.200-1.500 2-3.300 2.300-5.200" />
        <path d="M110.800 58.500c-1-2-2.600-3.600-4.600-4.600" />
      </g>
      <path d="M98 53c-1.500.300-3 .900-4 1.800" fill="none" stroke={INK} strokeWidth="11" strokeLinecap="round" />
      {/* Бие: өргөн "талх". */}
      <path d="M22 84c-4-22 10-38 38-38s42 16 38 38Z" fill={FUR} />
      <path d="M40 84c1-9 8-14 20-14s19 5 20 14Z" fill={CREAM} />
      <g fill="none" stroke={FUR_DARK} strokeWidth="2" strokeLinecap="round">
        <path d="M30 62c-2 4-3 9-3 14" />
        <path d="M90 62c2 4 3 9 3 14" />
      </g>
      {/* Толгой бие дээрээ. */}
      <g transform="translate(28 10)">
        <Head mood={mood} />
      </g>
      {/* Нээлттэй ном, дээр нь урд сарвуу. */}
      <path d="M24 86h34c1.500 0 2 1 2 2 0-1 .500-2 2-2h34v10H62c-1.500 0-2 1-2 2 0-1-.500-2-2-2H24Z" fill="#1f7ae0" />
      <path d="M27 84h31c1 0 2 .700 2 2v9c0-1-.800-1.800-2-1.800H27Z" fill="#eef3f9" />
      <path d="M93 84H62c-1 0-2 .700-2 2v9c0-1 .800-1.800 2-1.800h31Z" fill="#dfe7f1" />
      <g fill="none" stroke="#a9b9cd" strokeWidth="1.200" strokeLinecap="round">
        <path d="M32 87.500h22M32 90.500h18" />
        <path d="M66 87.500h22M66 90.500h16" />
      </g>
      <ellipse cx="45" cy="83.500" rx="8" ry="4.500" fill={FUR} />
      <ellipse cx="75" cy="83.500" rx="8" ry="4.500" fill={FUR} />
      <g fill="none" stroke={FUR_DARK} strokeWidth="1.200" strokeLinecap="round">
        <path d="M42 82.500v2.500M45 82v3M48 82.500v2.500" />
        <path d="M72 82.500v2.500M75 82v3M78 82.500v2.500" />
      </g>
    </svg>
  );
}
