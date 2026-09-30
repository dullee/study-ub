"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { addFavorites, fetchFavorites, removeFavorite } from "@/lib/supabase/favorites";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { loadLocalFavorites, saveLocalFavorites } from "@/lib/localStore";

// Хадгалсан газрууд. Нэвтэрсэн бол бүртгэлд (Supabase), үгүй бол хөтөчид.
// Нэвтрээгүй үед хадгалсныг дараа нэвтрэхэд бүртгэл рүү шилжүүлж, хөтчийнхийг цэвэрлэнэ.
// Товч дармагц шууд өөрчлөгдөж, хадгалж чадаагүй бол буцаана.
export function useFavorites(failedMessage: string) {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;
  const remote = isSupabaseConfigured && userId !== null;
  const [ids, setIds] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    async function load() {
      const local = loadLocalFavorites();
      if (!remote || !userId) {
        if (!cancelled) setIds(new Set(local));
        return;
      }
      if (local.length > 0) {
        // Нэгийг нь (устгагдсан газар гэх мэт) нэмж чадаагүй ч бусдыг нь алдахгүй.
        let moved = await addFavorites(userId, local);
        if (!moved) moved = (await Promise.all(local.map((id) => addFavorites(userId, [id])))).some(Boolean);
        // Юу ч шилжээгүй бол (хүснэгт хараахан үүсээгүй гэх мэт) хөтчийнхийг устгахгүй.
        if (moved) saveLocalFavorites([]);
      }
      const saved = await fetchFavorites();
      if (!cancelled) setIds(new Set(saved ?? local));
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, remote, userId]);

  const toggle = useCallback(
    async (spotId: number) => {
      const adding = !ids.has(spotId);
      const next = new Set(ids);
      if (adding) next.add(spotId);
      else next.delete(spotId);
      setIds(next);
      if (!remote || !userId) {
        saveLocalFavorites([...next]);
        return;
      }
      const ok = adding ? await addFavorites(userId, [spotId]) : await removeFavorite(spotId);
      if (!ok) {
        setIds((current) => {
          const reverted = new Set(current);
          if (adding) reverted.delete(spotId);
          else reverted.add(spotId);
          return reverted;
        });
        toast.error(failedMessage);
      }
    },
    [ids, remote, userId, failedMessage]
  );

  return { favorites: ids, toggleFavorite: toggle };
}
