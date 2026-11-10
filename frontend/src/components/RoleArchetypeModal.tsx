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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-mono">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2 text-emerald-400">
            <Briefcase className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold tracking-wider text-zinc-100">
              CREAR CV POR ROL (ROLE ARCHETYPE)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          {/* Target Role Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="target-role-input" className="text-xs font-semibold text-zinc-300">
              Título del Rol Objetivo:
            </label>
            <input
              id="target-role-input"
              type="text"
              placeholder="ej. Frontend Developer, AI Engineer, Backend Junior"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Focus Tags Input */}
          <div className="flex flex-col gap-2">
            <label htmlFor="focus-tag-input" className="text-xs font-semibold text-zinc-300">
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
                className="flex-1 px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                data-testid="add-tag-btn"
                onClick={handleAddTag}
                className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 flex items-center gap-1"
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
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-emerald-400 hover:text-emerald-200"
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
          <div className="flex items-center justify-between p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-lg">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-zinc-400" />
              <span className="text-xs text-zinc-300 font-semibold">Idioma de redacción del CV:</span>
            </div>

            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded border border-zinc-800">
              <button
                type="button"
                data-testid="role-lang-es-btn"
                onClick={() => setLanguage("es")}
                className={`text-xs px-3 py-1 rounded transition-colors ${
                  language === "es"
                    ? "bg-emerald-600 text-white font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Español (ES)
              </button>
              <button
                type="button"
                data-testid="role-lang-en-btn"
                onClick={() => setLanguage("en")}
                className={`text-xs px-3 py-1 rounded transition-colors ${
                  language === "en"
                    ? "bg-emerald-600 text-white font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
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
              className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-lg flex flex-col gap-2 text-xs text-rose-300"
            >
              <div className="flex items-center gap-2 font-bold text-rose-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Perfil Maestro Incompleto</span>
              </div>
              <p className="leading-relaxed">
                Necesitas tener al menos 1 experiencia o proyecto y al menos 2 habilidades registradas.
              </p>
              {onOpenMasterProfile && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenMasterProfile();
                  }}
                  className="self-start text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-3 py-1.5 rounded border border-zinc-700"
                >
                  Abrir Perfil Maestro
                </button>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-lg text-xs text-rose-200">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900/60">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-zinc-200 px-4 py-2 rounded hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            data-testid="generate-role-cv-submit-btn"
            disabled={!isProfileComplete || !targetRole.trim() || isGenerating}
            onClick={handleGenerate}
            className={`text-xs px-5 py-2.5 rounded font-semibold flex items-center gap-2 transition-colors ${
              isProfileComplete && targetRole.trim() && !isGenerating
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
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
