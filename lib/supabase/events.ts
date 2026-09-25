import { EventAttendee, StudyEvent } from "@/types";
import { supabase, supabaseAuthed } from "@/lib/supabase/client";

export async function fetchEvents(): Promise<StudyEvent[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "approved")
    .order("starts_at", { ascending: true });
  if (error) {
    console.error("Supabase events:", error.message);
    return null;
  }
  return data as StudyEvent[];
}

// Админ: бүх статус. RLS is_admin()-аар нээгдэнэ.
export async function fetchAllEvents(): Promise<StudyEvent[] | null> {
  if (!supabaseAuthed) return null;
  const { data, error } = await supabaseAuthed
    .from("events")
    .select("*")
    .order("starts_at", { ascending: false });
  if (error) {
    console.error("Supabase all events:", error.message);
    return null;
  }
  return data as StudyEvent[];
}

export async function insertEvent(
  event: Omit<StudyEvent, "id" | "created_at">
): Promise<StudyEvent | null> {
  if (!supabaseAuthed) return null;
  const { data, error } = await supabaseAuthed
    .from("events")
    .insert({ ...event, status: event.status ?? "pending" })
    .select("*")
    .single();
  if (error) {
    console.error("Supabase insert event:", error.message);
    return null;
  }
  return data as StudyEvent;
}

export async function fetchAttendees(): Promise<EventAttendee[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("event_attendees")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("Supabase attendees:", error.message);
    return null;
  }
  return data as EventAttendee[];
}

// Өгөгдлийн сан хүний тоо дүүрсэн, эвент дууссан үед татгалзана (20260924000012_limits.sql).
export type JoinError = "event_full" | "event_ended" | "failed";

export async function insertAttendee(
  attendee: Omit<EventAttendee, "id" | "created_at">
): Promise<EventAttendee | JoinError> {
  if (!supabaseAuthed) return "failed";
  const { data, error } = await supabaseAuthed
    .from("event_attendees")
    .insert(attendee)
    .select("*")
    .single();
  if (error) {
    console.error("Supabase insert attendee:", error.message);
    if (error.message.includes("event_full")) return "event_full";
    if (error.message.includes("event_ended")) return "event_ended";
    return "failed";
  }
  return data as EventAttendee;
}

export async function deleteAttendee(id: number): Promise<boolean> {
  if (!supabaseAuthed) return false;
  // RLS хаасан устгал алдаагүй 0 мөр буцаадаг — устсан мөрийг буцааж авч шалгана.
  const { data, error } = await supabaseAuthed.from("event_attendees").delete().eq("id", id).select("id");
  if (error || !data?.length) {
    console.error("Supabase delete attendee:", error?.message ?? "no rows deleted");
    return false;
  }
  return true;
}

// Групп чатын холбоос. RLS: ирэх хүмүүс, зохион байгуулагч уншина; зөвхөн зохион байгуулагч өөрчилнө.
// undefined — уншиж чадсангүй (эрхгүй эсвэл алдаа), null — холбоос байхгүй.
export async function fetchChatLink(eventId: number): Promise<string | null | undefined> {
  if (!supabaseAuthed) return undefined;
  const { data, error } = await supabaseAuthed
    .from("event_chat_links")
    .select("url")
    .eq("event_id", eventId)
    .maybeSingle();
  if (error) {
    console.error("Supabase chat link:", error.message);
    return undefined;
  }
  return (data as { url: string } | null)?.url ?? null;
}

export async function saveChatLink(eventId: number, url: string): Promise<boolean> {
  if (!supabaseAuthed) return false;
  const { error } = await supabaseAuthed
    .from("event_chat_links")
    .upsert({ event_id: eventId, url, updated_at: new Date().toISOString() });
  if (error) {
    console.error("Supabase save chat link:", error.message);
    return false;
  }
  return true;
}

export async function deleteChatLink(eventId: number): Promise<boolean> {
  if (!supabaseAuthed) return false;
  const { error } = await supabaseAuthed.from("event_chat_links").delete().eq("event_id", eventId);
  if (error) {
    console.error("Supabase delete chat link:", error.message);
    return false;
  }
  return true;
}

// Доорх хоёр нь админд: RLS нь Clerk session token-ы metadata.role = "admin"-ийг шалгана.
export async function updateEvent(event: StudyEvent): Promise<StudyEvent | null> {
  if (!supabaseAuthed) return null;
  const { data, error } = await supabaseAuthed
    .from("events")
    .update({
      title: event.title,
      description: event.description,
      place_name: event.place_name,
      starts_at: event.starts_at,
      max_people: event.max_people,
      status: event.status ?? "approved",
    })
    .eq("id", event.id)
    .select("*")
    .single();
  if (error) {
    console.error("Supabase update event:", error.message);
    return null;
  }
  return data as StudyEvent;
}

// Бүртгэл, групп чатын холбоос нь хамт устгагдана (on delete cascade).
export async function deleteEvent(id: number): Promise<boolean> {
  if (!supabaseAuthed) return false;
  // RLS хаасан устгал алдаагүй 0 мөр буцаадаг — устсан мөрийг буцааж авч шалгана.
  const { data, error } = await supabaseAuthed.from("events").delete().eq("id", id).select("id");
  if (error || !data?.length) {
    console.error("Supabase delete event:", error?.message ?? "no rows deleted");
    return false;
  }
  return true;
}
