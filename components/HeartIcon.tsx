// Хадгалах товчны зүрх: хадгалсан бол дүүрэн (ягаан-улаан), үгүй бол хүрээ. Утга нь товчны aria-label-д.
export default function HeartIcon({ filled, className = "h-4 w-4" }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`shrink-0 ${className} ${filled ? "text-rose-500" : "text-current"}`}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.8 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.4 0 5.6 3.3 4.4 6.7-1.7 4.7-9.2 9.3-9.2 9.3z" />
    </svg>
  );
}
