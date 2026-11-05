import { useState } from "react";
import { ExternalLink, Trash2, Bookmark, CheckCircle2, MessageSquare, AlertCircle, Sparkles } from "lucide-react";
import type { ApplicationRecord, ApplicationStatus } from "../types/application";

interface PipelineViewProps {
  applications: ApplicationRecord[];
  onUpdateStatus: (record: ApplicationRecord, newStatus: ApplicationStatus) => void;
  onRemove: (fingerprint: string) => void;
}

export function PipelineView({
  applications,
  onUpdateStatus,
  onRemove,
}: PipelineViewProps) {
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "all">("all");

  const statusColumns: { id: ApplicationStatus; label: string; icon: any; color: string }[] = [
    { id: "saved", label: "Guardadas", icon: Bookmark, color: "text-amber-400 border-amber-800 bg-amber-950/40" },
    { id: "applied", label: "Postuladas", icon: CheckCircle2, color: "text-emerald-400 border-emerald-800 bg-emerald-950/40" },
    { id: "interviewing", label: "En Entrevista", icon: MessageSquare, color: "text-cyan-400 border-cyan-800 bg-cyan-950/40" },
    { id: "rejected", label: "Rechazadas", icon: AlertCircle, color: "text-zinc-500 border-zinc-800 bg-zinc-900/40" },
  ];

  const displayedApps =
    filterStatus === "all"
      ? applications.filter((a) => a.status !== "ignored")
      : applications.filter((a) => a.status === filterStatus);

  return (
    <div className="flex flex-col gap-4">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Pipeline de Postulaciones ({applications.filter((a) => a.status !== "ignored").length})
          </span>
          <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
            Almacenamiento Local (IndexedDB)
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
              filterStatus === "all"
                ? "bg-zinc-800 border-zinc-700 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Todas
          </button>
          {statusColumns.map((col) => {
            const count = applications.filter((a) => a.status === col.id).length;
            return (
              <button
                key={col.id}
                onClick={() => setFilterStatus(col.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors flex items-center gap-1 ${
                  filterStatus === col.id
                    ? "bg-zinc-800 border-zinc-700 text-emerald-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span>{col.label}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Applications Cards Grid */}
      {displayedApps.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-zinc-800 rounded-lg text-zinc-500">
          <Bookmark className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-zinc-400">No hay postulaciones en este estado</p>
          <p className="text-xs text-zinc-600 mt-1">Guarda vacantes desde la búsqueda para darles seguimiento aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedApps.map((app) => (
            <div
              key={app.vacancy_fingerprint}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-zinc-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      statusColumns.find((c) => c.id === app.status)?.color || "border-zinc-800 text-zinc-400"
                    }`}
                  >
                    {statusColumns.find((c) => c.id === app.status)?.label || app.status}
                  </span>
                  {app.fit_score !== undefined && (
                    <span className="text-[10px] text-zinc-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      {app.fit_score}% Fit
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2">{app.title}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{app.company_name}</p>

                {app.applied_at && (
                  <p className="text-[10px] text-emerald-500/80 mt-2">
                    Postulado el: {new Date(app.applied_at).toLocaleDateString("es-MX")}
                  </p>
                )}
              </div>

              {/* Status Change Selector & Links */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
                <select
                  value={app.status}
                  onChange={(e) => onUpdateStatus(app, e.target.value as ApplicationStatus)}
                  className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[11px] text-zinc-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="saved">Guardada</option>
                  <option value="applied">Postulada</option>
                  <option value="interviewing">En Entrevista</option>
                  <option value="rejected">Rechazada</option>
                  <option value="ignored">Descartada</option>
                </select>

                <div className="flex items-center gap-1">
                  {app.direct_url && (
                    <a
                      href={app.direct_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition-colors"
                      title="Abrir enlace original"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => onRemove(app.vacancy_fingerprint)}
                    className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 transition-colors"
                    title="Eliminar de mi pipeline"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
