import { useMemo } from "react";
import { ExternalLink as ExtLinkIcon, MapPin, DollarSign, Bookmark, CheckCircle, Eye, EyeOff, Clock, Briefcase } from "lucide-react";
import type { JobVacancy } from "../types/job";
import type { ApplicationStatus } from "../types/application";
import { formatMexicanRelativeTime, isNewVacancy, formatExperienceRequired } from "../services/date_utils";
import { normalizeSkill } from "../services/heuristic_scorer";
import { ScamBadge } from "./ScamBadge";

export interface VacancyCardProps {
  vacancy: JobVacancy;
  isSelected?: boolean;
  fitScore?: number | null;
  candidateSkills?: string[];
  applicationStatus?: ApplicationStatus;
  now?: Date;
  onSelect?: (vacancy: JobVacancy) => void;
  onInspect: (vacancy: JobVacancy) => void;
  onSave?: (vacancy: JobVacancy) => void;
  onMarkApplied?: (vacancy: JobVacancy) => void;
  onDiscard?: (vacancy: JobVacancy) => void;
}

export function VacancyCard({
  vacancy,
  isSelected = false,
  fitScore,
  candidateSkills,
  applicationStatus,
  now = new Date(),
  onSelect,
  onInspect,
  onSave,
  onMarkApplied,
  onDiscard,
}: VacancyCardProps) {
  const relativeText = formatMexicanRelativeTime(vacancy.published_at, now);
  const isNew = isNewVacancy(vacancy.published_at, now);

  const matchedSkillsSet = useMemo(() => {
    if (!candidateSkills || candidateSkills.length === 0) return new Set<string>();
    const candNorm = new Set(candidateSkills.map(normalizeSkill));
    const matched = new Set<string>();
    for (const s of vacancy.skills || []) {
      const sNorm = normalizeSkill(s);
      for (const c of candNorm) {
        if (sNorm === c || (sNorm.length >= 3 && c.length >= 3 && (sNorm.includes(c) || c.includes(sNorm)))) {
          matched.add(s);
          break;
        }
      }
    }
    return matched;
  }, [candidateSkills, vacancy.skills]);

  // Strictly display one primary platform link on the card
  const primaryPlatformLink = useMemo(() => {
    return (vacancy.external_links || []).find((link) => link.direct_url) || null;
  }, [vacancy.external_links]);

  const formatSalary = () => {
    if (!vacancy.salary_min && !vacancy.salary_max) {
      return "Sueldo no publicado / A convenir";
    }
    const period = vacancy.salary_period ? `/${vacancy.salary_period}` : "/mes";
    if (vacancy.salary_min && vacancy.salary_max && vacancy.salary_min !== vacancy.salary_max) {
      return `$${vacancy.salary_min.toLocaleString("es-MX")} - $${vacancy.salary_max.toLocaleString("es-MX")} ${vacancy.currency} ${period}`;
    }
    const amount = vacancy.salary_min || vacancy.salary_max;
    return `$${amount?.toLocaleString("es-MX")} ${vacancy.currency} ${period}`;
  };

  const companyInitial = vacancy.company_name ? vacancy.company_name.charAt(0).toUpperCase() : "M";

  const handleClick = () => {
    if (onSelect) {
      onSelect(vacancy);
    }
    onInspect(vacancy);
  };

  return (
    <div
      data-testid="vacancy-card"
      data-vacancy-fingerprint={vacancy.fingerprint}
      onClick={handleClick}
      className={`group relative rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between cursor-pointer ${
        isSelected
          ? "bg-white border-2 border-slate-900 ring-2 ring-slate-900/10 shadow-sm"
          : "bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
      }`}
    >
      <div>
        {/* Top Row: Squircle Logo, Company & Relative Date, and Badges */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Company Squircle Logo */}
            <div
              data-testid="company-squircle"
              className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold text-slate-700 text-sm uppercase shadow-xs flex-shrink-0 select-none"
            >
              {companyInitial}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                {vacancy.company_name}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{relativeText}</span>
                {isNew && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                    Nueva
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Badges: Seniority & Fit Score */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {fitScore !== undefined && fitScore !== null && (
              <div
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex-shrink-0 whitespace-nowrap ${
                  fitScore >= 80
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : fitScore >= 50
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-slate-100 border-slate-200 text-slate-600"
                }`}
                title={`${fitScore}% de compatibilidad con tu perfil`}
              >
                {fitScore}% Match
              </div>
            )}

            {vacancy.seniority_level === "primer_empleo" ? (
              <span
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200"
                title={vacancy.audit_status === "verified" ? "✓ Auditado 0 Experiencia" : "0 Exp Preliminar"}
              >
                {vacancy.audit_status === "verified" ? "[ ✓ 0 EXP ]" : "[ 0 EXP ]"}
              </span>
            ) : vacancy.seniority_level === "pasantia" ? (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200">
                [ PASANTÍA ]
              </span>
            ) : vacancy.seniority_level === "mid" ? (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                [ MID ]
              </span>
            ) : vacancy.seniority_level === "senior" ? (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200">
                [ SR ]
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200">
                [ JR ]
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-slate-700 leading-snug line-clamp-2 transition-colors mb-2">
          {vacancy.title}
        </h3>

        {/* Discrepancy & Scam Warnings */}
        {(vacancy.has_discrepancy || vacancy.scam_report) && (
          <div className="flex flex-wrap gap-1 mb-2">
            {vacancy.has_discrepancy && (
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200"
                title={vacancy.reasoning || "Requisitos exceden nivel junior"}
              >
                [ REQ. DISCREPANTES ]
              </span>
            )}
            {vacancy.scam_report && <ScamBadge report={vacancy.scam_report} />}
          </div>
        )}

        {/* Metadata Row: Modality, Location, Salary, Exp */}
        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-2.5 text-xs text-slate-500 mb-3">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200/60">
            {vacancy.modality}
          </span>
          <div className="flex items-center gap-1 text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {vacancy.location_city ? `${vacancy.location_city}, ` : ""}
              {vacancy.location_state}
            </span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/60">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>{formatSalary()}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-600 font-medium text-xs">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatExperienceRequired(vacancy.years_required_min)}</span>
          </div>
        </div>

        {/* Skills Chips */}
        {vacancy.skills && vacancy.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {vacancy.skills.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                  matchedSkillsSet.has(skill)
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold"
                    : "bg-slate-50 text-slate-600 border-slate-200/80"
                }`}
              >
                {skill}
              </span>
            ))}
            {vacancy.skills.length > 5 && (
              <span className="px-1.5 py-0.5 text-[11px] text-slate-400 font-medium">
                +{vacancy.skills.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Verified Direct Links & Actions */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Direct Link: strictly one platform on the card */}
        <div className="flex items-center gap-1.5 min-w-0">
          {primaryPlatformLink && (
            <a
              href={primaryPlatformLink.direct_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg border border-slate-200/60 transition-colors"
              title={`Enlace directo a ${primaryPlatformLink.portal_name}`}
            >
              <ExtLinkIcon className="w-3 h-3 text-slate-500 flex-shrink-0" />
              <span className="capitalize text-[11px] font-medium">{primaryPlatformLink.portal_name}</span>
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {onSave && (
            <button
              onClick={() => onSave(vacancy)}
              className={`p-1.5 rounded-lg border transition-colors ${
                applicationStatus === "saved"
                  ? "bg-amber-50 border-amber-300 text-amber-700"
                  : "border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-700"
              }`}
              title="Guardar vacante en pipeline local"
            >
              <Bookmark className={`w-3.5 h-3.5 ${applicationStatus === "saved" ? "fill-amber-500 text-amber-500" : ""}`} />
            </button>
          )}

          {onMarkApplied && (
            <button
              onClick={() => onMarkApplied(vacancy)}
              className={`p-1.5 rounded-lg border transition-colors ${
                applicationStatus === "applied"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-700"
              }`}
              title="Marcar como postulado"
            >
              <CheckCircle className={`w-3.5 h-3.5 ${applicationStatus === "applied" ? "text-emerald-600" : ""}`} />
            </button>
          )}

          {onDiscard && (
            <button
              onClick={() => onDiscard(vacancy)}
              className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-600 transition-colors"
              title="Descartar de futuros resultados"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onInspect(vacancy)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-700 flex items-center gap-1 transition-colors"
          >
            <Eye className="w-3 h-3 text-slate-500" />
            <span>Detalles</span>
          </button>
        </div>
      </div>
    </div>
  );
}
