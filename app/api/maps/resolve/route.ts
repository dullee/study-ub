import { NextRequest, NextResponse } from "next/server";
import { isShortMapsLink, parseMapsLink } from "@/lib/maps";

const MAX_REDIRECTS = 5;

// Дамжуулалт зөвхөн Google-ийн хаягууд руу — дурын сайт руу хүсэлт илгээх прокси болохгүй.
function isGoogleHost(hostname: string) {
  return (
    hostname === "maps.app.goo.gl" ||
    hostname === "goo.gl" ||
    hostname === "google.com" ||
    hostname.endsWith(".google.com")
  );
}

// maps.app.goo.gl богино холбоос хөтчөөс CORS-оор хаагддаг тул сервер дээр redirect-ийг дагаж координат авна.
export async function GET(request: NextRequest) {
  const link = request.nextUrl.searchParams.get("url") ?? "";
  if (!isShortMapsLink(link)) {
    return NextResponse.json({ error: "not-a-short-link" }, { status: 400 });
  }

  let current = new URL(link.trim());
  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    const found = parseMapsLink(current.href);
    if (found) return NextResponse.json(found);

    let res: Response;
    try {
      res = await fetch(current, { redirect: "manual", signal: AbortSignal.timeout(5000) });
    } catch {
      return NextResponse.json({ error: "fetch-failed" }, { status: 502 });
    }
    const location = res.headers.get("location");
    if (!location) break;
    const next = new URL(location, current);
    if (next.protocol !== "https:" || !isGoogleHost(next.hostname)) break;
    current = next;
  }

  const found = parseMapsLink(current.href);
  if (found) return NextResponse.json(found);
  return NextResponse.json({ error: "no-coordinates" }, { status: 422 });
}
