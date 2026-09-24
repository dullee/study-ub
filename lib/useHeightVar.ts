import { RefObject, useEffect } from "react";

// Элементийн өндрийг CSS хувьсагч болгон <html>-д нийтэлнэ (ж: --header-h).
// Наалддаг (sticky) хэсгүүд бие биенийхээ доор байрлахад ашиглана.
export function useHeightVar(ref: RefObject<HTMLElement | null>, name: string) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => root.style.setProperty(name, `${element.offsetHeight}px`));
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.style.removeProperty(name);
    };
  }, [ref, name]);
}
