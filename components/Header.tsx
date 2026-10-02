"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useHeightVar } from "@/lib/useHeightVar";
import { useI18n } from "@/components/LanguageProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Dropdown from "@/components/Dropdown";
import MySubmissionsDialog from "@/components/MySubmissionsDialog";
import { useMySubmissions } from "@/lib/useMySubmissions";
import { CalendarDays, Hourglass, MapPin, SquareParking, Plus, Wrench } from "lucide-react";
import Manul from "@/components/Manul";

// Тэнгэрийн туузан дээрх товчнууд: цагаан хүрээтэй (хоёрдогч) ба цагаан хуудас (үндсэн үйлдэл).
const onSkyBase = "flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-semibold border transition-colors";
const onSky = `${onSkyBase} border-white/35 text-white hover:bg-white/15`;
// Идэвхтэй (одоогийн хуудас): цагаан хуудас, хөх бичвэр.
const onSkyActive = `${onSkyBase} border-white bg-white text-azure-deep`;
const primaryOnSky =
  "items-center justify-center gap-1.5 h-9 rounded-md text-xs font-semibold bg-white text-azure-deep hover:bg-white/90 shadow-sheet transition-colors";
const countPill = "min-w-5 rounded-full bg-sun text-night px-1.5 text-[10px] font-bold leading-5 text-center tabular-nums";

interface HeaderProps {
  onAddClick: () => void;
  addLabel?: string;
  // Доор нь шүүлтүүрийн тууз залгагдвал (нүүр хуудас) бүрийн ирмэгийг тэр туузан дээр л зурна.
  joined?: boolean;
}

const TABS = [
  { href: "/", label: "navPlaces", icon: MapPin },
  { href: "/events", label: "navEvents", icon: CalendarDays },
] as const;

export default function Header({ onAddClick, addLabel, joined = false }: HeaderProps) {
  const { t } = useI18n();
  const addText = addLabel ?? t.addPlace;
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  // Эвентийн хуудсанд "Миний илгээсэн" нь эвентүүдийг, бусад хуудсанд газруудыг харуулна.
  const onEvents = pathname === "/events";
  const { spots, events, count, pendingCount } = useMySubmissions(onEvents ? "events" : "spots");
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const closeSubmissions = useCallback(() => setSubmissionsOpen(false), []);
  const hasSubmissions = count > 0;
  // Тоо нь цонхонд жагсаагдах бүгдийг (хүлээгдэж буй + зөвшөөрөгдөөгүй) тоолно; тайлбар нь хүлээгдэж буйг хэлнэ.
  const pendingText =
    pendingCount === 0
      ? t.mySubmissions
      : onEvents
        ? t.myEventSubmissionsPending(pendingCount)
        : t.mySubmissionsPending(pendingCount);

  // Header-ийн өндрийг --header-h болгон нийтэлнэ — том дэлгэцэнд шүүлтүүр, газрын зураг түүний доор наалдана.
  // Утсан дээр header наалдахгүй — дэлгэцийн зайг хэмнэж, зөвхөн шүүлтүүрийн мөр наалдана.
  useHeightVar(headerRef, "--header-h");

  return (
    <header
      ref={headerRef}
      className={`sky-band ${joined ? "sky-band--joined" : ""} text-white relative lg:sticky lg:top-0 z-[1000]`}
    >
      <div className="max-w-7xl mx-auto px-4 pt-3 pb-2 sm:pt-4 flex justify-between items-center gap-2 sm:gap-3">
        <div className="min-w-0 overflow-hidden">
          <h1 className="text-[15px] sm:text-[22px] font-bold tracking-[-0.02em] leading-none whitespace-nowrap">
            <Link href="/" className="inline-flex items-center gap-1 sm:gap-1.5 hover:opacity-90 transition-opacity">
              <Manul className="h-5 w-6 sm:h-7 sm:w-8 -my-1" />
              {/* Маш нарийн утсанд (<380px) зөвхөн манул — товчнуудтай давхцахгүй. */}
              <span className="max-[379px]:sr-only">StudySpots</span>
              <span className="hidden sm:inline font-medium text-white/75">UB</span>
            </Link>
          </h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Танилцуулгад: нэвтрэлтгүй админы самбар, жишээ өгөгдөлтэй (app/admin/demo). */}
          <Link
            href="/admin/demo"
            aria-label={t.adminDemo}
            title={t.adminDemo}
            className={`${onSky} w-9 sm:w-auto sm:px-3`}
          >
            <Wrench aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">{t.adminDemo}</span>
          </Link>
          <Link
            href="/parking"
            aria-label={t.findParking}
            title={t.findParking}
            aria-current={pathname === "/parking" ? "page" : undefined}
            className={`${pathname === "/parking" ? onSkyActive : onSky} w-9 sm:w-auto sm:px-3`}
          >
            <SquareParking aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">{t.findParking}</span>
          </Link>
          {/* Утсан дээр илгээсэн газар (эвентийн хуудсанд эвент) байвал ➕ нь "нэмэх / миний илгээсэн" цэс; эс бөгөөс шууд нэмнэ. */}
          <div className={hasSubmissions ? "sm:hidden" : "hidden"}>
            <Dropdown
              align="right"
              hideCaret
              ariaLabel={`${addText} · ${t.mySubmissions}`}
              buttonClassName={`relative flex w-9 ${primaryOnSky}`}
              label={
                <>
                  <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
                  <span className={`absolute -top-1.5 -right-1.5 ${countPill}`}>{count}</span>
                </>
              }
            >
              {(close) => (
                <div className="grid gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      onAddClick();
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-md bg-azure hover:bg-azure-deep text-white text-sm font-semibold"
                  >
                    <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} /> {addText}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      setSubmissionsOpen(true);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-md border border-line bg-sheet hover:bg-panel text-ink text-sm font-semibold"
                  >
                    <Hourglass aria-hidden="true" className="h-4 w-4 text-sun-deep" strokeWidth={2} /> {t.mySubmissions}
                    <span className={`ml-auto ${countPill}`}>{count}</span>
                  </button>
                </div>
              )}
            </Dropdown>
          </div>
          <button
            onClick={onAddClick}
            aria-label={addText}
            title={addText}
            className={`${hasSubmissions ? "hidden sm:flex" : "flex"} w-9 sm:w-auto sm:px-3.5 ${primaryOnSky}`}
          >
            <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
            <span className="hidden sm:inline">{addText}</span>
          </button>
          {hasSubmissions ? (
            <button
              type="button"
              onClick={() => setSubmissionsOpen(true)}
              title={pendingText}
              aria-label={pendingCount === 0 ? `${t.mySubmissions}: ${count}` : `${t.mySubmissions}: ${pendingText}`}
              className={`hidden sm:inline-flex px-3 whitespace-nowrap ${onSky}`}
            >
              <Hourglass aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
              <span className="hidden md:inline">{t.mySubmissions}</span>
              <span className={countPill}>{count}</span>
            </button>
          ) : null}
          <LanguageSwitcher />
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className={`px-3 ${onSky}`}>
                {t.signIn}
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="hidden sm:block h-9 px-3 rounded-md text-xs font-semibold text-white hover:bg-white/15 transition-colors">
                {t.signUp}
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
      <nav className="max-w-7xl mx-auto px-4 flex gap-1 -mb-px">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold border-b-[3px] transition-colors ${
                active ? "border-white text-white" : "border-transparent text-white/85 hover:text-white"
              }`}
            >
              <tab.icon aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
              {t[tab.label]}
            </Link>
          );
        })}
      </nav>
      {/* Цонхыг body-д зурна: header-ийн stacking context дотор хоригдохгүй. */}
      {submissionsOpen && hasSubmissions
        ? createPortal(
            onEvents ? (
              <MySubmissionsDialog events={events} onClose={closeSubmissions} />
            ) : (
              <MySubmissionsDialog spots={spots} onClose={closeSubmissions} />
            ),
            document.body
          )
        : null}
    </header>
  );
}
