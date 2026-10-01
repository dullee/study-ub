"use client";

import { useEffect } from "react";
import { applySky, skyState } from "@/lib/sky";

// Хуудас нээлттэй байхад тэнгэрийн өнгө, сүүдрийн чиглэлийг минут тутам шинэчилнэ (эхнийхийг layout-ын inline script тавина).
export default function SkyClock() {
  useEffect(() => {
    const update = () => applySky(skyState(Date.now()), document.documentElement);
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);
  return null;
}
