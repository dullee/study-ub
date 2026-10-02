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

// Өгсөн id-уудаас өгөгдлийн санд одоо байгаа газруудынх нь. Устгагдсан газрыг хадгалбал FK алдаа гардаг.
export async function existingSpotIds(spotIds: number[]): Promise<number[] | null> {
  if (!supabaseAuthed) return null;
  if (spotIds.length === 0) return [];
  const { data, error } = await supabaseAuthed.from("spots").select("id").in("id", spotIds);
  if (error) {
    console.error("Supabase favorite spots:", error.message);
    return null;
  }
  return (data as { id: number }[]).map((row) => row.id);
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
    // 23503 (FK): газар устгагдсан — хүлээгдэж болох тохиолдол тул алдаа гэж мэдээлэхгүй.
    if (error.code === "23503") console.warn("Supabase add favorite: spot no longer exists");
    else console.error("Supabase add favorite:", error.message);
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
