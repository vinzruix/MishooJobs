import React, { useState } from "react";
import { Sparkles, X, AlertCircle, RefreshCw, CheckCircle, Globe } from "lucide-react";
import type { JobVacancy } from "../types/job";
import type { MasterProfileData } from "../types/master_profile";
import type { GeneratedResumeRecord } from "../types/resume";
import { extractMasterProfileSkills } from "../services/master_profile_skills";
import { generateTailoredCV } from "../services/cv_api";
import { db } from "../db";

interface VacancyTailorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vacancy: JobVacancy;
  masterProfile: MasterProfileData | null;
  onSuccess: (resumeId: string) => void;
  onOpenMasterProfile?: () => void;
}

export const VacancyTailorModal: React.FC<VacancyTailorModalProps> = ({
  isOpen,
  onClose,
  vacancy,
  masterProfile,
  onSuccess,
  onOpenMasterProfile,
}) => {
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const experiencesCount = (masterProfile?.experience || []).length;
  const projectsCount = (masterProfile?.projects || []).length;
  const skillsCount = extractMasterProfileSkills(masterProfile).length;
  const isProfileComplete = (experiencesCount > 0 || projectsCount > 0) && skillsCount >= 2;

  const handleGenerate = async () => {
    if (!masterProfile || !isProfileComplete) return;

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const existing = await db.resumes
        .where("vacancy_fingerprint")
        .equals(vacancy.fingerprint)
        .toArray();
      const revision = existing.length + 1;

      const effectiveDesc =
        vacancy.description && vacancy.description.trim().length >= 10
          ? vacancy.description
          : `${vacancy.title} en ${vacancy.company_name} - ${vacancy.location_city || vacancy.location_state || "México"} (${vacancy.modality})`;

      const response = await generateTailoredCV({
        master_profile: masterProfile,
        vacancy_title: vacancy.title,
        vacancy_company: vacancy.company_name,
        job_description: effectiveDesc,
        vacancy_fingerprint: vacancy.fingerprint,
        desired_skills: vacancy.skills || [],
        language,
      });

      const newRecord: GeneratedResumeRecord = {
        id: crypto.randomUUID(),
        type: "vacancy",
        title: `${vacancy.company_name} - ${vacancy.title}${revision > 1 ? ` (Rev ${revision})` : ""}`,
        target_role: vacancy.title,
        language,
        vacancy_fingerprint: vacancy.fingerprint,
        vacancy_company: vacancy.company_name,
        vacancy_title: vacancy.title,
        template_id: "technical_high_density",
        photo_enabled: masterProfile.personal_info?.photo ?? true,
        content: response.content,
        ats_match_score: response.ats_match_score,
        revision,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db.resumes.put(newRecord);
      onSuccess(newRecord.id);
    } catch (err: any) {
      console.error("Error al generar CV adaptado:", err);
      setErrorMsg(err.message || "Error durante la generación de CV");
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
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold tracking-wider text-slate-900 uppercase">
              GENERAR CV ADAPTADO A LA VACANTE
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
          {/* Vacancy Summary Card */}
          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl flex flex-col gap-2">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              Vacante Destino
            </span>
            <h3 className="text-sm font-semibold text-slate-900">{vacancy.title}</h3>
            <p className="text-xs text-slate-500 font-medium">{vacancy.company_name}</p>

            {vacancy.skills && vacancy.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {vacancy.skills.slice(0, 8).map((sk) => (
                  <span
                    key={sk}
                    className="text-[10px] px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-medium"
                  >
                    {sk}
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
                data-testid="lang-es-btn"
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
                data-testid="lang-en-btn"
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
          {!isProfileComplete ? (
            <div
              data-testid="incomplete-profile-alert"
              className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex flex-col gap-3 text-xs text-rose-800"
            >
              <div className="flex items-center gap-2 font-bold text-rose-900">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>Perfil Maestro Incompleto</span>
              </div>
              <p className="leading-relaxed text-rose-700">
                Para generar un currículum adaptado con IA de alta calidad, necesitas tener al menos
                1 experiencia laboral o proyecto técnico, y al menos 2 habilidades registradas.
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
          ) : (
            <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl font-medium">
              <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>Perfil Maestro listo: Se seleccionarán y refrasearán experiencias relevantes con método STAR.</span>
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
            data-testid="generate-cv-submit-btn"
            disabled={!isProfileComplete || isGenerating}
            onClick={handleGenerate}
            className={`text-xs px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all ${
              isProfileComplete && !isGenerating
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
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generar CV Adaptado</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
