import { SpotMedia } from "@/types";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const isCloudinaryConfigured = Boolean(cloudName && uploadPreset);

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

async function upload(file: File, resource: "image" | "video"): Promise<string> {
  if (!isCloudinaryConfigured) throw new Error("Cloudinary тохируулаагүй байна.");
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", uploadPreset as string);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resource}/upload`, {
    method: "POST",
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? "Зураг хуулахад алдаа гарлаа.");
  return data.secure_url as string;
}

// Unsigned upload preset ашиглан хөтчөөс шууд Cloudinary руу илгээнэ.
// Хэмжээг багасгаж, хөтөчид тохирох формат (webp/avif) автоматаар өгнө.
export async function uploadImage(file: File): Promise<string> {
  return (await upload(file, "image")).replace("/upload/", "/upload/f_auto,q_auto,w_800/");
}

// Зураг эсвэл бичлэг. Бичлэгийг хөтөчид тохирох формат, чанараар (f_auto,q_auto) өгнө.
// Upload preset бичлэг хүлээн авахаар тохируулагдсан байх ёстой (Cloudinary → Upload presets).
export async function uploadMedia(file: File): Promise<SpotMedia> {
  if (file.type.startsWith("video/")) {
    const url = await upload(file, "video");
    return { type: "video", url: url.replace("/upload/", "/upload/f_auto,q_auto/") };
  }
  const url = await upload(file, "image");
  return { type: "image", url: url.replace("/upload/", "/upload/f_auto,q_auto,w_1600/") };
}

// Cloudinary бичлэгийн эхний кадрыг зураг болгон (цомгийн жижиг зураг).
export function videoPoster(url: string): string | undefined {
  if (!url.includes("res.cloudinary.com") || !url.includes("/video/upload/")) return undefined;
  return url.replace("/video/upload/", "/video/upload/so_0,w_400/").replace(/\.[a-z0-9]+(\?.*)?$/i, ".jpg");
}
