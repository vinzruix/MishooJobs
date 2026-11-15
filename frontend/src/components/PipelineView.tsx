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
    { id: "saved", label: "Guardadas", icon: Bookmark, color: "text-amber-800 border-amber-200 bg-amber-50" },
    { id: "applied", label: "Postuladas", icon: CheckCircle2, color: "text-emerald-800 border-emerald-200 bg-emerald-50" },
    { id: "interviewing", label: "En Entrevista", icon: MessageSquare, color: "text-sky-800 border-sky-200 bg-sky-50" },
    { id: "rejected", label: "Rechazadas", icon: AlertCircle, color: "text-slate-600 border-slate-200 bg-slate-100" },
  ];

  const displayedApps =
    filterStatus === "all"
      ? applications.filter((a) => a.status !== "ignored")
      : applications.filter((a) => a.status === filterStatus);

  return (
    <div className="flex flex-col gap-4">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Postulaciones ({applications.filter((a) => a.status !== "ignored").length})
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-colors ${
              filterStatus === "all"
                ? "bg-slate-900 border-slate-900 text-white font-semibold shadow-xs"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
                className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-colors flex items-center gap-1 ${
                  filterStatus === col.id
                    ? "bg-slate-900 border-slate-900 text-white font-semibold shadow-xs"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
        <div className="py-16 text-center border border-dashed border-slate-300 rounded-2xl text-slate-500 bg-white/60">
          <Bookmark className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No hay postulaciones en este estado</p>
          <p className="text-xs text-slate-500 mt-1">Guarda vacantes desde la búsqueda para darles seguimiento aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedApps.map((app) => (
            <div
              key={app.vacancy_fingerprint}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      statusColumns.find((c) => c.id === app.status)?.color || "border-slate-200 text-slate-600 bg-slate-100"
                    }`}
                  >
                    {statusColumns.find((c) => c.id === app.status)?.label || app.status}
                  </span>
                  {app.fit_score !== undefined && (
                    <span className="text-[10px] text-slate-600 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      {app.fit_score}% Fit
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">{app.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">{app.company_name}</p>

                {app.applied_at && (
                  <p className="text-[10px] text-emerald-700 font-medium mt-2">
                    Postulado el: {new Date(app.applied_at).toLocaleDateString("es-MX")}
                  </p>
                )}
              </div>

              {/* Status Change Selector & Links */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <select
                  value={app.status}
                  onChange={(e) => onUpdateStatus(app, e.target.value as ApplicationStatus)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-[11px] text-slate-800 font-medium focus:outline-none focus:border-slate-400 shadow-2xs"
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
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                      title="Abrir enlace original"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => onRemove(app.vacancy_fingerprint)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
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
