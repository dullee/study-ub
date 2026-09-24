import { useCallback, useSyncExternalStore } from "react";

// "Бүтэн өргөн" горим: газрын зураг дэлгэцийн бүх өргөнийг ашиглана. Хөтөчид хадгалагдана.
// Сервер дээр үргэлж false — hydration зөрөхгүй, дараа нь хөтчийн утгаар шинэчлэгдэнэ.
const KEY = "studyspots_wide_layout";
const EVENT = "studyspots-wide-layout";

function read() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useWideLayout() {
  const wide = useSyncExternalStore(subscribe, read, () => false);
  const setWide = useCallback((value: boolean) => {
    try {
      localStorage.setItem(KEY, value ? "1" : "0");
    } catch {
      // Хадгалах боломжгүй (хувийн цонх гэх мэт) — энэ удаад л хүчинтэй.
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [wide, setWide] as const;
}
