"use client";

import { Navigation, Plug, VolumeX, Wifi } from "lucide-react";
import { googleMapsUrl, OUTLET_LEVELS, PLACEHOLDER_IMAGE, QUIET_LEVELS, spotCategory, StudySpot } from "@/types";
import Stars from "@/components/Stars";
import { openStatus, STATUS_TONE, useNow } from "@/lib/openHours";
import { formatWifi, levelLabel, SpotSummary } from "@/lib/scores";
import { formatDistance } from "@/lib/geo";
import { useI18n } from "@/components/LanguageProvider";
import PopularBadge from "@/components/PopularBadge";
import BusynessBadge from "@/components/BusynessBadge";
import HeartIcon from "@/components/HeartIcon";
import SmartImage from "@/components/SmartImage";
import GoogleMapsIcon from "@/components/GoogleMapsIcon";
import KeyIcon from "@/components/KeyIcon";
import { BusynessSummary } from "@/lib/busyness";

interface SpotCardProps {
  spot: StudySpot;
  onOpenDetails: (spot: StudySpot) => void;
  // Газар нэмэгч + сэтгэгдлүүдээс нэгтгэсэн оноо (lib/scores.ts).
  summary: SpotSummary | undefined;
  // Сэтгэгдэл ачаалж байх үед одны үнэлгээний оронд placeholder.
  ratingsLoading: boolean;
  // Хэрэглэгчээс хүрэх зай (км). Байршил мэдэгдэхгүй бол undefined.
  distanceKm?: number;
  // Сүүлийн долоо хоногийн сэтгэгдлийн тоо — хангалттай бол "Эрэлттэй".
  recentReviews?: number;
  // Сүүлийн 90 минутын "Би энд байна" мэдээллээс тооцсон одоогийн ачаалал.
  busyness?: BusynessSummary;
  // Хадгалсан эсэх, зүрхэн товч.
  favorite?: boolean;
  onToggleFavorite?: (spotId: number) => void;
  // Хулганаар заах / гараар сонгоход газрын зураг дээр тодруулна; null — болих.
  onHover?: (spot: StudySpot | null) => void;
}

// Зураг дээрх дугуй товч: бараан суурьтай тул ямар ч зураг дээр харагдана.
const iconButtonClass =
  "pointer-events-auto h-9 w-9 flex items-center justify-center rounded-full bg-night/70 text-white hover:bg-night transition-colors";

// Зураг картыг бүхэлд нь дүүргэнэ; доод талын бараан уусалт дээр нэр, төлөв, өгөгдөл уншигдана.
// Зүүн дээд буланд одоогийн ачаалал (нэрийн дараах хамгийн тод элемент), баруун дээд буланд хадгалах, Google Maps.
// Карт бүхэлдээ дарагдана: бүрхэх товч доор, агуулга pointer-events-none-оор дээр — зөвхөн хоёр жижиг товч pointer-events-auto.
export default function SpotCard({
  spot,
  onOpenDetails,
  summary,
  ratingsLoading,
  distanceKm,
  recentReviews,
  busyness,
  favorite = false,
  onToggleFavorite,
  onHover,
}: SpotCardProps) {
  const { t, locale } = useI18n();
  const now = useNow();
  const status = now === null ? null : openStatus(spot, now, t);
  const category = spotCategory(spot.category);
  const rating = summary?.rating;
  const data = [
    summary?.wifi ? { key: "wifi", icon: Wifi, text: formatWifi(summary.wifi) } : null,
    summary?.quiet ? { key: "quiet", icon: VolumeX, text: levelLabel(QUIET_LEVELS, summary.quiet.value, locale) } : null,
    summary?.outlets ? { key: "outlets", icon: Plug, text: levelLabel(OUTLET_LEVELS, summary.outlets.value, locale) } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <article
      // Утсан дээр гүйлгэхэд аль карт голд байгааг page.tsx эндээс таньна.
      data-spot-id={spot.id}
      // Зөвхөн хулгана (мэдрэгч дэлгэцэнд hover байхгүй) болон гарын focus.
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") onHover?.(spot);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") onHover?.(null);
      }}
      onFocus={() => onHover?.(spot)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onHover?.(null);
      }}
      className="group relative isolate flex min-h-64 flex-col justify-between overflow-hidden bg-panel border-b border-ground last:border-b-0 cursor-pointer has-focus-visible:ring-2 has-focus-visible:ring-inset has-focus-visible:ring-link"
    >
      <SmartImage
        src={spot.image || PLACEHOLDER_IMAGE}
        alt=""
        fill
        sizes="(min-width: 1024px) 400px, 100vw"
        className="-z-20 object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
      />
      {/* Уншигдах бүрхүүл: зөвхөн бичвэрийн ард (доороос) бараан, зураг дээд талдаа цэвэр үлдэнэ. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/75 via-40% to-night/5" />

      <div className="relative z-10 pointer-events-none flex items-start justify-between gap-2 p-2.5">
        <BusynessBadge summary={busyness} now={now} showEmpty className="text-xs font-bold" emptyClassName="bg-night/70 text-white/85 border-white/40" />
        <div className="relative z-20 flex gap-1.5">
          {onToggleFavorite ? (
            <button
              type="button"
              onClick={() => onToggleFavorite(spot.id)}
              aria-pressed={favorite}
              aria-label={favorite ? t.unsaveSpot(spot.name) : t.saveSpot(spot.name)}
              title={favorite ? t.unsave : t.save}
              className={iconButtonClass}
            >
              <HeartIcon filled={favorite} />
            </button>
          ) : null}
          <a
            href={googleMapsUrl(spot)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.openInGoogleMapsFor(spot.name)}
            title={t.openInGoogleMaps}
            className={iconButtonClass}
          >
            <GoogleMapsIcon className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="relative z-10 pointer-events-none px-3 pb-3 pt-10 text-white">
        <h3 className="text-lg font-bold leading-snug tracking-[-0.01em] line-clamp-2">{spot.name}</h3>

        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-white/85">
          {category ? <KeyIcon k={category.key} className="h-3.5 w-3.5" /> : null}
          {status ? (
            // Багтахгүй бол дараагийн мөрөнд бүтнээр гарна — хаагдах цаг хэзээ ч таслагдахгүй.
            <span className="max-w-full">
              <span className={`font-semibold ${STATUS_TONE[status.tone]}`}>{status.label}</span>
              <span> · {status.hint}</span>
            </span>
          ) : (
            <span className="truncate">{spot.hours}</span>
          )}
          {distanceKm !== undefined ? (
            <span className="ml-auto inline-flex shrink-0 items-center gap-1 tabular-nums">
              <Navigation aria-hidden="true" className="h-3 w-3" strokeWidth={2} />
              {formatDistance(distanceKm, t)}
            </span>
          ) : null}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1.5 min-h-4">
            {ratingsLoading ? (
              <span className="h-3 w-24 rounded bg-white/20 animate-pulse" aria-hidden="true" />
            ) : rating ? (
              <>
                <Stars value={rating.value} />
                <span className="font-semibold tabular-nums">{rating.value.toFixed(1)}</span>
                <span className="text-white/75 tabular-nums">({rating.count})</span>
              </>
            ) : (
              <span className="text-white/75">{t.noRating}</span>
            )}
          </span>
          <PopularBadge recentCount={recentReviews} />
          {data.map(({ key, icon: Icon, text }) => (
            <span key={key} className="inline-flex items-center gap-1 text-[11px] text-white/80 tabular-nums">
              <Icon aria-hidden="true" className="h-3 w-3" strokeWidth={2} />
              {text}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpenDetails(spot)}
        aria-label={t.openDetails(spot.name)}
        className="absolute inset-0 z-0 focus:outline-none"
      />
    </article>
  );
}
