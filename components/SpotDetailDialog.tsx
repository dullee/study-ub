"use client";

import { useEffect, useRef, useState } from "react";
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
import ReviewsDialog, { ReviewItem } from "@/components/ReviewsDialog";
import { useI18n } from "@/components/LanguageProvider";

interface SpotDetailDialogProps {
  spot: StudySpot;
  onClose: () => void;
  onShowOnMap: (lat: number, lng: number) => void;
  onReviewAdded?: (review: Review) => void;
}

export default function SpotDetailDialog({
  spot,
  onClose,
  onShowOnMap,
  onReviewAdded,
}: SpotDetailDialogProps) {
  const { t, locale } = useI18n();
  const now = useNow();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsOpen, setReviewsOpen] = useState(false);

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
      if (reviewsOpen) setReviewsOpen(false);
      else onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, reviewsOpen]);

  const average =
    reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  const status = now === null ? null : openStatus(spot, now, t);
  const category = spotCategory(spot.category);
  const accessibility = ACCESSIBILITY_GROUPS.map((group) => ({
    key: group.key,
    label: group.label[locale],
    items: ACCESSIBILITY.filter((item) => item.group === group.key && spot.accessibility?.includes(item.key)).map(
      (item) => ({ key: item.key, icon: item.icon, label: item.label[locale] })
    ),
  })).filter((group) => group.items.length > 0);

  // Шошго, төрөл, үйлчилгээг нэг жагсаалтын оронд бүлгээр нь харуулна.
  const tagChips = (group: string) =>
    spot.tags
      .filter((tag) => (TAG_INFO[tag]?.group ?? "other") === group)
      .map((tag) => ({ key: `tag:${tag}`, icon: TAG_INFO[tag]?.icon ?? "🏷️", label: tagLabel(tag, locale), raw: tag }));
  const featureGroups = [
    {
      key: "type",
      title: t.groupType,
      chips: [
        ...(category ? [{ key: `category:${category.key}`, icon: category.icon, label: category.label[locale] }] : []),
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
          icon: amenity.icon,
          label: amenity.label[locale],
        })),
      ],
    },
    { key: "other", title: t.groupOther, chips: tagChips("other") },
  ].filter((group) => group.chips.length > 0);

  // Газар нэмэгчийн утга + сэтгэгдлүүдийн утгаас нэгтгэсэн оноо.
  const summary = summarizeSpot(spot, reviews);
  const facts: { icon: string; label: string; value?: string; note?: string }[] = [
    { icon: "📍", label: t.factLocation, value: spot.location },
    { icon: "⏰", label: t.factHours, value: status ? status.schedule : spot.hours },
    {
      icon: "⚡",
      label: t.factWifi,
      value: summary.wifi && formatWifi(summary.wifi),
      note: summary.wifi && t.fromRatings(summary.wifi.count),
    },
    {
      icon: "🤫",
      label: t.factQuiet,
      value: summary.quiet && formatQuiet(summary.quiet, locale),
      note: summary.quiet && t.fromRatings(summary.quiet.count),
    },
    {
      icon: "🔌",
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
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[1100] flex items-stretch sm:items-center justify-center p-0 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="spot-dialog-title"
        ref={scrollRef}
        className="relative bg-slate-900 sm:border border-slate-800 w-full max-w-4xl rounded-none sm:rounded-2xl shadow-2xl h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[92vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 h-0 flex justify-end">
          <button
            onClick={onClose}
            type="button"
            aria-label={t.close}
            className="mt-3 mr-3 h-10 w-10 shrink-0 rounded-full bg-slate-900/80 backdrop-blur text-slate-200 hover:text-white border border-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Зураг дээд хэсгийн ард (шошгын бүлгүүд хүртэл): нэр, тайлбар, төлөв, мэдээллийн хайрцгууд дээр нь. */}
        <div className="relative isolate">
          <img
            src={spot.image || PLACEHOLDER_IMAGE}
            alt={spot.name}
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/0 via-slate-950/70 to-slate-900" />
          <div className="px-5 sm:px-6 pt-32 sm:pt-44 pb-6 space-y-4">
            <div>
              {category ? (
                <span className="inline-block mb-2 text-xs font-semibold bg-slate-900/80 backdrop-blur text-indigo-300 border border-slate-700 px-2.5 py-1 rounded-lg">
                  {category.icon} {category.label[locale]}
                </span>
              ) : null}
              <h2 id="spot-dialog-title" className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md">
                {spot.name}
              </h2>
              <div className="text-sm text-slate-200 mt-1 flex items-center gap-2 min-h-5 drop-shadow">
                {loading ? (
                  <span className="h-3.5 w-32 rounded bg-slate-700/80 animate-pulse" aria-hidden="true" />
                ) : reviews.length > 0 ? (
                  <>
                    <Stars value={average} />
                    <span>
                      {average.toFixed(1)} · {t.reviewCount(reviews.length)}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-300">{t.noRatingsYet}</span>
                )}
              </div>
            </div>

            {spot.description ? (
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line drop-shadow">{spot.description}</p>
            ) : null}
            {status ? (
              <p className={`inline-block text-sm font-semibold bg-slate-950/60 backdrop-blur px-2.5 py-1 rounded-lg ${STATUS_TONE[status.tone]}`}>
                ● {status.detail}
              </p>
            ) : null}

            {/* Утсан дээр: байршил бүтэн өргөн, цаг / Wi-Fi / чимээгүй / розетка 2×2. */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
              {facts.map((fact, index) => (
                <div
                  key={fact.label}
                  className={`bg-slate-950/55 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 min-w-0 ${
                    index === 0 ? "col-span-2 lg:col-span-1" : ""
                  }`}
                >
                  <p className="text-[11px] text-slate-300">
                    {fact.icon} {fact.label}
                  </p>
                  <p className="text-sm text-white font-medium mt-0.5">{fact.value}</p>
                  {fact.note ? <p className="text-[11px] text-slate-400 mt-0.5">{fact.note}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Гүйлгэх боломжтой үед доор зай үлдээнэ — үсрэх товч сүүлийн товчнуудыг халхлахгүй. */}
        <div className={`px-5 sm:px-6 pt-1 space-y-6 ${scroll.scrollable ? "pb-24" : "pb-5 sm:pb-6"}`}>
          {featureGroups.length > 0 || accessibility.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {featureGroups.map((group) => (
                <section key={group.key} className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-400">{group.title}</h3>
                  <ChipList chips={group.chips} />
                </section>
              ))}
              {accessibility.length > 0 ? (
                <section className="space-y-2 md:col-span-2">
                  <h3 className="text-xs font-semibold text-slate-400">{t.accessibility}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {accessibility.map((group) => (
                      <div key={group.key} className="space-y-1.5">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">{group.label}</p>
                        <ChipList chips={group.items} />
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}

          <section className="space-y-3 border-t border-slate-800 pt-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-200">
                {t.reviewsHeading} {loading ? "" : `(${reviews.length})`}
              </h3>
              <button
                type="button"
                onClick={() => setReviewsOpen(true)}
                className="text-xs font-semibold text-indigo-300 hover:text-white"
              >
                {reviews.length > 0 ? t.seeAllAndWrite : t.writeReviewLink}
              </button>
            </div>
            {loading ? (
              <div className="h-16 rounded-xl bg-slate-800/40 animate-pulse" aria-hidden="true" />
            ) : reviews.length === 0 ? (
              <p className="text-xs text-slate-500">{t.noReviewsYet}</p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {reviews.slice(0, 2).map((review) => (
                  <ReviewItem key={review.id} review={review} clamp />
                ))}
              </ul>
            )}
          </section>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onShowOnMap(spot.lat, spot.lng);
                onClose();
              }}
              className="py-2.5 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-sm font-semibold rounded-xl border border-slate-700 hover:border-indigo-500 transition-all"
            >
              {t.showOnMapButton}
            </button>
            <a
              href={googleMapsUrl(spot)}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl text-center transition-all"
            >
              Google Maps ↗
            </a>
          </div>
        </div>

        {scroll.scrollable ? (
          <div className="sticky bottom-0 z-10 h-0 flex justify-end pointer-events-none">
            <button
              type="button"
              onClick={jump}
              aria-label={scroll.atBottom ? t.scrollToTop : t.scrollToBottom}
              title={scroll.atBottom ? t.scrollToTop : t.scrollToBottom}
              className="pointer-events-auto -translate-y-[calc(100%+1.5rem)] sm:-translate-y-[calc(100%+2rem)] mr-4 sm:mr-6 h-11 w-11 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-lg shadow-lg shadow-indigo-950/60 border border-indigo-400/40 transition-colors"
            >
              <span aria-hidden="true">{scroll.atBottom ? "↑" : "↓"}</span>
            </button>
          </div>
        ) : null}
      </div>

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

function ChipList({ chips }: { chips: readonly { key: string; icon: string; label: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <li
          key={chip.key}
          className="flex items-center gap-1.5 text-xs text-slate-200 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg"
        >
          <span aria-hidden="true">{chip.icon}</span>
          {chip.label}
        </li>
      ))}
    </ul>
  );
}
