import { EventAttendee, StudyEvent } from "@/types";
import { supabase, supabaseAuthed } from "@/lib/supabase/client";

export async function fetchEvents(): Promise<StudyEvent[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: true });
  if (error) {
    console.error("Supabase events:", error.message);
    return null;
  }
  return data as StudyEvent[];
}

export async function insertEvent(
  event: Omit<StudyEvent, "id" | "created_at">
): Promise<StudyEvent | null> {
  if (!supabaseAuthed) return null;
  const { data, error } = await supabaseAuthed.from("events").insert(event).select("*").single();
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

export async function insertAttendee(
  attendee: Omit<EventAttendee, "id" | "created_at">
): Promise<EventAttendee | null> {
  if (!supabaseAuthed) return null;
  const { data, error } = await supabaseAuthed
    .from("event_attendees")
    .insert(attendee)
    .select("*")
    .single();
  if (error) {
    console.error("Supabase insert attendee:", error.message);
    return null;
  }
  return data as EventAttendee;
}

export async function deleteAttendee(id: number): Promise<boolean> {
  if (!supabaseAuthed) return false;
  const { error } = await supabaseAuthed.from("event_attendees").delete().eq("id", id);
  if (error) {
    console.error("Supabase delete attendee:", error.message);
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
  const { error } = await supabaseAuthed.from("events").delete().eq("id", id);
  if (error) {
    console.error("Supabase delete event:", error.message);
    return false;
  }
  return true;
}
