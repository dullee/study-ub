const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const isCloudinaryConfigured = Boolean(cloudName && uploadPreset);

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Unsigned upload preset ашиглан хөтчөөс шууд Cloudinary руу илгээнэ.
export async function uploadImage(file: File): Promise<string> {
  if (!isCloudinaryConfigured) throw new Error("Cloudinary тохируулаагүй байна.");
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", uploadPreset as string);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? "Зураг хуулахад алдаа гарлаа.");
  // Хэмжээг багасгаж, хөтөчид тохирох формат (webp/avif) автоматаар өгнө.
  return (data.secure_url as string).replace("/upload/", "/upload/f_auto,q_auto,w_800/");
}
