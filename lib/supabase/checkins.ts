import { supabase, supabaseAuthed } from "@/lib/supabase/client";
import { BusynessLevel, CHECKIN_WINDOW_MINUTES, SpotCheckin } from "@/lib/busyness";

// spotId өгөөгүй бол бүх газрын сүүлийн 90 минутын тэмдэглэл (нүүр хуудасны карт, газрын зурагт).
export async function fetchRecentCheckins(spotId?: number): Promise<SpotCheckin[] | null> {
  if (!supabase) return null;
  const since = new Date(Date.now() - CHECKIN_WINDOW_MINUTES * 60_000).toISOString();
  let query = supabase.from("spot_checkins").select("*").gte("created_at", since);
  if (spotId !== undefined) query = query.eq("spot_id", spotId);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    console.error("Supabase checkins:", error.message);
    return null;
  }
  return data as SpotCheckin[];
}

// 30 минутад нэг л шинэ тэмдэглэл (өгөгдлийн сангийн trigger) — давхар бол "too_soon".
export async function insertCheckin(
  spotId: number,
  userId: string,
  level: BusynessLevel
): Promise<SpotCheckin | "too_soon" | null> {
  if (!supabaseAuthed) return null;
  const { data, error } = await supabaseAuthed
    .from("spot_checkins")
    .insert({ spot_id: spotId, user_id: userId, level })
    .select("*")
    .single();
  if (error) {
    console.error("Supabase insert checkin:", error.message);
    return error.message.includes("checkin_too_soon") ? "too_soon" : null;
  }
  return data as SpotCheckin;
}

export async function updateCheckinLevel(id: number, level: BusynessLevel): Promise<SpotCheckin | null> {
  if (!supabaseAuthed) return null;
  const { data, error } = await supabaseAuthed
    .from("spot_checkins")
    .update({ level })
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    console.error("Supabase update checkin:", error.message);
    return null;
  }
  return data as SpotCheckin;
}

export type CheckinChange = { type: "upsert"; checkin: SpotCheckin } | { type: "delete"; id: number };

// Шинэ, засагдсан, устсан тэмдэглэлийг шууд хүлээн авна (Supabase Realtime).
// spotId өгвөл зөвхөн тэр газрынх. Буцаах функц нь холболтыг хаана.
export function subscribeCheckins(onChange: (change: CheckinChange) => void, spotId?: number) {
  const client = supabase;
  if (!client) return () => {};
  const channel = client
    .channel(spotId === undefined ? "spot_checkins:all" : `spot_checkins:${spotId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "spot_checkins",
        ...(spotId === undefined ? {} : { filter: `spot_id=eq.${spotId}` }),
      },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as Partial<SpotCheckin>).id;
          if (id !== undefined) onChange({ type: "delete", id });
        } else {
          onChange({ type: "upsert", checkin: payload.new as SpotCheckin });
        }
      }
    )
    .subscribe();
  return () => {
    client.removeChannel(channel);
  };
}

// Жагсаалтад өөрчлөлтийг хэрэглэнэ: шинэ/засагдсаныг эхэнд, давхардалгүй.
export function applyCheckinChange(list: SpotCheckin[], change: CheckinChange): SpotCheckin[] {
  if (change.type === "delete") return list.filter((item) => item.id !== change.id);
  return [change.checkin, ...list.filter((item) => item.id !== change.checkin.id)];
}
