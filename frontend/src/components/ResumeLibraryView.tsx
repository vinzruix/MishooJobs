import React from "react";
import {
  FileText,
  Copy,
  Trash2,
  Eye,
  Plus,
  Calendar,
  Briefcase,
  Layers,
} from "lucide-react";
import { useResumes } from "../hooks/useResumes";

interface ResumeLibraryViewProps {
  onSelectResume: (resumeId: string) => void;
  onExploreVacancies: () => void;
  onOpenRoleModal: () => void;
}

export const ResumeLibraryView: React.FC<ResumeLibraryViewProps> = ({
  onSelectResume,
  onExploreVacancies,
  onOpenRoleModal,
}) => {
  const { resumes, isLoading, deleteResume, duplicateResume } = useResumes();

  const getTemplateLabel = (templateId: string) => {
    switch (templateId) {
      case "classic_ats":
        return "Clásico ATS";
      case "modern_executive":
        return "Ejecutivo Moderno";
      default:
        return "Técnico Alta Densidad";
    }
  };

  return (
    <div className="flex flex-col gap-6 font-mono max-w-7xl w-full mx-auto p-4 sm:p-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h1 className="text-base font-bold text-zinc-100 tracking-wider uppercase">
              Mis Currículums (Biblioteca Local)
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Currículums adaptados a vacantes y por roles técnicos generados en tu navegador con cero servidores.
          </p>
        </div>

        <button
          type="button"
          data-testid="create-role-cv-btn"
          onClick={onOpenRoleModal}
          className="px-4 py-2 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Crear CV por Rol</span>
        </button>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-zinc-500">
          Cargando biblioteca de CVs...
        </div>
      ) : resumes.length === 0 ? (
        /* Empty State */
        <div
          data-testid="empty-resume-library"
          className="py-16 px-6 text-center flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40 max-w-lg mx-auto"
        >
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-emerald-400">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-200 mb-1">
            Aún no has generado ningún currículum
          </h3>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            Genera un CV adaptado con 1 clic desde cualquier vacante de empleo o crea un CV base por rol para aplicar libremente.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenRoleModal}
              className="px-4 py-2 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              Crear CV por Rol
            </button>
            <button
              type="button"
              data-testid="explore-vacancies-btn"
              onClick={onExploreVacancies}
              className="px-4 py-2 text-xs font-semibold rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
            >
              Explorar Vacantes en Vivo
            </button>
          </div>
        </div>
      ) : (
        /* Resume Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((rec) => (
            <div
              key={rec.id}
              data-testid={`resume-card-${rec.id}`}
              className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-lg p-5 flex flex-col justify-between transition-all shadow-sm hover:shadow-md"
            >
              <div className="flex flex-col gap-2.5">
                {/* Badges */}
                <div className="flex items-center justify-between gap-2">
                  {rec.type === "vacancy" ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800 text-cyan-300 truncate max-w-[200px]">
                      [VACANTE: {rec.vacancy_company || "Empresa"}]
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800 text-purple-300">
                      [ROL: {rec.target_role}]
                    </span>
                  )}

                  <span className="text-[10px] text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60 font-mono">
                    Rev {rec.revision}
                  </span>
                </div>

                {/* Title */}
                <h3
                  onClick={() => onSelectResume(rec.id)}
                  className="text-sm font-semibold text-zinc-100 hover:text-emerald-400 cursor-pointer line-clamp-2 transition-colors"
                >
                  {rec.title}
                </h3>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400 pt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-500" />
                    <span>{new Date(rec.created_at).toLocaleDateString("es-MX")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-zinc-500" />
                    <span>{getTemplateLabel(rec.template_id)}</span>
                  </div>
                </div>

                {rec.ats_match_score !== undefined && (
                  <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                    <span className="text-zinc-500">Score ATS:</span>
                    <span className="text-emerald-400 font-bold">{rec.ats_match_score}%</span>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-800/80 text-xs">
                <button
                  type="button"
                  data-testid={`preview-btn-${rec.id}`}
                  onClick={() => onSelectResume(rec.id)}
                  className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Previsualizar</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    data-testid={`duplicate-btn-${rec.id}`}
                    onClick={() => duplicateResume(rec.id)}
                    className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                    title="Duplicar currículum"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    data-testid={`delete-btn-${rec.id}`}
                    onClick={() => {
                      if (window.confirm("¿Seguro que deseas eliminar este currículum?")) {
                        deleteResume(rec.id);
                      }
                    }}
                    className="p-1.5 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                    title="Eliminar currículum"
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
};
