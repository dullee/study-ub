import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Шинэ Supabase төсөл "publishable key", хуучин нь "anon key" гэж нэрлэдэг — аль нь ч ажиллана.
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Унших болон админы үйлдлүүд — нэвтрэлт шаардахгүй.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null;

type TokenGetter = () => Promise<string | null>;
let getClerkToken: TokenGetter = async () => null;

// ClerkSupabaseBridge нэвтэрсэн хэрэглэгчийн session token-ийг энд өгнө.
export function setSupabaseTokenGetter(getter: TokenGetter) {
  getClerkToken = getter;
}

// Эзэмшигчтэй мөр (сэтгэгдэл, эвент, бүртгэл) бичихэд Clerk token илгээж, RLS-ээр user_id-г шалгуулна.
export const supabaseAuthed: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, { accessToken: () => getClerkToken() })
  : null;
