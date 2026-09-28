// Утасны дугаар: "99112233", "+976 9911 2233", "9911-2233" гэх мэт (цифр эсвэл "+"-ээр эхэлнэ).
// supabase/migrations/20260928000001_event_phone.sql-ийн шалгалттай тохирно.
const PHONE = /^\+?[0-9][0-9 ()-]{5,19}$/;

// Зай, давхар зайг цэгцэлнэ; буруу бол null.
export function normalizePhone(value: string): string | null {
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!PHONE.test(cleaned)) return null;
  // Хэт цөөн цифртэй (зай, зураас л) дугаарыг хүлээн авахгүй.
  return cleaned.replace(/\D/g, "").length >= 6 ? cleaned : null;
}

// tel: холбоос — утсан дээр дарахад шууд залгана.
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
