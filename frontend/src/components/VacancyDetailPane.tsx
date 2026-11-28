import React, { useEffect, useState, useMemo } from "react";
import {
  Sparkles,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Check,
  X,
  ShieldCheck,
  Bookmark,
  CheckCircle2,
  MapPin,
  Clock,
} from "lucide-react";
import type { JobVacancy, SeniorityAuditResult, DetailTab } from "../types/job";
import type { CandidateProfile, AIEvaluation } from "../types/profile";
import type { MasterProfileData } from "../types/master_profile";
import { auditVacancy, evaluateVacancy } from "../services/api";
import { ScamBadge } from "./ScamBadge";
import { PastelMetricGrid } from "./PastelMetricGrid";
import { parseJobDescription } from "../services/job_description_parser";
import { JobDescriptionViewer } from "./JobDescriptionViewer";
import { normalizeSeniorityDisplayText } from "../services/text_normalizer";

export interface VacancyDetailPaneProps {
  vacancy: JobVacancy | null;
  activeProfile?: CandidateProfile;
  masterProfile?: MasterProfileData | null;
  universalSkills?: string[];
  cachedEvaluation?: AIEvaluation;
  isMobileSheet?: boolean;
  onClose?: () => void;
  onEvaluationComplete?: (fingerprint: string, evalResult: AIEvaluation) => void;
  onOpenTailorModal?: (vacancy: JobVacancy) => void;
  onSave?: (vacancy: JobVacancy) => void;
  onMarkApplied?: (vacancy: JobVacancy) => void;
  isSaved?: boolean;
  isApplied?: boolean;
  initialTab?: DetailTab;
}

export const VacancyDetailPane: React.FC<VacancyDetailPaneProps> = ({
  vacancy,
  activeProfile,
  masterProfile,
  universalSkills,
  cachedEvaluation,
  isMobileSheet = false,
  onClose,
  onEvaluationComplete,
  onOpenTailorModal,
  onSave,
  onMarkApplied,
  isSaved = false,
  isApplied = false,
  initialTab = "description",
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>(initialTab);
  const [evaluation, setEvaluation] = useState<AIEvaluation | null>(cachedEvaluation || null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<SeniorityAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const structuredDescription = useMemo(() => {
    if (!vacancy) {
      return {
        hasStructuredSections: false,
        sections: [],
        rawText: "",
      };
    }
    return parseJobDescription(evaluation?.full_description || vacancy.description || "");
  }, [evaluation?.full_description, vacancy?.description]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Sync state whenever vacancy or cachedEvaluation changes
  useEffect(() => {
    setEvaluation(cachedEvaluation || null);
    setIsLoadingAI(false);
    setAiError(null);
    setAuditError(null);

    if (vacancy && vacancy.audit_status === "preliminary") {
      performAudit();
    } else if (vacancy && vacancy.audit_status === "verified") {
      setAuditResult({
        vacancy_fingerprint: vacancy.fingerprint,
        seniority_level: vacancy.seniority_level,
        years_required_min: vacancy.years_required_min,
        is_real_first_job: vacancy.is_real_first_job,
        audit_status: "verified",
        reasoning: vacancy.reasoning,
        has_discrepancy: vacancy.has_discrepancy,
        is_cached: true,
        audited_at: vacancy.last_verified_at || new Date().toISOString(),
      });
    }
  }, [vacancy?.fingerprint, cachedEvaluation]);

  const performAudit = () => {
    if (!vacancy) return;
    setIsAuditing(true);
    setAuditError(null);
    auditVacancy(
      vacancy.fingerprint,
      vacancy.external_links?.[0]?.direct_url,
      vacancy.description,
      vacancy.title,
      vacancy.company_name
    )
      .then((res) => {
        setAuditResult(res);
        vacancy.seniority_level = res.seniority_level;
        vacancy.years_required_min = res.years_required_min;
        vacancy.is_real_first_job = res.is_real_first_job;
        vacancy.audit_status = res.audit_status;
        vacancy.reasoning = res.reasoning;
        vacancy.has_discrepancy = res.has_discrepancy;
      })
      .catch((err) => {
        setAuditError(err instanceof Error ? err.message : "Error al auditar experiencia.");
      })
      .finally(() => {
        setIsAuditing(false);
      });
  };

  if (!vacancy) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-300 mb-3">
          <MapPin className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-600">Selecciona una vacante</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Haz clic en cualquier vacante del listado para ver sus detalles, métricas y evaluación con IA.
        </p>
      </div>
    );
  }

  const handleRunAiEvaluation = async () => {
    const candidateSkills =
      universalSkills && universalSkills.length > 0
        ? universalSkills
        : activeProfile?.skills || [];

    const targetRole =
      masterProfile?.personal_info?.headline ||
      activeProfile?.target_role ||
      "Desarrollador de Software Junior";

    if (candidateSkills.length === 0) {
      alert("Por favor configura tu Perfil Maestro con al menos una habilidad técnica para evaluar con IA.");
      return;
    }

    setIsLoadingAI(true);
    setAiError(null);

    const effectiveDescription =
      vacancy.description && vacancy.description.trim().length >= 10
        ? vacancy.description
        : `${vacancy.title} en ${vacancy.company_name} - ${vacancy.location_city || vacancy.location_state} (${vacancy.modality})`;

    const directUrl = vacancy.external_links?.[0]?.direct_url;

    try {
      const result = await evaluateVacancy({
        vacancy_fingerprint: vacancy.fingerprint,
        target_role: targetRole,
        candidate_skills: candidateSkills,
        job_description: effectiveDescription,
        direct_url: directUrl,
        desired_skills: vacancy.skills || [],
      });
      if (result.full_description && result.full_description.length > (vacancy.description?.length || 0)) {
        vacancy.description = result.full_description;
      }
      if (result.extracted_skills && result.extracted_skills.length > (vacancy.skills?.length || 0)) {
        vacancy.skills = result.extracted_skills;
      }
      setEvaluation(result);
      onEvaluationComplete?.(vacancy.fingerprint, result);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Error al ejecutar evaluación con IA.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Primary active application link
  const primaryLink = vacancy.external_links?.[0];
  const uniqueLinks = (vacancy.external_links || []).filter(
    (link, idx, arr) =>
      arr.findIndex(
        (l) => (l.portal_name || "").toLowerCase() === (link.portal_name || "").toLowerCase()
      ) === idx
  );

  const companyInitial = vacancy.company_name ? vacancy.company_name.charAt(0).toUpperCase() : "M";

  const isExpUnknown =
    vacancy.years_required_min == null ||
    (vacancy.years_required_min === 0 &&
      !vacancy.is_real_first_job &&
      vacancy.seniority_level === "junior" &&
      (vacancy.reasoning?.includes("sin años especificados") || vacancy.reasoning?.includes("requisitos abiertos")));

  return (
    <div
      data-testid="vacancy-detail-pane"
      className="bg-white border border-slate-200/80 rounded-2xl flex flex-col shadow-xs overflow-hidden max-h-[calc(100vh-6rem)]"
    >
      {/* Scrollable Content Container */}
      <div className="p-6 overflow-y-auto space-y-5 flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {/* Company Squircle Logo */}
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold text-slate-700 text-lg uppercase shadow-xs flex-shrink-0 select-none">
              {companyInitial}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {vacancy.company_name}
                </span>
                {isExpUnknown && (
                  <span
                    data-testid="detail-badge-exp-unknown"
                    className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200/80"
                    title="La vacante no especifica los años de experiencia requeridos"
                  >
                    [ EXP. NO ESPECIFICADA ]
                  </span>
                )}
                {vacancy.scam_report && <ScamBadge report={vacancy.scam_report} />}
              </div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {vacancy.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {vacancy.location_city ? `${vacancy.location_city}, ` : ""}
                  {vacancy.location_state}
                </span>
                {vacancy.published_at && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Publicada recientemente</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Close button (Mobile Sheet or explicit onClose) */}
          {(isMobileSheet || onClose) && (
            <button
              onClick={onClose}
              data-testid="detail-pane-close-btn"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Cerrar panel de detalle"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Pastel Metric Cards */}
        <PastelMetricGrid vacancy={vacancy} fitScore={evaluation?.fit_score ?? vacancy.heuristic_fit_score} />

        {/* 2-Tab Segmented Switch */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 w-fit">
          <button
            type="button"
            data-testid="tab-description-btn"
            onClick={() => setActiveTab("description")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "description"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Descripción
          </button>
          <button
            type="button"
            data-testid="tab-ai-eval-btn"
            onClick={() => setActiveTab("ai_eval")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "ai_eval"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Evaluación AI</span>
            {evaluation && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-slate-950 font-bold">
                {evaluation.fit_score}%
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Descripción */}
        {activeTab === "description" && (
          <div className="space-y-4 text-xs leading-relaxed">
            {/* Scam Report Alert */}
            {vacancy.scam_report && vacancy.scam_report.risk_level !== "safe" && (
              <div
                className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                  vacancy.scam_report.risk_level === "critical"
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}
              >
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <p className="font-bold text-xs uppercase mb-0.5">{vacancy.scam_report.badge_label}</p>
                  <p className="text-[11px] opacity-90">{vacancy.scam_report.explanation}</p>
                </div>
              </div>
            )}

            {/* Fake Junior Discrepancy Alert */}
            {(auditResult?.has_discrepancy || vacancy.has_discrepancy) && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-bold text-xs">Requisitos de experiencia discrepantes</span>
                  <p className="text-[11px] mt-0.5 opacity-90">
                    Esta vacante tiene título para principiantes/junior pero solicita 2 o más años de experiencia previa.
                  </p>
                </div>
              </div>
            )}

            {/* Required Skills */}
            {vacancy.skills && vacancy.skills.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Habilidades Requeridas
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {vacancy.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Structured Job Description */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Descripción del Puesto
              </h4>
              <JobDescriptionViewer structured={structuredDescription} />
            </div>

            {/* Tailor CV Callout in Description */}
            {onOpenTailorModal && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>¿Te interesa esta vacante?</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Genera un currículum personalizado con IA adaptado a los requisitos de este puesto.
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="desc-tailor-cv-btn"
                  onClick={() => onOpenTailorModal(vacancy)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0 active:scale-[0.99]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Adaptar mi CV</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Evaluación AI */}
        {activeTab === "ai_eval" && (
          <div className="space-y-4 text-xs leading-relaxed">
            {/* Auditing in-flight spinner */}
            {isAuditing && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-xs text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span>Auditando experiencia real con IA (agy)...</span>
              </div>
            )}

            {/* Audit Error Alert */}
            {auditError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between gap-2">
                <span className="truncate">{auditError}</span>
                <button
                  type="button"
                  onClick={performAudit}
                  className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold text-[10px] transition-colors flex-shrink-0"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Seniority Audit Section */}
            {(auditResult?.reasoning || vacancy.reasoning) && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700">
                      Auditoría de Seniority Real
                    </span>
                    {(auditResult?.audit_status || vacancy.audit_status) === "verified" ? (
                      <span className="text-[10px] text-purple-700 font-semibold px-2 py-0.5 rounded bg-purple-50 border border-purple-200">
                        Verificada por IA
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        Heurística Preliminar
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    {normalizeSeniorityDisplayText(auditResult?.reasoning || vacancy.reasoning)}
                  </p>
                </div>
              </div>
            )}

            {/* Run AI Evaluation Trigger or Results */}
            <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Análisis de Brechas & Afinidad Técnica
                  </h3>
                </div>
                {!evaluation && (
                  <button
                    onClick={handleRunAiEvaluation}
                    disabled={isLoadingAI}
                    data-testid="run-ai-eval-btn"
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                  >
                    {isLoadingAI ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Analizando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Evaluar con IA (agy)</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {aiError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
                  <span>{aiError}</span>
                  <button
                    onClick={handleRunAiEvaluation}
                    className="ml-2 px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded font-semibold text-[10px]"
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {evaluation ? (
                <div className="space-y-3 pt-2">
                  {/* Score & Tier Banner */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl font-black text-emerald-600">{evaluation.fit_score}%</span>
                      <span className="text-slate-600 text-xs font-medium">de afinidad técnica con tu perfil</span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                        evaluation.fit_tier === "high"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : evaluation.fit_tier === "moderate"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      Nivel {evaluation.fit_tier}
                    </span>
                  </div>

                  {/* Matched vs Missing Skills */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-semibold mb-1.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Habilidades que cumples ({evaluation.matched_skills.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {evaluation.matched_skills.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded text-[11px] bg-emerald-100/70 text-emerald-900 border border-emerald-300 font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200">
                      <div className="flex items-center gap-1.5 text-amber-800 font-semibold mb-1.5">
                        <X className="w-4 h-4 text-amber-600" />
                        <span>Brechas por cubrir ({evaluation.missing_skills.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {evaluation.missing_skills.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded text-[11px] bg-amber-100/70 text-amber-900 border border-amber-300 font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* AI Summary and Advice */}
                  <div className="space-y-2 text-slate-700 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                      <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">
                        Diagnóstico de Preparación
                      </h4>
                      <p className="leading-relaxed text-slate-600">
                        {normalizeSeniorityDisplayText(evaluation.role_readiness_summary)}
                      </p>
                    </div>
                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                      <h4 className="font-bold text-emerald-800 uppercase text-[10px] tracking-wider mb-1">
                        Consejo Accionable
                      </h4>
                      <p className="leading-relaxed text-emerald-950">
                        {normalizeSeniorityDisplayText(evaluation.actionable_advice)}
                      </p>
                    </div>
                  </div>

                  {/* Tailor CV Action */}
                  {onOpenTailorModal && (
                    <button
                      type="button"
                      data-testid="ai-eval-tailor-btn"
                      onClick={() => onOpenTailorModal(vacancy)}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.99]"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Adaptar mi CV a esta vacante</span>
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  {activeProfile || masterProfile
                    ? `Perfil configurado. Presiona "Evaluar con IA" para auditar compatibilidad y skill gaps.`
                    : "Configura tu Perfil Maestro para calcular tu puntaje de afinidad exacto y recomendaciones."}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="p-4 border-t border-slate-200/80 bg-slate-50/90 backdrop-blur-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mt-auto flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          {/* Full-width primary CTA */}
          {primaryLink && (
            <a
              href={primaryLink.direct_url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="primary-apply-btn"
              className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.99] whitespace-nowrap"
            >
              <span>Postularme ahora</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
            </a>
          )}

          {/* Persistent Tailor CV Action */}
          {onOpenTailorModal && (
            <button
              type="button"
              data-testid="tailor-cv-btn"
              onClick={() => onOpenTailorModal(vacancy)}
              className="flex-1 sm:flex-initial py-2.5 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/80 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.99] whitespace-nowrap"
              title="Adaptar mi CV a esta vacante"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Adaptar CV</span>
            </button>
          )}
        </div>

        {/* Secondary actions: Save & Mark Applied */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {onSave && (
            <button
              type="button"
              data-testid="save-vacancy-btn"
              onClick={() => onSave(vacancy)}
              title={isSaved ? "Guardado en tu pipeline" : "Guardar vacante (s)"}
              className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                isSaved
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-white border-slate-200/80 hover:bg-slate-100 text-slate-700"
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? "fill-amber-500 text-amber-500" : ""}`} />
              <span className="hidden sm:inline">{isSaved ? "Guardado" : "Guardar"}</span>
            </button>
          )}

          {onMarkApplied && (
            <button
              type="button"
              data-testid="mark-applied-btn"
              onClick={() => onMarkApplied(vacancy)}
              title={isApplied ? "Marcado como postulado" : "Marcar como postulado (a)"}
              className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                isApplied
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-white border-slate-200/80 hover:bg-slate-100 text-slate-700"
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${isApplied ? "text-emerald-600" : ""}`} />
              <span className="hidden sm:inline">{isApplied ? "Postulado" : "Ya postulé"}</span>
            </button>
          )}

          {/* Additional portal links if more than 1 */}
          {uniqueLinks.length > 1 && (
            <div className="flex items-center gap-1">
              {uniqueLinks.slice(1).map((link, idx) => (
                <a
                  key={idx}
                  href={link.direct_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-2 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-100 text-slate-600 text-xs font-medium uppercase transition-colors"
                  title={`Ver en ${link.portal_name}`}
                >
                  {link.portal_name}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
