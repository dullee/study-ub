import { NextRequest, NextResponse } from "next/server";
import {
  extractCanonicalUrl,
  findFacebookVideoUrl,
  isFacebookPostPermalink,
  isShortSocialLink,
  parseSocialLink,
} from "@/lib/socialMedia";

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
// Facebook-ийн story.php (пост) дээр ирвэл хуудаснаас reel/видеоны хаягийг хайж, олдвол түүнийг илүүд үзнэ.
// url — олдсон жинхэнэ холбоос; unreachable — платформ руу холбогдож чадсангүй (дахин оролдох утгагүй).
type FollowResult = { url: string | null; unreachable?: boolean };

const isPostOnly = (href: string) => {
  const parsed = parseSocialLink(href);
  return parsed?.platform === "facebook" && parsed.shape === "post";
};

async function follow(link: string, userAgent: string): Promise<FollowResult> {
  let current = new URL(link.trim());
  // Бичлэг олдохгүй бол буцаах пост хаяг.
  let postFallback: string | null = null;
  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    if (parseSocialLink(current.href)) {
      if (!isPostOnly(current.href)) return { url: current.href };
      postFallback ??= current.href;
    }
    let res: Response;
    try {
      res = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(4000),
        headers: { "user-agent": userAgent, "accept-language": "en-US,en;q=0.9", accept: "text/html" },
      });
    } catch {
      return { url: postFallback, unreachable: hop === 0 && !postFallback };
    }
    const location = res.headers.get("location");
    if (!location) {
      if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return { url: postFallback };
      const html = (await res.text()).slice(0, MAX_HTML);
      const video = findFacebookVideoUrl(html);
      if (video) return { url: video };
      const canonical = extractCanonicalUrl(html);
      if (!canonical) return { url: postFallback };
      try {
        const found = new URL(canonical, current);
        const ok = found.protocol === "https:" && isAllowedHost(found.hostname) && parseSocialLink(found.href);
        return { url: ok ? found.href : postFallback };
      } catch {
        return { url: postFallback };
      }
    }
    // Redirect хаяг өөрөө reel/видеоны ID агуулж болно.
    const hinted = findFacebookVideoUrl(location);
    if (hinted) return { url: hinted };
    let next = new URL(location, current);
    // Нэвтрэх хуудас руу шилжүүлбэл жинхэнэ хаяг нь ?next= параметрт байна.
    const target = next.searchParams.get("next");
    if (/\/login/.test(next.pathname) && target) {
      try {
        next = new URL(target, next);
      } catch {
        return { url: postFallback };
      }
    }
    if (next.protocol !== "https:" || !isAllowedHost(next.hostname)) return { url: postFallback };
    current = next;
  }
  return { url: parseSocialLink(current.href) ? current.href : postFallback };
}

export async function GET(request: NextRequest) {
  const link = request.nextUrl.searchParams.get("url") ?? "";
  // Богино share холбоос эсвэл Facebook-ийн пост хаяг (story.php — reel бол бичлэгийг нь олно).
  if (!isShortSocialLink(link) && !isFacebookPostPermalink(link)) {
    return NextResponse.json({ error: "not-a-short-link" }, { status: 400 });
  }
  const first = await follow(link, BROWSER_UA);
  // Бичлэг олдсон бол шууд; зөвхөн пост олдсон эсвэл юу ч олдоогүй бол bot-оор дахин (холбогдож чадсан бол).
  let url = first.url && !isPostOnly(first.url) ? first.url : null;
  if (!url && !first.unreachable) url = (await follow(link, PREVIEW_BOT_UA)).url;
  url ??= first.url;
  if (url) return NextResponse.json({ url });
  return NextResponse.json({ error: "unresolved" }, { status: 422 });
}
