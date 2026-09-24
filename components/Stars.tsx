interface StarsProps {
  value: number;
  className?: string;
}

export default function Stars({ value, className = "" }: StarsProps) {
  const filled = Math.round(value);
  return (
    <span className={`text-amber-400 tracking-tight ${className}`} role="img" aria-label={`${value.toFixed(1)}/5`}>
      {"★".repeat(filled)}
      <span className="text-slate-600">{"★".repeat(5 - filled)}</span>
    </span>
  );
}
