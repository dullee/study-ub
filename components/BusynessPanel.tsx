"use client";

import { useEffect, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  BUSYNESS_LEVELS,
  BusynessLevel,
  busynessInfo,
  CHECKIN_RADIUS_METERS,
  checkinProximity,
  recentOwnCheckin,
  SpotCheckin,
  summarizeBusyness,
} from "@/lib/busyness";
import {
  applyCheckinChange,
  fetchRecentCheckins,
  insertCheckin,
  subscribeCheckins,
  updateCheckinLevel,
} from "@/lib/supabase/checkins";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { checkinsForSpot, saveLocalCheckin } from "@/lib/localStore";
import { useNow } from "@/lib/openHours";
import { formatDistance, useUserLocation } from "@/lib/geo";
import { StudySpot } from "@/types";
import { useI18n } from "@/components/LanguageProvider";
import { BusynessMeter } from "@/components/BusynessBadge";
import PopularTimes from "@/components/PopularTimes";

// Газрын цонхонд: одоогийн ачаалал + "Би энд байна" товч → 1–5 шатлалаар үнэлэх.
// Хэрэглэгч 30 минутын дотор дахин дарвал шинэ тэмдэглэл биш, өөрийнхөө сүүлийнхийг засна.
// Шинэ тэмдэглэл, засвар хоёуланд нь хөтчөөр байршлыг шалгана — газраас 150 м дотор байх ёстой.
// Энэ нь хөтчийн шалгалт тул зориуд хуурах боломжтой; санамсаргүй / алсаас өгөх мэдээллийг л хаана.
export default function BusynessPanel({
  spot,
  onCheckin,
}: {
  spot: Pick<StudySpot, "id" | "lat" | "lng">;
  // Нүүр хуудасны карт, газрын зургийг шууд шинэчилнэ.
  onCheckin?: (checkin: SpotCheckin) => void;
}) {
  const spotId = spot.id;
  const { t, locale } = useI18n();
  const { user, isSignedIn } = useUser();
  const now = useNow();
  const [checkins, setCheckins] = useState<SpotCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { location, locate } = useUserLocation();
  // Илгээж буй түвшин — тэр товч дээр эргэлдэх дүрс харуулна.
  const [savingLevel, setSavingLevel] = useState<BusynessLevel | null>(null);
  const saving = savingLevel !== null;

  // Цонх нээлттэй байхад бусдын мэдээлэл шууд ирнэ (Realtime).
  useEffect(() => {
    let cancelled = false;
    const unsubscribe = subscribeCheckins((change) => setCheckins((prev) => applyCheckinChange(prev, change)), spotId);
    async function load() {
      const remote = isSupabaseConfigured ? await fetchRecentCheckins(spotId) : null;
      if (cancelled) return;
      const loaded = remote ?? checkinsForSpot(spotId);
      setCheckins((prev) => [...prev.filter((item) => !loaded.some((l) => l.id === item.id)), ...loaded]);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [spotId]);

  const summary = now === null ? null : summarizeBusyness(checkins, now);
  const mine = user && now !== null ? recentOwnCheckin(checkins, user.id, now) : undefined;

  // Засахад ч дахин шалгана — хэрэглэгч өөр газар явсан байж болно.
  const proximity =
    location.status === "ready" ? checkinProximity(spot, location.coords, location.accuracy) : null;
  const picking = open && proximity?.near === true;

  const start = () => {
    setOpen(true);
    locate();
  };

  const submit = async (level: BusynessLevel) => {
    if (!user) return;
    setSavingLevel(level);
    let saved: SpotCheckin | "too_soon" | null;
    if (!isSupabaseConfigured) {
      saved = saveLocalCheckin(mine ? { ...mine, level } : { spot_id: spotId, user_id: user.id, level });
    } else if (mine) {
      saved = await updateCheckinLevel(mine.id, level);
    } else {
      saved = await insertCheckin(spotId, user.id, level);
    }
    setSavingLevel(null);
    if (saved === null || saved === "too_soon") {
      toast.error(saved === "too_soon" ? t.checkinTooSoon : t.checkinFailed);
      return;
    }
    const result = saved;
    setCheckins((prev) => [result, ...prev.filter((item) => item.id !== result.id)]);
    onCheckin?.(result);
    setOpen(false);
    toast.success(mine ? t.checkinUpdated : t.checkinThanks);
  };

  const current = summary ? busynessInfo(summary.level) : null;
  const minutesAgo = summary && now !== null ? Math.max(0, Math.round((now - Date.parse(summary.latestAt)) / 60_000)) : 0;

  return (
    <section className="space-y-3 bg-panel border border-line rounded-md p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h3 className="text-sm font-semibold text-ink">{t.busynessHeading}</h3>
          {loading || now === null ? (
            <div className="h-6 w-40 rounded-md bg-panel animate-pulse" aria-hidden="true" />
          ) : current && summary ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-2 text-sm font-semibold border px-2.5 py-1 rounded-md ${current.tone}`}>
                <BusynessMeter level={summary.level} />
                {current.label[locale]}
              </span>
              <span className="text-xs text-ink-muted">{t.busynessDetail(summary.count, minutesAgo)}</span>
            </div>
          ) : (
            <p className="text-xs text-ink-muted">{t.busynessNoData}</p>
          )}
        </div>

        {!open ? (
          isSignedIn ? (
            <button
              type="button"
              onClick={start}
              className="shrink-0 px-3.5 py-2 bg-azure hover:bg-azure-deep text-white text-sm font-semibold rounded-md transition-colors"
            >
              {mine ? t.yourCheckin(busynessInfo(mine.level).label[locale]) : t.imHereButton}
            </button>
          ) : (
            <SignInButton mode="modal">
              <button
                type="button"
                className="shrink-0 px-3.5 py-2 bg-panel hover:bg-line text-ink text-sm font-semibold rounded-md border border-line"
                title={t.signInToCheckin}
              >
                {t.imHereButton}
              </button>
            </SignInButton>
          )
        ) : null}
      </div>

      {open && !picking ? (
        <div className="space-y-2 text-xs">
          {location.status === "error" ? (
            <p className="text-danger">{t[location.error]}</p>
          ) : proximity && location.status === "ready" ? (
            <>
              <p className="text-danger">
                {t.tooFarToCheckin(formatDistance(proximity.distanceKm, t), CHECKIN_RADIUS_METERS)}
              </p>
              {proximity.imprecise ? (
                <p className="text-ink-muted">{t.locationImprecise(t.meters(Math.round(location.accuracy)))}</p>
              ) : null}
            </>
          ) : (
            <p className="flex items-center gap-2 text-ink-muted" role="status">
              <Spinner />
              {t.checkingLocation}
            </p>
          )}
          {location.status === "error" || location.status === "ready" ? (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => locate({ fresh: true })}
                className="font-semibold text-link hover:text-ink"
              >
                {t.checkAgain}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="text-ink-muted hover:text-ink">
                {t.checkinCancel}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {picking ? (
        <div className="space-y-2">
          <p className="text-xs text-ink-muted">{t.howBusyPrompt}</p>
          <div
            className="grid grid-cols-2 sm:grid-cols-5 gap-2"
            role="radiogroup"
            aria-label={t.howBusyPrompt}
            aria-busy={saving}
          >
            {BUSYNESS_LEVELS.map((option) => {
              const sending = savingLevel === option.level;
              return (
                <button
                  key={option.level}
                  type="button"
                  role="radio"
                  aria-checked={sending || (!saving && mine?.level === option.level)}
                  disabled={saving}
                  onClick={() => submit(option.level)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-md border text-xs font-semibold transition-all enabled:hover:scale-[1.03] ${
                    option.tone
                  } ${sending ? "ring-2 ring-azure" : saving ? "opacity-40" : ""} ${
                    !saving && mine?.level === option.level ? "ring-2 ring-azure" : ""
                  }`}
                >
                  {sending ? <Spinner /> : <BusynessMeter level={option.level} />}
                  {option.label[locale]}
                </button>
              );
            })}
          </div>
          {saving ? (
            <p className="flex items-center gap-2 text-xs text-ink-muted" role="status">
              <Spinner />
              {t.sending}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-ink-muted hover:text-ink"
            >
              {t.checkinCancel}
            </button>
          )}
        </div>
      ) : null}

      <div className="border-t border-line pt-3">
        <PopularTimes spotId={spotId} />
      </div>
    </section>
  );
}

// Эргэлдэх дугуй — байршил шалгах, мэдээлэл илгээх үед. Өнгө нь эцэг элементийн бичвэрийн өнгө.
function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin"
    />
  );
}
