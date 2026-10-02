"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { StudyEvent, StudySpot } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchMySubmissions } from "@/lib/supabase/spots";
import { fetchMyEventSubmissions } from "@/lib/supabase/events";
import { loadLocalEvents, loadLocalSpots } from "@/lib/localStore";

// Газар эсвэл эвент илгээсний дараа header-ийн "Миний илгээсэн" тоог шинэчлэхэд дуудна.
const EVENT = "studyspots:submissions-changed";

export function notifySubmissionsChanged() {
  window.dispatchEvent(new Event(EVENT));
}

// Эвентийн хуудсанд эвентүүд, бусад хуудсанд газрууд.
export type SubmissionKind = "spots" | "events";

async function loadSpots(userId: string): Promise<StudySpot[]> {
  const remote = isSupabaseConfigured ? await fetchMySubmissions(userId) : null;
  return remote ?? loadLocalSpots().filter((spot) => spot.user_id === userId && spot.status !== "approved");
}

async function loadEvents(userId: string): Promise<StudyEvent[]> {
  const remote = isSupabaseConfigured ? await fetchMyEventSubmissions(userId) : null;
  return (
    remote ??
    loadLocalEvents().filter((event) => event.user_id === userId && (event.status ?? "approved") !== "approved")
  );
}

// Нэвтэрсэн хэрэглэгчийн илгээсэн, хараахан нийтлэгдээгүй газрууд эсвэл эвентүүд (хүлээгдэж буй, зөвшөөрөгдөөгүй).
export function useMySubmissions(kind: SubmissionKind = "spots") {
  const { user } = useUser();
  const userId = user?.id ?? null;
  const [spots, setSpots] = useState<StudySpot[]>([]);
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onChange = () => setVersion((value) => value + 1);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      if (kind === "events") {
        const rows = await loadEvents(userId);
        if (!cancelled) setEvents(rows);
      } else {
        const rows = await loadSpots(userId);
        if (!cancelled) setSpots(rows);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, version, kind]);

  const visibleSpots = userId && kind === "spots" ? spots : [];
  const visibleEvents = userId && kind === "events" ? events : [];
  const visible: { status?: StudySpot["status"] }[] = kind === "events" ? visibleEvents : visibleSpots;
  return {
    kind,
    spots: visibleSpots,
    events: visibleEvents,
    count: visible.length,
    pendingCount: visible.filter((item) => item.status === "pending").length,
  };
}
