import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, dictionaries, isLocale, Locale, LOCALE_COOKIE } from "@/lib/i18n/dictionaries";

// Сервер дээр сонгосон хэлийг cookie-оос уншина — хуудас эхнээсээ зөв хэлээр гарна.
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getDictionary() {
  return dictionaries[await getLocale()];
}
