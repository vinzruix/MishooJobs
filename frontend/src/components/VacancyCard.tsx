import { useMemo } from "react";
import { ExternalLink as ExtLinkIcon, MapPin, DollarSign, Bookmark, CheckCircle, Eye, EyeOff, Clock } from "lucide-react";
import type { JobVacancy } from "../types/job";
import type { ApplicationStatus } from "../types/application";
import { formatMexicanRelativeTime, isNewVacancy } from "../services/date_utils";
import { normalizeSkill } from "../services/heuristic_scorer";
import { ScamBadge } from "./ScamBadge";

interface VacancyCardProps {
  vacancy: JobVacancy;
  fitScore?: number | null;
  candidateSkills?: string[];
  applicationStatus?: ApplicationStatus;
  now?: Date;
  onInspect: (vacancy: JobVacancy) => void;
  onSave?: (vacancy: JobVacancy) => void;
  onMarkApplied?: (vacancy: JobVacancy) => void;
  onDiscard?: (vacancy: JobVacancy) => void;
}

export function VacancyCard({
  vacancy,
  fitScore,
  candidateSkills,
  applicationStatus,
  now = new Date(),
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

  // Strictly display one primary platform link on the card to prevent multi-button clutter and overflow
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

  const getModalityColor = (modality: string) => {
    switch (modality.toLowerCase()) {
      case "remoto":
        return "bg-purple-950/50 text-purple-300 border-purple-800/60";
      case "hibrido":
        return "bg-cyan-950/50 text-cyan-300 border-cyan-800/60";
      default:
        return "bg-zinc-800/60 text-zinc-300 border-zinc-700/60";
    }
  };

  return (
    <div className="group relative bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-lg p-4 transition-all duration-200 flex flex-col justify-between hover:shadow-md hover:shadow-black/40">
      <div>
        {/* Top Badges & Status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${getModalityColor(
                vacancy.modality
              )}`}
            >
              {vacancy.modality}
            </span>
            {vacancy.seniority_level === "primer_empleo" ? (
              <span
                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 flex items-center gap-1"
                title={vacancy.audit_status === "verified" ? "✓ Auditado 0 Experiencia" : "0 Exp Preliminar — Requiere auditoría"}
              >
                {vacancy.audit_status === "verified" ? (
                  <span>[ ✓ 0 EXP ]</span>
                ) : (
                  <span>[ 0 EXP ]</span>
                )}
              </span>
            ) : vacancy.seniority_level === "pasantia" ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-950/70 text-cyan-300 border border-cyan-500/40">
                [ PASANTÍA ]
              </span>
            ) : vacancy.seniority_level === "mid" ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-950/70 text-amber-300 border border-amber-500/40">
                [ MID ]
              </span>
            ) : vacancy.seniority_level === "senior" ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-950/70 text-rose-300 border border-rose-500/40">
                [ SR ]
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-violet-950/70 text-violet-300 border border-violet-500/40">
                [ JR ]
              </span>
            )}

            {vacancy.has_discrepancy && (
              <span
                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/50"
                title={vacancy.reasoning || "Requisitos exceden nivel junior"}
              >
                [ REQ. DISCREPANTES ]
              </span>
            )}
            {isNew && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-600/80 animate-pulse">
                Nueva
              </span>
            )}
            {vacancy.scam_report && <ScamBadge report={vacancy.scam_report} />}
          </div>

          {/* Fit Score Badge */}
          {fitScore !== undefined && fitScore !== null && (
            <div
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex-shrink-0 whitespace-nowrap ${
                fitScore >= 80
                  ? "bg-emerald-950/70 border-emerald-600 text-emerald-300"
                  : fitScore >= 50
                  ? "bg-amber-950/70 border-amber-600 text-amber-300"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400"
              }`}
              title={`${fitScore}% de compatibilidad con tu perfil`}
            >
              {fitScore}% Match
            </div>
          )}
        </div>

        {/* Job Title & Company */}
        <h3
          onClick={() => onInspect(vacancy)}
          className="text-sm sm:text-base font-semibold text-zinc-100 hover:text-emerald-400 cursor-pointer line-clamp-2 transition-colors mb-1"
        >
          {vacancy.title}
        </h3>
        <p className="text-xs text-zinc-400 font-medium mb-3">{vacancy.company_name}</p>

        {/* Location & Salary */}
        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-zinc-400 mb-3">
          <div className="flex items-center gap-1 text-zinc-300">
            <MapPin className="w-3.5 h-3.5 text-zinc-500" />
            <span>
              {vacancy.location_city ? `${vacancy.location_city}, ` : ""}
              {vacancy.location_state}
            </span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 font-medium">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span>{formatSalary()}</span>
          </div>
          <div className="flex items-center gap-1 text-zinc-400 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>{relativeText}</span>
          </div>
        </div>

        {/* Skills Chips */}
        {vacancy.skills && vacancy.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {vacancy.skills.slice(0, 6).map((skill) => (
              <span
                key={skill}
                className={`px-1.5 py-0.5 rounded text-[10px] border ${
                  matchedSkillsSet.has(skill)
                    ? "bg-emerald-950/70 text-emerald-300 border-emerald-800"
                    : "bg-zinc-800/80 text-zinc-300 border-zinc-700/50"
                }`}
              >
                {skill}
              </span>
            ))}
            {vacancy.skills.length > 6 && (
              <span className="px-1 py-0.5 text-[10px] text-zinc-500">
                +{vacancy.skills.length - 6} más
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Verified Direct Links & Actions */}
      <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
        {/* Direct Link: strictly one platform on the card */}
        <div className="flex items-center gap-1.5 min-w-0">
          {primaryPlatformLink && (
            <a
              href={primaryPlatformLink.direct_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-zinc-300 hover:text-emerald-400 bg-zinc-800/60 hover:bg-zinc-800 px-2 py-1 rounded border border-zinc-700/50 transition-colors"
              title={`Enlace directo a ${primaryPlatformLink.portal_name}`}
            >
              <ExtLinkIcon className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span className="capitalize text-[11px] font-medium">{primaryPlatformLink.portal_name}</span>
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onSave && (
            <button
              onClick={() => onSave(vacancy)}
              className={`p-1.5 rounded border transition-colors ${
                applicationStatus === "saved"
                  ? "bg-amber-950 border-amber-600 text-amber-300"
                  : "border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200"
              }`}
              title="Guardar vacante en pipeline local"
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
          )}

          {onMarkApplied && (
            <button
              onClick={() => onMarkApplied(vacancy)}
              className={`p-1.5 rounded border transition-colors ${
                applicationStatus === "applied"
                  ? "bg-emerald-950 border-emerald-600 text-emerald-300"
                  : "border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200"
              }`}
              title="Marcar como postulado"
            >
              <CheckCircle className="w-3.5 h-3.5" />
            </button>
          )}

          {onDiscard && (
            <button
              onClick={() => onDiscard(vacancy)}
              className="p-1.5 rounded border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Descartar de futuros resultados"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onInspect(vacancy)}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 flex items-center gap-1 transition-colors"
          >
            <Eye className="w-3 h-3 text-zinc-400" />
            <span>Detalles</span>
          </button>
        </div>
      </div>
    </div>
  );
}
