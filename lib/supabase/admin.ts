import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Supabase → Project Settings → API Keys → Secret key (хуучин нэр: service_role). RLS-ийг алгасдаг тул зөвхөн сервер дээр.
const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin: SupabaseClient | null =
  url && secretKey
    ? createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
