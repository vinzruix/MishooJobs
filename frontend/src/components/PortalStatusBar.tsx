import { CheckCircle2, Clock, AlertTriangle, Loader2 } from "lucide-react";
import type { PortalName, PortalStatus } from "../types/job";

interface PortalStatusBarProps {
  statuses: Record<PortalName, PortalStatus>;
  isSearching: boolean;
}

export function PortalStatusBar({ statuses, isSearching }: PortalStatusBarProps) {
  const portals: { key: PortalName; label: string }[] = [
    { key: "computrabajo", label: "Computrabajo MX" },
    { key: "indeed", label: "Indeed México" },
    { key: "occ", label: "OCC Mundial" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 py-1 text-xs">
      <span className="text-slate-400 font-semibold mr-1">Portales en Vivo:</span>
      {portals.map(({ key, label }) => {
        const status = statuses[key];
        const state = status?.status || "searching";
        const count = status?.count || 0;
        const duration = status?.duration_ms ? `${(status.duration_ms / 1000).toFixed(1)}s` : null;

        if (state === "completed") {
          return (
            <div
              key={key}
              title={`${label}: ${count} vacantes verificadas en vivo`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 font-medium text-[11px] shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{label}: {count} verificadas</span>
              {duration && <span className="text-emerald-600/70 text-[10px]">({duration})</span>}
            </div>
          );
        }

        if (state === "searching" && isSearching) {
          return (
            <div
              key={key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-sky-200 bg-sky-50 text-sky-800 font-medium text-[11px] animate-pulse shadow-xs"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
              <span>{label}: Consultando...</span>
            </div>
          );
        }

        if (state === "timeout") {
          return (
            <div
              key={key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-800 font-medium text-[11px] shadow-xs"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{label}: Timeout</span>
            </div>
          );
        }

        return (
          <div
            key={key}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 bg-slate-100 text-slate-500 text-[11px]"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
            <span>{label}: Inactivo</span>
          </div>
        );
      })}
    </div>
  );
}
