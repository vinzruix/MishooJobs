import { useState } from "react";
import { Sparkles, Loader2, ExternalLink, AlertTriangle, Check, X, DollarSign } from "lucide-react";
import type { JobVacancy } from "../types/job";
import type { CandidateProfile, AIEvaluation } from "../types/profile";
import { evaluateVacancy } from "../services/api";
import { ScamBadge } from "./ScamBadge";

interface VacancyDetailModalProps {
  vacancy: JobVacancy | null;
  onClose: () => void;
  activeProfile?: CandidateProfile;
  cachedEvaluation?: AIEvaluation;
  onEvaluationComplete?: (fingerprint: string, evalResult: AIEvaluation) => void;
}

export function VacancyDetailModal({
  vacancy,
  onClose,
  activeProfile,
  cachedEvaluation,
  onEvaluationComplete,
}: VacancyDetailModalProps) {
  const [evaluation, setEvaluation] = useState<AIEvaluation | null>(cachedEvaluation || null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  if (!vacancy) return null;

  const handleRunAiEvaluation = async () => {
    if (!activeProfile) {
      alert("Por favor carga o activa un perfil CV primero para evaluar con IA.");
      return;
    }

    setIsLoadingAI(true);
    setAiError(null);

    const effectiveDescription =
      vacancy.description && vacancy.description.trim().length >= 10
        ? vacancy.description
        : `${vacancy.title} en ${vacancy.company_name} - ${vacancy.location_city || vacancy.location_state} (${vacancy.modality})`;

    try {
      const result = await evaluateVacancy({
        vacancy_fingerprint: vacancy.fingerprint,
        target_role: activeProfile.target_role,
        candidate_skills: activeProfile.skills,
        job_description: effectiveDescription,
      });
      setEvaluation(result);
      onEvaluationComplete?.(vacancy.fingerprint, result);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Error al ejecutar evaluación con IA.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const formatSalary = () => {
    if (!vacancy?.salary_min && !vacancy?.salary_max) {
      return "Sueldo no publicado / A convenir";
    }
    const period = vacancy.salary_period ? `/${vacancy.salary_period}` : "/mes";
    if (vacancy.salary_min && vacancy.salary_max && vacancy.salary_min !== vacancy.salary_max) {
      return `$${vacancy.salary_min.toLocaleString("es-MX")} - $${vacancy.salary_max.toLocaleString("es-MX")} ${vacancy.currency} ${period}`;
    }
    const amount = vacancy.salary_min || vacancy.salary_max;
    return `$${amount?.toLocaleString("es-MX")} ${vacancy.currency} ${period}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
                {vacancy.modality}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
                {vacancy.category}
              </span>
              {vacancy.scam_report && <ScamBadge report={vacancy.scam_report} />}
            </div>
            <h2 className="text-lg font-bold text-zinc-100">{vacancy.title}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
              <span>{vacancy.company_name} • {vacancy.location_city ? `${vacancy.location_city}, ` : ""}{vacancy.location_state}</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-zinc-800/80 px-2 py-0.5 rounded">
                <DollarSign className="w-3.5 h-3.5" />
                {formatSalary()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded hover:bg-zinc-800 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs leading-relaxed">
          {/* Predatory Alert if Critical or Warning */}
          {vacancy.scam_report && vacancy.scam_report.risk_level !== "safe" && (
            <div
              className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                vacancy.scam_report.risk_level === "critical"
                  ? "bg-rose-950/40 border-rose-800 text-rose-200"
                  : "bg-amber-950/40 border-amber-800 text-amber-200"
              }`}
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs uppercase mb-0.5">{vacancy.scam_report.badge_label}</p>
                <p className="text-[11px] opacity-90">{vacancy.scam_report.explanation}</p>
              </div>
            </div>
          )}

          {/* AI Skill Gap Analysis Section */}
          <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                  Evaluación de Compatibilidad & Skill Gaps con IA
                </h3>
              </div>
              {!evaluation && (
                <button
                  onClick={handleRunAiEvaluation}
                  disabled={isLoadingAI}
                  className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isLoadingAI ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Analizando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Evaluar con IA (agy)</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {aiError && (
              <div className="p-2 rounded bg-rose-950/50 border border-rose-800 text-[11px] text-rose-300">
                {aiError}
              </div>
            )}

            {evaluation ? (
              <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                {/* Score and Tier */}
                <div className="flex items-center justify-between bg-zinc-900 p-2.5 rounded border border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-emerald-400">{evaluation.fit_score}%</span>
                    <span className="text-zinc-400 text-xs">de afinidad técnica</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      evaluation.fit_tier === "high"
                        ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                        : evaluation.fit_tier === "moderate"
                        ? "bg-amber-950 text-amber-300 border-amber-700"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700"
                    }`}
                  >
                    Nivel {evaluation.fit_tier}
                  </span>
                </div>

                {/* Matched vs Missing Skills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>Habilidades que cumples ({evaluation.matched_skills.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {evaluation.matched_skills.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/50 text-emerald-300 border border-emerald-800/60">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800">
                    <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1.5">
                      <X className="w-3.5 h-3.5" />
                      <span>Brechas por cubrir ({evaluation.missing_skills.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {evaluation.missing_skills.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950/50 text-amber-300 border border-amber-800/60">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Summary and Advice */}
                <div className="space-y-2 text-zinc-300 text-[11px]">
                  <div>
                    <h4 className="font-bold text-zinc-400 uppercase text-[10px]">Diagnóstico de Preparación</h4>
                    <p className="mt-0.5 leading-relaxed">{evaluation.role_readiness_summary}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-400 uppercase text-[10px]">Consejo Accionable</h4>
                    <p className="mt-0.5 leading-relaxed">{evaluation.actionable_advice}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-zinc-500">
                {activeProfile
                  ? `Perfil activo: ${activeProfile.name} (${activeProfile.skills.length} habilidades). Presiona "Evaluar con IA" para calcular brechas técnicas.`
                  : "Carga tu CV para calcular tu puntaje de compatibilidad exacto y sugerencias de aprendizaje."}
              </p>
            )}
          </div>

          {/* Extracted Skills */}
          {vacancy.skills && vacancy.skills.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Habilidades Técnicas Detectadas
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {vacancy.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Job Description */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Descripción Completa de la Vacante
            </h4>
            <div className="whitespace-pre-line bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 text-zinc-300 text-xs leading-relaxed">
              {vacancy.description}
            </div>
          </div>
        </div>

        {/* Footer Direct Links */}
        <div className="p-3 border-t border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex flex-wrap items-center gap-2">
            {vacancy.external_links.map((link, i) => (
              <a
                key={i}
                href={link.direct_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs uppercase flex items-center gap-1.5 transition-colors"
              >
                <span>Postular en {link.portal_name}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
