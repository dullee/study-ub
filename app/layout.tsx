import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { enUS, mnMN } from "@clerk/localizations";
import { Onest } from "next/font/google";
import "./globals.css";
import ClerkSupabaseBridge from "@/components/ClerkSupabaseBridge";
import { LanguageProvider } from "@/components/LanguageProvider";
import { Toaster } from "sonner";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import SkyClock from "@/components/SkyClock";
import { SKY_INLINE_SCRIPT } from "@/lib/sky";

// Onest: кирилл үсгийг анхнаас нь зурсан нэг гэр бүл — гарчиг, товч, өгөгдөл бүгд үүгээр.
const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// High Blue Sky-ийн өнгөтэй (app/globals.css) тааруулна.
const clerkAppearance = {
  variables: {
    colorPrimary: "#1f7ae0",
    colorBackground: "#102038",
    colorForeground: "#eef3f9",
    colorMutedForeground: "#a9b9cd",
    colorInput: "#0a1626",
    colorInputForeground: "#eef3f9",
    colorNeutral: "#eef3f9",
    borderRadius: "0.375rem",
    fontFamily: "var(--font-onest)",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "StudySpots UB",
    description: dictionaries[await getLocale()].metaDescription,
  };
}

// Хэл cookie-оос уншигдана — хуудас, Clerk-ийн нэвтрэх цонх эхнээсээ сонгосон хэлээр гарна.
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${onest.variable} h-full antialiased`}
      // Тэнгэрийн inline script data-sky, --sun-x-ийг hydration-оос өмнө тавина.
      suppressHydrationWarning
    >
      <head>
        {/* Эхний зурахаас өмнө: Улаанбаатарын цагаар тэнгэрийн өнгө (шөнө цэнхэр анивчихгүй). */}
        <script dangerouslySetInnerHTML={{ __html: SKY_INLINE_SCRIPT }} />
      </head>
      {/* Хөтчийн өргөтгөлүүд body-д class нэмдэг (ж: vc-init) — зөвхөн body-гийн attribute зөрүүг үл тоомсорлоно. */}
      <body className="min-h-full flex flex-col bg-ground text-ink" suppressHydrationWarning>
        <ClerkProvider localization={locale === "en" ? enUS : mnMN} appearance={clerkAppearance}>
          <LanguageProvider initialLocale={locale}>
            <ClerkSupabaseBridge />
            <SkyClock />
            {children}
            {/* shadcn/sonner маягийн мэдэгдэл: хэдэн секундын дараа өөрөө алга болно. */}
            <Toaster
              theme="dark"
              position="bottom-right"
              closeButton
              toastOptions={{ style: { fontFamily: "var(--font-onest)", borderRadius: 6, boxShadow: "var(--shadow-lift)" } }}
            />
          </LanguageProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
