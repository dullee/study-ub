import { supabaseAuthed } from "@/lib/supabase/client";
import { SpotReport } from "@/lib/reports";

// Хэрэглэгч: мэдэгдэл илгээх. Нэг газарт нэг л нээлттэй мэдэгдэл (trigger) — давхар бол "already_reported".
export async function insertReport(
  report: Pick<SpotReport, "spot_id" | "user_id" | "author_name" | "topics" | "message">
): Promise<SpotReport | "already_reported" | null> {
  if (!supabaseAuthed) return null;
  const { data, error } = await supabaseAuthed.from("spot_reports").insert(report).select("*").single();
  if (error) {
    console.error("Supabase insert report:", error.message);
    return error.message.includes("already_reported") ? "already_reported" : null;
  }
  return data as SpotReport;
}

// Доорх функцууд админд (RLS: is_admin()).
export async function fetchReports(): Promise<SpotReport[] | null> {
  if (!supabaseAuthed) return null;
  const { data, error } = await supabaseAuthed
    .from("spot_reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Supabase reports:", error.message);
    return null;
  }
  return data as SpotReport[];
}

export async function setReportStatus(id: number, status: SpotReport["status"]): Promise<SpotReport | null> {
  if (!supabaseAuthed) return null;
  const { data, error } = await supabaseAuthed
    .from("spot_reports")
    .update({ status, resolved_at: status === "resolved" ? new Date().toISOString() : null })
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    console.error("Supabase update report:", error.message);
    return null;
  }
  return data as SpotReport;
}

export async function deleteReport(id: number): Promise<boolean> {
  if (!supabaseAuthed) return false;
  // RLS хаасан устгал алдаагүй 0 мөр буцаадаг — устсан мөрийг буцааж авч шалгана.
  const { data, error } = await supabaseAuthed.from("spot_reports").delete().eq("id", id).select("id");
  if (error || !data?.length) {
    console.error("Supabase delete report:", error?.message ?? "no rows deleted");
    return false;
  }
  return true;
}

// Админы самбарт шинэ мэдэгдэл шууд ирнэ (Realtime). Нэвтэрсэн админы token-оор — RLS-ээр зөвхөн админд.
export function subscribeNewReports(onInsert: (report: SpotReport) => void) {
  const client = supabaseAuthed;
  if (!client) return () => {};
  const channel = client
    .channel("spot_reports:admin")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "spot_reports" }, (payload) =>
      onInsert(payload.new as SpotReport)
    )
    .subscribe();
  return () => {
    client.removeChannel(channel);
  };
}
