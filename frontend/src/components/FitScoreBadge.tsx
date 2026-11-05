interface FitScoreBadgeProps {
  score: number;
  tier?: "high" | "moderate" | "low";
  size?: "sm" | "md";
}

export function FitScoreBadge({ score, tier, size = "sm" }: FitScoreBadgeProps) {
  const effectiveTier =
    tier || (score >= 80 ? "high" : score >= 50 ? "moderate" : "low");

  const tierStyles = {
    high: "bg-emerald-950/80 border-emerald-600 text-emerald-300",
    moderate: "bg-amber-950/80 border-amber-600 text-amber-300",
    low: "bg-zinc-900 border-zinc-700 text-zinc-400",
  }[effectiveTier];

  const sizeStyles = size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]";

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded border ${tierStyles} ${sizeStyles}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>{score}% Compatibilidad</span>
    </div>
  );
}
