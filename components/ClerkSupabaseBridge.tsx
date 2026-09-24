"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { setSupabaseTokenGetter } from "@/lib/supabase/client";

export default function ClerkSupabaseBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setSupabaseTokenGetter(() => getToken());
  }, [getToken]);

  return null;
}
