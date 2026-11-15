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
  User,
} from "lucide-react";
import { useResumes } from "../hooks/useResumes";

interface ResumeLibraryViewProps {
  onSelectResume: (resumeId: string) => void;
  onExploreVacancies: () => void;
  onOpenRoleModal: () => void;
  onOpenMasterProfile?: () => void;
}

export const ResumeLibraryView: React.FC<ResumeLibraryViewProps> = ({
  onSelectResume,
  onExploreVacancies,
  onOpenRoleModal,
  onOpenMasterProfile,
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
    <div className="flex flex-col gap-6 font-sans max-w-7xl w-full mx-auto p-4 sm:p-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-800" />
            <h1 className="text-base font-bold text-slate-900 tracking-tight uppercase">
              Mis Currículums (Biblioteca Local)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Currículums adaptados a vacantes y por roles técnicos generados en tu navegador con cero servidores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenMasterProfile && (
            <button
              type="button"
              data-testid="edit-master-profile-header-btn"
              onClick={onOpenMasterProfile}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <User className="w-4 h-4 text-slate-600" />
              <span>Editar Perfil Maestro</span>
            </button>
          )}
          <button
            type="button"
            data-testid="create-role-cv-btn"
            onClick={onOpenRoleModal}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center gap-2 transition-colors active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Crear CV por Rol</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-500">
          Cargando biblioteca de CVs...
        </div>
      ) : resumes.length === 0 ? (
        /* Empty State */
        <div
          data-testid="empty-resume-library"
          className="py-16 px-6 text-center flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-2xl bg-white/60 max-w-lg mx-auto shadow-xs"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-4 text-slate-700">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Aún no has generado ningún currículum
          </h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Genera un CV adaptado con 1 clic desde cualquier vacante de empleo o crea un CV base por rol para aplicar libremente.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {onOpenMasterProfile && (
              <button
                type="button"
                data-testid="edit-master-profile-empty-btn"
                onClick={onOpenMasterProfile}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-slate-600" />
                <span>Editar Perfil Maestro</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenRoleModal}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
            >
              Crear CV por Rol
            </button>
            <button
              type="button"
              data-testid="explore-vacancies-btn"
              onClick={onExploreVacancies}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition-colors"
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
              className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-xs hover:shadow-sm"
            >
              <div className="flex flex-col gap-2.5">
                {/* Badges */}
                <div className="flex items-center justify-between gap-2">
                  {rec.type === "vacancy" ? (
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 truncate max-w-[200px]">
                      [VACANTE: {rec.vacancy_company || "Empresa"}]
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-800">
                      [ROL: {rec.target_role}]
                    </span>
                  )}

                  <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 font-mono">
                    Rev {rec.revision}
                  </span>
                </div>

                {/* Title */}
                <h3
                  onClick={() => onSelectResume(rec.id)}
                  className="text-sm font-semibold text-slate-900 hover:text-slate-700 cursor-pointer line-clamp-2 transition-colors"
                >
                  {rec.title}
                </h3>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{new Date(rec.created_at).toLocaleDateString("es-MX")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-slate-400" />
                    <span>{getTemplateLabel(rec.template_id)}</span>
                  </div>
                </div>

                {rec.ats_match_score !== undefined && (
                  <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                    <span className="text-slate-500">Score ATS:</span>
                    <span className="text-emerald-700 font-bold">{rec.ats_match_score}%</span>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  data-testid={`preview-btn-${rec.id}`}
                  onClick={() => onSelectResume(rec.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-300" />
                  <span>Previsualizar</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    data-testid={`duplicate-btn-${rec.id}`}
                    onClick={() => duplicateResume(rec.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
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
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
