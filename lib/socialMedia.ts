// Сошиал сүлжээний холбоосоос (YouTube, TikTok, Instagram, Facebook, X, Vimeo) албан ёсны embed хаягийг гаргана.
// Өгөгдлийн санд эх холбоосыг хадгална; embed хаягийг зөвхөн таньсан ID-гаар угсарна — дурын хаягийг iframe-д хийхгүй.

export type SocialPlatform = "youtube" | "tiktok" | "instagram" | "facebook" | "x" | "vimeo";

export interface SocialEmbed {
  platform: SocialPlatform;
  // Хадгалах цэвэр эх холбоос.
  url: string;
  embedUrl: string;
  // Босоо (TikTok, reel) эсвэл хэвтээ (YouTube) — харагчийн хэмжээнд.
  shape: "landscape" | "portrait" | "post";
  thumbnail?: string;
}

export const PLATFORM_INFO: Record<SocialPlatform, { name: string; icon: string; tile: string }> = {
  youtube: { name: "YouTube", icon: "▶", tile: "bg-red-600" },
  tiktok: { name: "TikTok", icon: "♪", tile: "bg-slate-950" },
  instagram: { name: "Instagram", icon: "📸", tile: "bg-gradient-to-br from-fuchsia-600 via-rose-500 to-amber-400" },
  facebook: { name: "Facebook", icon: "f", tile: "bg-blue-700" },
  x: { name: "X", icon: "𝕏", tile: "bg-black" },
  vimeo: { name: "Vimeo", icon: "▶", tile: "bg-sky-500" },
};

// Утсаар хуваалцахад гардаг богино холбоос — /api/media/resolve сервер дээр жинхэнэ хаяг руу нь дагана.
// Instagram апп-ын "Share → Copy link": instagram.com/share/reel/…, /share/p/…, /share/….
export const SHORT_LINK_HOSTS = ["vm.tiktok.com", "vt.tiktok.com", "fb.watch"];

export function isShortSocialLink(value: string) {
  try {
    const url = new URL(value.trim());
    const h = url.hostname.toLowerCase();
    if (SHORT_LINK_HOSTS.includes(h)) return true;
    // Instagram, Facebook апп-ын "Share → Copy link": /share/reel/…, /share/r/…, /share/v/…, /share/p/… гэх мэт.
    return /^((www|m|web)\.)?(instagram|facebook)\.com$/.test(h) && url.pathname.startsWith("/share/");
  } catch {
    return false;
  }
}

// Instagram story 24 цагийн дараа устдаг, embed хийх боломжгүй — тусгай мессежээр тайлбарлана.
export function isInstagramStory(value: string) {
  try {
    const url = new URL(value.trim());
    return /(^|\.)instagram\.com$/i.test(url.hostname) && url.pathname.startsWith("/stories/");
  } catch {
    return false;
  }
}

const host = (url: URL) => url.hostname.toLowerCase().replace(/^(www|m|mobile)\./, "");

export function parseSocialLink(value: string): SocialEmbed | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const h = host(url);
  const path = url.pathname;

  // YouTube: watch?v=, youtu.be/, /shorts/, /embed/, /live/
  if (h === "youtube.com" || h === "youtu.be" || h === "music.youtube.com") {
    const id =
      h === "youtu.be"
        ? path.slice(1).split("/")[0]
        : url.searchParams.get("v") ?? /^\/(?:shorts|embed|live)\/([^/?#]+)/.exec(path)?.[1];
    if (!id || !/^[\w-]{11}$/.test(id)) return null;
    const shorts = path.startsWith("/shorts/");
    return {
      platform: "youtube",
      url: shorts ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`,
      embedUrl: `https://www.youtube.com/embed/${id}`,
      shape: shorts ? "portrait" : "landscape",
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  // TikTok: /@user/video/123…
  if (h === "tiktok.com") {
    const id = /\/video\/(\d{8,25})/.exec(path)?.[1];
    if (!id) return null;
    return {
      platform: "tiktok",
      url: `https://www.tiktok.com${path.split("?")[0]}`,
      embedUrl: `https://www.tiktok.com/embed/v2/${id}`,
      shape: "portrait",
    };
  }

  // Instagram: /p/…, /reel/…, /tv/… — профайлаас нээхэд /хэрэглэгч/reel/… хэлбэртэй ч байдаг.
  // /share/… нь redirect (богино холбоос), /reels/audio/… нь дууны хуудас — пост биш.
  if (h === "instagram.com" || h === "instagr.am") {
    if (path.startsWith("/share/")) return null;
    const match = /^\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]{5,})/.exec(path);
    if (!match || match[2] === "audio") return null;
    const kind = match[1] === "reels" ? "reel" : match[1];
    return {
      platform: "instagram",
      url: `https://www.instagram.com/${kind}/${match[2]}/`,
      embedUrl: `https://www.instagram.com/${kind}/${match[2]}/embed/`,
      shape: kind === "p" ? "post" : "portrait",
    };
  }

  // Facebook: бичлэг (videos, watch, reel) эсвэл пост. /share/… нь redirect — embed ажиллахгүй тул
  // эхлээд /api/media/resolve-оор жинхэнэ хаяг руу нь дагана (isShortSocialLink).
  if (h === "facebook.com" || h === "fb.com") {
    if (path.startsWith("/share/")) return null;
    const isVideo = /\/videos\/|\/watch|\/reel\//.test(path) || url.searchParams.has("v");
    const isPost = /\/posts\/|\/permalink\.php|\/photo|\/story\.php/.test(path) || url.searchParams.has("story_fbid");
    if (!isVideo && !isPost) return null;
    // Апп-ын mibextid гэх мэт мөрдөх параметрийг хасна — зөвхөн постыг тодорхойлдог нь үлдэнэ.
    const keep = new URLSearchParams();
    for (const key of ["v", "story_fbid", "id", "fbid", "set"]) {
      const value = url.searchParams.get(key);
      if (value) keep.set(key, value);
    }
    const query = keep.toString();
    const clean = `https://www.facebook.com${path}${query ? `?${query}` : ""}`;
    const href = encodeURIComponent(clean);
    const isReel = path.includes("/reel/");
    return {
      platform: "facebook",
      url: clean,
      embedUrl: isVideo
        ? `https://www.facebook.com/plugins/video.php?href=${href}&show_text=false`
        : `https://www.facebook.com/plugins/post.php?href=${href}&show_text=true`,
      shape: isReel ? "portrait" : isVideo ? "landscape" : "post",
    };
  }

  // X / Twitter: /user/status/123…
  if (h === "x.com" || h === "twitter.com") {
    const id = /\/status(?:es)?\/(\d{5,25})/.exec(path)?.[1];
    if (!id) return null;
    return {
      platform: "x",
      url: `https://x.com${path.split("?")[0]}`,
      embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${id}&theme=dark&dnt=true`,
      shape: "post",
    };
  }

  // Vimeo: vimeo.com/123…
  if (h === "vimeo.com" || h === "player.vimeo.com") {
    const id = /\/(?:video\/)?(\d{5,12})/.exec(path)?.[1];
    if (!id) return null;
    return {
      platform: "vimeo",
      url: `https://vimeo.com/${id}`,
      embedUrl: `https://player.vimeo.com/video/${id}`,
      shape: "landscape",
    };
  }

  return null;
}

// Redirect-гүй хариу (нэвтрэх хана, JS redirect) — хуудасны og:url эсвэл canonical-аас жинхэнэ холбоосыг олно.
export function extractCanonicalUrl(html: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:url["']/i,
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i,
  ];
  for (const pattern of patterns) {
    const found = pattern.exec(html)?.[1];
    if (found) return found.replace(/&amp;/g, "&");
  }
  return null;
}
