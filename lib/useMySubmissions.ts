"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { StudySpot } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchMySubmissions } from "@/lib/supabase/spots";
import { loadLocalSpots } from "@/lib/localStore";

// Газар илгээсний дараа header-ийн "Миний илгээсэн" тоог шинэчлэхэд дуудна.
const EVENT = "studyspots:submissions-changed";

export function notifySubmissionsChanged() {
  window.dispatchEvent(new Event(EVENT));
}

// Нэвтэрсэн хэрэглэгчийн илгээсэн, хараахан нийтлэгдээгүй газрууд (хүлээгдэж буй, зөвшөөрөгдөөгүй).
export function useMySubmissions() {
  const { user } = useUser();
  const userId = user?.id ?? null;
  const [submissions, setSubmissions] = useState<StudySpot[]>([]);
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
      const remote = isSupabaseConfigured ? await fetchMySubmissions(userId) : null;
      const rows =
        remote ?? loadLocalSpots().filter((spot) => spot.user_id === userId && spot.status !== "approved");
      if (!cancelled) setSubmissions(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, version]);

  const visible = userId ? submissions : [];
  return {
    submissions: visible,
    pendingCount: visible.filter((spot) => spot.status === "pending").length,
  };
}
