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
      <span className="text-zinc-500 font-semibold mr-1">Portales en Vivo:</span>
      {portals.map(({ key, label }) => {
        const status = statuses[key];
        const state = status?.status || "searching";
        const count = status?.count || 0;
        const duration = status?.duration_ms ? `${(status.duration_ms / 1000).toFixed(1)}s` : null;

        if (state === "completed") {
          return (
            <div
              key={key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-800/60 bg-emerald-950/40 text-emerald-300 font-medium text-[11px]"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{label}: {count} verificadas</span>
              {duration && <span className="text-emerald-500/70 text-[10px]">({duration})</span>}
            </div>
          );
        }

        if (state === "searching" && isSearching) {
          return (
            <div
              key={key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-cyan-800/60 bg-cyan-950/40 text-cyan-300 font-medium text-[11px] animate-pulse"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>{label}: Consultando...</span>
            </div>
          );
        }

        if (state === "timeout") {
          return (
            <div
              key={key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-800/60 bg-amber-950/40 text-amber-300 font-medium text-[11px]"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{label}: Timeout</span>
            </div>
          );
        }

        return (
          <div
            key={key}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900/40 text-zinc-400 text-[11px]"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-zinc-500" />
            <span>{label}: Inactivo</span>
          </div>
        );
      })}
    </div>
  );
}
