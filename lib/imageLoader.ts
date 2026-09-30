// next/image-ийн өөрийн loader: Vercel-ийн зураг боловсруулагчийг (сард хязгаартай, илүүг нь төлбөртэй,
// дурын сайтын зургийг proxy хийх боломж өгдөг) биш, зураг хадгалагч талаас нь хэмжээг авна.
//   • Cloudinary (манай хуулсан зургууд): URL-д f_auto,q_auto,c_limit,w_<өргөн> — хуучин хувиргалтыг солино.
//   • Unsplash: ?w=<өргөн>&q=<чанар>&auto=format.
// Бусад хаяг (хэрэглэгчийн оруулсан холбоос, blob: урьдчилан харах) хэмжээ өөрчлөх боломжгүй — unoptimized.

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/;
// Cloudinary хувиргалтын хэсэг: "w_800", "f_auto,q_auto,w_800" гэх мэт (хувилбар "v123"-ээс өмнө).
const TRANSFORMATION = /^[a-z]{1,3}_[^/]*$/;

export function canResize(src: string) {
  return CLOUDINARY_UPLOAD.test(src) || isUnsplash(src);
}

function isUnsplash(src: string) {
  try {
    return new URL(src).hostname === "images.unsplash.com";
  } catch {
    return false;
  }
}

export function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  const cloudinary = CLOUDINARY_UPLOAD.exec(src);
  if (cloudinary) {
    const segments = cloudinary[2].split("/");
    while (segments.length > 1 && TRANSFORMATION.test(segments[0])) segments.shift();
    // c_limit: жижиг эх зургийг томруулахгүй.
    return `${cloudinary[1]}f_auto,q_${quality ?? "auto"},c_limit,w_${width}/${segments.join("/")}`;
  }
  if (isUnsplash(src)) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 75));
    url.searchParams.set("auto", "format");
    return url.toString();
  }
  return src;
}
