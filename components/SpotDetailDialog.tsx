"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ACCESSIBILITY,
  ACCESSIBILITY_GROUPS,
  AMENITIES,
  googleMapsUrl,
  PLACEHOLDER_IMAGE,
  Review,
  spotCategory,
  StudySpot,
  TAG_INFO,
  tagLabel,
} from "@/types";
import { fetchReviews } from "@/lib/supabase/spots";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { reviewsForSpot } from "@/lib/localStore";
import Stars from "@/components/Stars";
import { openStatus, STATUS_TONE, useNow } from "@/lib/openHours";
import { formatOutlets, formatQuiet, formatWifi, summarizeSpot } from "@/lib/scores";
import { recentReviewCounts } from "@/lib/popular";
import PopularBadge from "@/components/PopularBadge";
import BusynessPanel from "@/components/BusynessPanel";
import { SpotCheckin } from "@/lib/busyness";
import ReviewsDialog, { ReviewItem } from "@/components/ReviewsDialog";
import ReportDialog from "@/components/ReportDialog";
import HeartIcon from "@/components/HeartIcon";
import SmartImage from "@/components/SmartImage";
import GoogleMapsIcon from "@/components/GoogleMapsIcon";
import { MediaStrip, MediaViewer } from "@/components/MediaGallery";
import { useI18n } from "@/components/LanguageProvider";
import KeyIcon from "@/components/KeyIcon";
import { ArrowDown, ArrowUp, Circle, SquareParking, X } from "lucide-react";

interface SpotDetailDialogProps {
  spot: StudySpot;
  onClose: () => void;
  onShowOnMap: (lat: number, lng: number) => void;
  onReviewAdded?: (review: Review) => void;
  onCheckin?: (checkin: SpotCheckin) => void;
  favorite?: boolean;
  onToggleFavorite?: () => void;
}

export default function SpotDetailDialog({
  spot,
  onClose,
  onShowOnMap,
  onReviewAdded,
  onCheckin,
  favorite = false,
  onToggleFavorite,
}: SpotDetailDialogProps) {
  const { t, locale } = useI18n();
  const now = useNow();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  // Цомог: жинхэнэ нүүр зураг (ерөнхий зураг биш) эхэнд, дараа нь нэмэлт зураг, бичлэг.
  const gallery = [
    ...(spot.image && spot.image !== PLACEHOLDER_IMAGE ? [{ url: spot.image, type: "image" as const }] : []),
    ...(spot.media ?? []),
  ];
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // Доош/дээш үсрэх товч: гүйлгэх боломжтой үед л харагдана; доод хэсэгт хүрвэл дээш заана.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ scrollable: false, atBottom: false });
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () =>
      setScroll({
        scrollable: el.scrollHeight > el.clientHeight + 8,
        atBottom: el.scrollTop + el.clientHeight >= el.scrollHeight - 40,
      });
    // Зураг, сэтгэгдэл ачаалагдахад өндөр өөрчлөгдөнө.
    const observer = new ResizeObserver(update);
    observer.observe(el);
    Array.from(el.children).forEach((child) => observer.observe(child));
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, []);
  const jump = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: scroll.atBottom ? 0 : el.scrollHeight, behavior: "smooth" });
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (isSupabaseConfigured) {
        const remote = await fetchReviews(spot.id);
        if (!cancelled && remote) {
          setReviews(remote);
          setLoading(false);
          return;
        }
      }
      if (cancelled) return;
      setReviews(reviewsForSpot(spot.id));
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [spot.id]);

  // Esc: сэтгэгдлийн цонх нээлттэй бол түүнийг, эс бөгөөс газрын цонхыг хаана. Ард талын хуудас гүйлгэгдэхгүй.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (viewerIndex !== null) setViewerIndex(null);
      else if (reportOpen) setReportOpen(false);
      else if (reviewsOpen) setReviewsOpen(false);
      else onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, reviewsOpen, reportOpen, viewerIndex]);

  const average =
    reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  const status = now === null ? null : openStatus(spot, now, t);
  const category = spotCategory(spot.category);
  const accessibility = ACCESSIBILITY_GROUPS.map((group) => ({
    key: group.key,
    label: group.label[locale],
    items: ACCESSIBILITY.filter((item) => item.group === group.key && spot.accessibility?.includes(item.key)).map(
      (item) => ({ key: item.key, iconKey: item.key as string, label: item.label[locale] })
    ),
  })).filter((group) => group.items.length > 0);

  // Шошго, төрөл, үйлчилгээг нэг жагсаалтын оронд бүлгээр нь харуулна.
  const tagChips = (group: string) =>
    spot.tags
      .filter((tag) => (TAG_INFO[tag]?.group ?? "other") === group)
      .map((tag) => ({ key: `tag:${tag}`, iconKey: tag, label: tagLabel(tag, locale), raw: tag }));
  const featureGroups = [
    {
      key: "type",
      title: t.groupType,
      chips: [
        ...(category ? [{ key: `category:${category.key}`, iconKey: category.key as string, label: category.label[locale] }] : []),
        // "Номын сан" шошго нь төрөлтэй давхцвал нэг л удаа (шошго монголоор хадгалагддаг).
        ...tagChips("type").filter((chip) => chip.raw.toLowerCase() !== category?.label.mn.toLowerCase()),
      ],
    },
    { key: "environment", title: t.groupEnvironment, chips: tagChips("environment") },
    {
      key: "amenities",
      title: t.groupAmenities,
      chips: [
        ...tagChips("amenities"),
        ...AMENITIES.filter((amenity) => spot.amenities?.includes(amenity.key)).map((amenity) => ({
          key: amenity.key,
          iconKey: amenity.key as string,
          label: amenity.label[locale],
        })),
      ],
    },
    { key: "other", title: t.groupOther, chips: tagChips("other") },
  ].filter((group) => group.chips.length > 0);

  // Газар нэмэгчийн утга + сэтгэгдлүүдийн утгаас нэгтгэсэн оноо.
  const summary = summarizeSpot(spot, reviews);
  const recentCount = now === null ? undefined : recentReviewCounts(reviews, now)[spot.id];
  const facts: { iconKey: string; label: string; value?: string; note?: string }[] = [
    { iconKey: "location", label: t.factLocation, value: spot.location },
    { iconKey: "hours", label: t.factHours, value: status ? status.schedule : spot.hours },
    {
      iconKey: "wifi",
      label: t.factWifi,
      value: summary.wifi && formatWifi(summary.wifi),
      note: summary.wifi && t.fromRatings(summary.wifi.count),
    },
    {
      iconKey: "quiet",
      label: t.factQuiet,
      value: summary.quiet && formatQuiet(summary.quiet, locale),
      note: summary.quiet && t.fromRatings(summary.quiet.count),
    },
    {
      iconKey: "outlets",
      label: t.factOutlets,
      value: summary.outlets && formatOutlets(summary.outlets, locale),
      note: summary.outlets && t.fromRatings(summary.outlets.count),
    },
  ].filter((fact) => fact.value);

  // Шинэ сэтгэгдлийг эхэнд нэмнэ; засварласныг байранд нь солино.
  const handleReviewAdded = (review: Review) => {
    setReviews((prev) =>
      prev.some((item) => item.id === review.id)
        ? prev.map((item) => (item.id === review.id ? review : item))
        : [review, ...prev]
    );
    onReviewAdded?.(review);
  };

  return (
    <div
      className="fixed inset-0 bg-night/55 z-[1100] flex items-stretch sm:items-center justify-center p-0 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="spot-dialog-title"
        ref={scrollRef}
        className="relative bg-sheet sm:border border-line w-full max-w-4xl rounded-none sm:rounded-md shadow-dialog h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[92vh] overflow-y-auto"
      >
        {/* Наалддаг дээд мөр: үсрэх, хадгалах, хаах товч агуулгын дээгүүр хөвөхгүй (өөрийн мөртэй). */}
        <div className="sticky top-0 z-20 flex items-center justify-end gap-1.5 px-3 py-2 bg-sheet border-b border-line">
          {scroll.scrollable ? (
            <button
              type="button"
              onClick={jump}
              aria-label={scroll.atBottom ? t.scrollToTop : t.scrollToBottom}
              title={scroll.atBottom ? t.scrollToTop : t.scrollToBottom}
              className="h-9 w-9 flex items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-panel transition-colors"
            >
              {scroll.atBottom ? (
                <ArrowUp aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
              ) : (
                <ArrowDown aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
              )}
            </button>
          ) : null}
          {onToggleFavorite ? (
            <button
              type="button"
              onClick={onToggleFavorite}
              aria-pressed={favorite}
              aria-label={favorite ? t.unsaveSpot(spot.name) : t.saveSpot(spot.name)}
              title={favorite ? t.unsave : t.save}
              className="h-9 w-9 flex items-center justify-center rounded-full text-ink hover:bg-panel transition-colors"
            >
              <HeartIcon filled={favorite} className="h-5 w-5" />
            </button>
          ) : null}
          <button
            onClick={onClose}
            type="button"
            aria-label={t.close}
            className="h-9 w-9 flex items-center justify-center rounded-full bg-panel text-ink hover:bg-line transition-colors"
          >
            <X aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>

        {/* Зураг дээр тусдаа тууз; нэр, мэдээлэл нь доор цагаан хуудсан дээр (зураг дээр бичвэр давхарлахгүй). */}
        <div className="relative h-52 sm:h-72 bg-panel">
          <SmartImage
            src={spot.image || PLACEHOLDER_IMAGE}
            alt={spot.name}
            fill
            sizes="(min-width: 896px) 896px, 100vw"
            loading="eager"
            fetchPriority="high"
            className="object-cover"
          />
        </div>
        <div className="px-5 sm:px-6 pt-5 pb-6 space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2 empty:hidden">
              {category ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-link bg-azure-soft px-2 py-1 rounded">
                  <KeyIcon k={category.key} className="h-3.5 w-3.5" />
                  {category.label[locale]}
                </span>
              ) : null}
              <PopularBadge recentCount={recentCount} className="text-xs px-2 py-1" />
            </div>
            <h2 id="spot-dialog-title" className="text-2xl sm:text-[28px] font-bold tracking-[-0.02em] leading-tight text-ink">
              {spot.name}
            </h2>
            <div className="text-sm text-ink-muted mt-1.5 flex items-center gap-2 min-h-5">
              {loading ? (
                <span className="h-3.5 w-32 rounded bg-panel animate-pulse" aria-hidden="true" />
              ) : reviews.length > 0 ? (
                <>
                  <Stars value={average} />
                  <span className="tabular-nums">
                    <span className="font-semibold text-ink">{average.toFixed(1)}</span> · {t.reviewCount(reviews.length)}
                  </span>
                </>
              ) : (
                <span>{t.noRatingsYet}</span>
              )}
            </div>
          </div>

          {spot.description ? (
            <p className="text-[15px] text-ink leading-relaxed whitespace-pre-line max-w-[65ch]">{spot.description}</p>
          ) : null}
          {status ? (
            <p className={`inline-flex items-center gap-2 text-sm font-semibold ${STATUS_TONE[status.tone]}`}>
              <Circle aria-hidden="true" className="h-2.5 w-2.5" fill="currentColor" strokeWidth={0} />
              {status.detail}
            </p>
          ) : null}

          {/* Одоогийн ачаалал — нэр, төлөвийн дараах хамгийн чухал мэдээлэл. */}
          <BusynessPanel spot={spot} onCheckin={onCheckin} />

          {/* Утсан дээр: байршил бүтэн өргөн, цаг / Wi-Fi / чимээгүй / залгуур 2×2. */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
            {facts.map((fact, index) => (
              <div
                key={fact.label}
                className={`bg-panel rounded-md px-3 py-2.5 sm:px-4 sm:py-3 min-w-0 ${index === 0 ? "col-span-2 lg:col-span-1" : ""}`}
              >
                <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink-muted">
                  <KeyIcon k={fact.iconKey} className="h-3.5 w-3.5" strokeWidth={2} />
                  {fact.label}
                </p>
                <p className="text-sm text-ink font-semibold mt-0.5 tabular-nums">{fact.value}</p>
                {fact.note ? <p className="text-[11px] text-ink-muted mt-0.5">{fact.note}</p> : null}
              </div>
            ))}
          </div>
        </div>

        {/* Гүйлгэх боломжтой үед доор зай үлдээнэ — үсрэх товч сүүлийн товчнуудыг халхлахгүй. */}
        <div className="px-5 sm:px-6 pt-1 pb-5 sm:pb-6 space-y-6">
          {gallery.length > 1 || (spot.media?.length ?? 0) > 0 ? (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-ink-muted">
                {t.mediaHeading} <span className="text-ink-muted">({gallery.length})</span>
              </h3>
              <MediaStrip items={gallery} onOpen={setViewerIndex} />
            </section>
          ) : null}

          {featureGroups.length > 0 || accessibility.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {featureGroups.map((group) => (
                <section key={group.key} className="space-y-2">
                  <h3 className="text-xs font-semibold text-ink-muted">{group.title}</h3>
                  <ChipList chips={group.chips} />
                </section>
              ))}
              {accessibility.length > 0 ? (
                <section className="space-y-2 md:col-span-2">
                  <h3 className="text-xs font-semibold text-ink-muted">{t.accessibility}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {accessibility.map((group) => (
                      <div key={group.key} className="space-y-1.5">
                        <p className="text-[11px] font-medium text-ink-muted">{group.label}</p>
                        <ChipList chips={group.items} />
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}

          <section className="space-y-3 border-t border-line pt-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-ink">
                {t.reviewsHeading} {loading ? "" : `(${reviews.length})`}
              </h3>
              <button
                type="button"
                onClick={() => setReviewsOpen(true)}
                className="text-xs font-semibold text-link hover:text-ink"
              >
                {reviews.length > 0 ? t.seeAllAndWrite : t.writeReviewLink}
              </button>
            </div>
            {loading ? (
              <div className="h-16 rounded-md bg-panel animate-pulse" aria-hidden="true" />
            ) : reviews.length === 0 ? (
              <p className="text-xs text-ink-muted">{t.noReviewsYet}</p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {reviews.slice(0, 2).map((review) => (
                  <ReviewItem key={review.id} review={review} clamp />
                ))}
              </ul>
            )}
          </section>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/parking?spot=${spot.id}`}
              className="col-span-2 py-2.5 inline-flex items-center justify-center gap-2 bg-sun-soft text-sun-deep text-sm font-semibold rounded-md border border-sun/40 hover:border-sun transition-colors"
            >
              <SquareParking aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
              {t.findParkingNearby}
            </Link>
            <button
              type="button"
              onClick={() => {
                onShowOnMap(spot.lat, spot.lng);
                onClose();
              }}
              className="py-2.5 bg-azure hover:bg-azure-deep text-white text-sm font-semibold rounded-md transition-colors"
            >
              {t.showOnMapButton}
            </button>
            <a
              href={googleMapsUrl(spot)}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 inline-flex items-center justify-center gap-2 bg-sheet hover:bg-panel text-ink text-sm font-semibold rounded-md text-center border border-line transition-colors"
            >
              <GoogleMapsIcon className="h-4 w-4" />
              Google Maps
            </a>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="text-xs text-ink-muted hover:text-sun-deep underline-offset-2 hover:underline"
            >
              {t.reportWrongInfo}
            </button>
          </div>
        </div>
      </div>

      {viewerIndex !== null ? (
        <MediaViewer
          items={gallery}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      ) : null}
      {reportOpen ? <ReportDialog spot={spot} onClose={() => setReportOpen(false)} /> : null}
      {reviewsOpen ? (
        <ReviewsDialog
          spot={spot}
          reviews={reviews}
          loading={loading}
          onReviewAdded={handleReviewAdded}
          onClose={() => setReviewsOpen(false)}
        />
      ) : null}
    </div>
  );
}

function ChipList({ chips }: { chips: readonly { key: string; iconKey: string; label: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <li
          key={chip.key}
          className="flex items-center gap-1.5 text-xs text-ink bg-panel px-2.5 py-1 rounded"
        >
          <KeyIcon k={chip.iconKey} className="h-3.5 w-3.5 text-ink-muted" />
          {chip.label}
        </li>
      ))}
    </ul>
  );
}
