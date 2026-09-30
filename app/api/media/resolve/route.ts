import { NextRequest, NextResponse } from "next/server";
import { extractCanonicalUrl, isShortSocialLink, parseSocialLink } from "@/lib/socialMedia";

const MAX_REDIRECTS = 5;

// Дамжуулалт зөвхөн TikTok, Facebook, Instagram-ийн хаягууд руу — дурын сайт руу хүсэлт илгээх прокси болохгүй.
function isAllowedHost(hostname: string) {
  const h = hostname.toLowerCase();
  return ["tiktok.com", "facebook.com", "fb.watch", "instagram.com"].some((base) => h === base || h.endsWith(`.${base}`));
}

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
// Facebook, Instagram өөрсдийн preview bot-д нэвтрэх хана үзүүлэлгүй og:url-тай хуудас өгдөг.
const PREVIEW_BOT_UA = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";
const MAX_HTML = 400_000;

// Redirect-уудыг дагана; redirect алга бол хуудасны og:url / canonical-аас хайна.
// url — олдсон жинхэнэ холбоос; unreachable — платформ руу холбогдож чадсангүй (дахин оролдох утгагүй).
type FollowResult = { url: string | null; unreachable?: boolean };

async function follow(link: string, userAgent: string): Promise<FollowResult> {
  let current = new URL(link.trim());
  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    if (parseSocialLink(current.href)) return { url: current.href };
    let res: Response;
    try {
      res = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(4000),
        headers: { "user-agent": userAgent, "accept-language": "en-US,en;q=0.9", accept: "text/html" },
      });
    } catch {
      return { url: null, unreachable: hop === 0 };
    }
    const location = res.headers.get("location");
    if (!location) {
      if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return { url: null };
      const html = (await res.text()).slice(0, MAX_HTML);
      const canonical = extractCanonicalUrl(html);
      if (!canonical) return { url: null };
      try {
        const found = new URL(canonical, current);
        const ok = found.protocol === "https:" && isAllowedHost(found.hostname) && parseSocialLink(found.href);
        return { url: ok ? found.href : null };
      } catch {
        return { url: null };
      }
    }
    let next = new URL(location, current);
    // Нэвтрэх хуудас руу шилжүүлбэл жинхэнэ хаяг нь ?next= параметрт байна.
    const target = next.searchParams.get("next");
    if (/\/login/.test(next.pathname) && target) {
      try {
        next = new URL(target, next);
      } catch {
        return { url: null };
      }
    }
    if (next.protocol !== "https:" || !isAllowedHost(next.hostname)) return { url: null };
    current = next;
  }
  return { url: parseSocialLink(current.href) ? current.href : null };
}

// vt.tiktok.com, fb.watch, facebook.com/share/…, instagram.com/share/… богино холбоос хөтчөөс CORS-оор хаагддаг тул
// сервер дээр жинхэнэ холбоосыг олно: эхлээд хөтөч мэт, бүтэхгүй бол preview bot мэт.
export async function GET(request: NextRequest) {
  const link = request.nextUrl.searchParams.get("url") ?? "";
  if (!isShortSocialLink(link)) {
    return NextResponse.json({ error: "not-a-short-link" }, { status: 400 });
  }
  const first = await follow(link, BROWSER_UA);
  // Холбогдож чадаагүй бол bot-оор дахин оролдох утгагүй — хэрэглэгчийг хүлээлгэхгүй.
  const url = first.url ?? (first.unreachable ? null : (await follow(link, PREVIEW_BOT_UA)).url);
  if (url) return NextResponse.json({ url });
  return NextResponse.json({ error: "unresolved" }, { status: 422 });
}
