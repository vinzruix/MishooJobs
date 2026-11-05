import { AlertTriangle, AlertOctagon } from "lucide-react";
import type { ScamReport } from "../types/job";

interface ScamBadgeProps {
  report: ScamReport;
  size?: "sm" | "md";
}

export function ScamBadge({ report, size = "sm" }: ScamBadgeProps) {
  if (report.risk_level === "safe") {
    return null;
  }

  const isCritical = report.risk_level === "critical";
  const styles = isCritical
    ? "bg-rose-950/90 border-rose-500 text-rose-200 shadow-rose-950/50"
    : "bg-amber-950/90 border-amber-500 text-amber-200 shadow-amber-950/50";

  const sizeClasses = size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]";

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded border shadow-sm ${styles} ${sizeClasses}`}
      title={report.explanation}
    >
      {isCritical ? (
        <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
      ) : (
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      )}
      <span>{report.badge_label}</span>
    </div>
  );
}
