import { EventAttendee, StudyEvent } from "@/types";
import { supabase } from "@/lib/supabase/client";

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
  if (!supabase) return null;
  const { data, error } = await supabase.from("events").insert(event).select("*").single();
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
  if (!supabase) return null;
  const { data, error } = await supabase
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
  if (!supabase) return false;
  const { error } = await supabase.from("event_attendees").delete().eq("id", id);
  if (error) {
    console.error("Supabase delete attendee:", error.message);
    return false;
  }
  return true;
}
