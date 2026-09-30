import { supabaseAuthed } from "@/lib/supabase/client";

// Хадгалсан газрууд (RLS: зөвхөн өөрийнх). user_id-г өгөгдлийн сан token-оос бөглөнө.

export async function fetchFavorites(): Promise<number[] | null> {
  if (!supabaseAuthed) return null;
  const { data, error } = await supabaseAuthed.from("spot_favorites").select("spot_id");
  if (error) {
    console.error("Supabase favorites:", error.message);
    return null;
  }
  return (data as { spot_id: number }[]).map((row) => row.spot_id);
}

// Давхар нэмбэл алдаа биш (upsert) — нэвтрэхэд хөтчийн жагсаалтыг нэгтгэхэд ч ашиглана.
export async function addFavorites(userId: string, spotIds: number[]): Promise<boolean> {
  if (!supabaseAuthed || spotIds.length === 0) return Boolean(supabaseAuthed);
  const { error } = await supabaseAuthed
    .from("spot_favorites")
    .upsert(
      spotIds.map((spot_id) => ({ user_id: userId, spot_id })),
      { onConflict: "user_id,spot_id", ignoreDuplicates: true }
    );
  if (error) {
    console.error("Supabase add favorite:", error.message);
    return false;
  }
  return true;
}

export async function removeFavorite(spotId: number): Promise<boolean> {
  if (!supabaseAuthed) return false;
  const { error } = await supabaseAuthed.from("spot_favorites").delete().eq("spot_id", spotId);
  if (error) {
    console.error("Supabase remove favorite:", error.message);
    return false;
  }
  return true;
}
