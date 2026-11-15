import React, { useState } from "react";
import { Briefcase, X, AlertCircle, RefreshCw, Plus, Globe } from "lucide-react";
import type { MasterProfileData } from "../types/master_profile";
import type { GeneratedResumeRecord } from "../types/resume";
import { extractMasterProfileSkills } from "../services/master_profile_skills";
import { generateRoleCV } from "../services/cv_api";
import { db } from "../db";

interface RoleArchetypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterProfile: MasterProfileData | null;
  onSuccess: (resumeId: string) => void;
  onOpenMasterProfile?: () => void;
}

export const RoleArchetypeModal: React.FC<RoleArchetypeModalProps> = ({
  isOpen,
  onClose,
  masterProfile,
  onSuccess,
  onOpenMasterProfile,
}) => {
  const [targetRole, setTargetRole] = useState<string>("");
  const [focusTagInput, setFocusTagInput] = useState<string>("");
  const [focusTags, setFocusTags] = useState<string[]>([]);
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const experiencesCount = (masterProfile?.experience || []).length;
  const projectsCount = (masterProfile?.projects || []).length;
  const skillsCount = extractMasterProfileSkills(masterProfile).length;
  const isProfileComplete = (experiencesCount > 0 || projectsCount > 0) && skillsCount >= 2;

  const handleAddTag = () => {
    const trimmed = focusTagInput.trim();
    if (trimmed && !focusTags.includes(trimmed)) {
      setFocusTags([...focusTags, trimmed]);
      setFocusTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFocusTags(focusTags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleGenerate = async () => {
    if (!masterProfile || !isProfileComplete || !targetRole.trim()) return;

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const response = await generateRoleCV({
        master_profile: masterProfile,
        target_role_title: targetRole.trim(),
        focus_tags: focusTags,
        language,
      });

      const newRecord: GeneratedResumeRecord = {
        id: crypto.randomUUID(),
        type: "role_archetype",
        title: `CV Base - ${targetRole.trim()}`,
        target_role: targetRole.trim(),
        language,
        template_id: "technical_high_density",
        photo_enabled: masterProfile.personal_info?.photo ?? true,
        content: response.content,
        ats_match_score: response.ats_match_score,
        revision: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db.resumes.put(newRecord);
      onSuccess(newRecord.id);
    } catch (err: any) {
      console.error("Error al generar CV por rol:", err);
      setErrorMsg(err.message || "Error al generar CV por rol");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2 text-slate-900">
            <Briefcase className="w-5 h-5 text-slate-800" />
            <h2 className="text-sm font-bold tracking-wider text-slate-900 uppercase">
              CREAR CV POR ROL (ROLE ARCHETYPE)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          {/* Target Role Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="target-role-input" className="text-xs font-semibold text-slate-700">
              Título del Rol Objetivo:
            </label>
            <input
              id="target-role-input"
              type="text"
              placeholder="ej. Frontend Developer, AI Engineer, Backend Junior"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 font-medium"
            />
          </div>

          {/* Focus Tags Input */}
          <div className="flex flex-col gap-2">
            <label htmlFor="focus-tag-input" className="text-xs font-semibold text-slate-700">
              Etiquetas de Enfoque Tecnológico:
            </label>
            <div className="flex items-center gap-2">
              <input
                id="focus-tag-input"
                type="text"
                placeholder="ej. React, PyTorch, Docker"
                value={focusTagInput}
                onChange={(e) => setFocusTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 font-medium"
              />
              <button
                type="button"
                data-testid="add-tag-btn"
                onClick={handleAddTag}
                className="px-3.5 py-2 text-xs bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>

            {focusTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {focusTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-slate-100 border border-slate-200 text-slate-800 font-medium"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-slate-700 ml-0.5 text-xs font-bold leading-none"
                      aria-label={`Eliminar ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Language Selection */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-700 font-semibold">Idioma de redacción del CV:</span>
            </div>

            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                data-testid="role-lang-es-btn"
                onClick={() => setLanguage("es")}
                className={`text-xs px-3 py-1 rounded-lg transition-colors font-semibold ${
                  language === "es"
                    ? "bg-emerald-600 text-white font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Español (ES)
              </button>
              <button
                type="button"
                data-testid="role-lang-en-btn"
                onClick={() => setLanguage("en")}
                className={`text-xs px-3 py-1 rounded-lg transition-colors font-semibold ${
                  language === "en"
                    ? "bg-emerald-600 text-white font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                English (EN)
              </button>
            </div>
          </div>

          {/* Profile Completeness Guard */}
          {!isProfileComplete && (
            <div
              data-testid="role-incomplete-profile-alert"
              className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex flex-col gap-2 text-xs text-rose-800"
            >
              <div className="flex items-center gap-2 font-bold text-rose-900">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>Perfil Maestro Incompleto</span>
              </div>
              <p className="leading-relaxed text-rose-700">
                Necesitas tener al menos 1 experiencia o proyecto y al menos 2 habilidades registradas.
              </p>
              {onOpenMasterProfile && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenMasterProfile();
                  }}
                  className="self-start text-xs bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs font-medium transition-colors"
                >
                  Abrir Perfil Maestro
                </button>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl hover:bg-slate-100 font-medium transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            data-testid="generate-role-cv-submit-btn"
            disabled={!isProfileComplete || !targetRole.trim() || isGenerating}
            onClick={handleGenerate}
            className={`text-xs px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all ${
              isProfileComplete && targetRole.trim() && !isGenerating
                ? "bg-slate-900 hover:bg-slate-800 text-white shadow-xs active:scale-[0.98]"
                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generando con IA...</span>
              </>
            ) : (
              <>
                <Briefcase className="w-3.5 h-3.5" />
                <span>Generar CV por Rol</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
