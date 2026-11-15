interface FitScoreBadgeProps {
  score: number;
  tier?: "high" | "moderate" | "low";
  size?: "sm" | "md";
}

export function FitScoreBadge({ score, tier, size = "sm" }: FitScoreBadgeProps) {
  const effectiveTier =
    tier || (score >= 80 ? "high" : score >= 50 ? "moderate" : "low");

  const tierStyles = {
    high: "bg-emerald-50 border-emerald-200 text-emerald-800",
    moderate: "bg-amber-50 border-amber-200 text-amber-800",
    low: "bg-slate-100 border-slate-200 text-slate-600",
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
