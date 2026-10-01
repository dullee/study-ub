"use client";

import { createContext, ReactNode, useContext } from "react";

// Админы демо (/admin/demo): нэвтрэлтгүй, жинхэнэ өгөгдөлд хүрэхгүй. Энэ context доторх компонентууд
// (MediaPicker, газрын засах маягт) файлыг Cloudinary руу хуулахын оронд хөтөч дээрх урьдчилсан харагдацаар орлуулна.
const DemoModeContext = createContext(false);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  return <DemoModeContext.Provider value={true}>{children}</DemoModeContext.Provider>;
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}
