import { Star } from "lucide-react";

interface StarsProps {
  value: number;
  className?: string;
}

// Зурсан одод (unicode ★ биш). Утга нь хажуугийн тоо болон aria-label-д.
export default function Stars({ value, className = "" }: StarsProps) {
  const filled = Math.round(value);
  return (
    <span className={`inline-flex items-center gap-px ${className}`} role="img" aria-label={`${value.toFixed(1)}/5`}>
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          aria-hidden="true"
          className="h-3.5 w-3.5"
          strokeWidth={0}
          fill={index <= filled ? "#e89a00" : "#3a587f"}
        />
      ))}
    </span>
  );
}
