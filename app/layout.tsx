import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { enUS, mnMN } from "@clerk/localizations";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClerkSupabaseBridge from "@/components/ClerkSupabaseBridge";
import { LanguageProvider } from "@/components/LanguageProvider";
import { Toaster } from "sonner";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Сайтын slate/indigo өнгөтэй тааруулна.
const clerkAppearance = {
  variables: {
    colorPrimary: "#4f46e5",
    colorBackground: "#0f172a",
    colorForeground: "#f1f5f9",
    colorMutedForeground: "#94a3b8",
    colorInput: "#1e293b",
    colorInputForeground: "#ffffff",
    colorNeutral: "#ffffff",
    borderRadius: "0.75rem",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Хөтчийн өргөтгөлүүд body-д class нэмдэг (ж: vc-init) — зөвхөн body-гийн attribute зөрүүг үл тоомсорлоно. */}
      <body className="min-h-full flex flex-col bg-slate-900" suppressHydrationWarning>
        <ClerkProvider localization={locale === "en" ? enUS : mnMN} appearance={clerkAppearance}>
          <LanguageProvider initialLocale={locale}>
            <ClerkSupabaseBridge />
            {children}
            {/* shadcn/sonner маягийн мэдэгдэл: хэдэн секундын дараа өөрөө алга болно. */}
            <Toaster theme="dark" position="bottom-right" richColors closeButton />
          </LanguageProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
