import { useMemo } from "react";
import { Clock, Filter, RotateCcw, Briefcase } from "lucide-react";
import { calculateTimeframeCount, filterVacanciesByTimeframes, TIMEFRAMES, TimeframeConfig } from "../services/date_utils";
import type { JobVacancy, SeniorityFilter, TimeframeId } from "../types/job";

export interface FilterState {
  modality: string;
  seniority: SeniorityFilter;
  location: string;
  timeframes: TimeframeId[];
}

interface FilterDrawerProps {
  filters: FilterState;
  vacancies?: JobVacancy[];
  now?: Date;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

export function FilterDrawer({
  filters,
  vacancies,
  now = new Date(),
  onChange,
  onReset,
}: FilterDrawerProps) {
  const modalities = [
    { id: "all", label: "Todas las modalidades" },
    { id: "remoto", label: "Remoto" },
    { id: "hibrido", label: "Híbrido" },
    { id: "presencial", label: "Presencial" },
  ];

  const seniorityTiers: { id: SeniorityFilter; label: string; sublabel?: string }[] = [
    { id: "all", label: "Todos los niveles" },
    { id: "primer_empleo", label: "Primer Empleo Real", sublabel: "0 Exp" },
    { id: "pasantia", label: "Pasantía / Prácticas", sublabel: "Estudiantes" },
    { id: "junior", label: "Junior", sublabel: "1–2 años" },
    { id: "mid", label: "Mid", sublabel: "2–4 años" },
    { id: "senior", label: "Senior", sublabel: "5+ años" },
  ];

  const mexicanStates = [
    { code: "México", name: "Toda la República (México)" },
    { code: "CDMX", name: "Ciudad de México (CDMX)" },
    { code: "JAL", name: "Jalisco (Guadalajara / Zapopan)" },
    { code: "NL", name: "Nuevo León (Monterrey / San Pedro)" },
    { code: "QRO", name: "Querétaro" },
    { code: "PUE", name: "Puebla" },
    { code: "GTO", name: "Guanajuato (León / Silao)" },
    { code: "YUC", name: "Yucatán (Mérida)" },
    { code: "BC", name: "Baja California (Tijuana / Mexicali)" },
    { code: "REMOTO", name: "100% Remoto (Home Office)" },
  ];

  const isDateFiltered =
    filters.timeframes.length > 0 && !filters.timeframes.includes("all");

  const hasActiveFilters =
    filters.modality !== "all" ||
    filters.seniority !== "all" ||
    (filters.location !== "México" && filters.location !== "") ||
    isDateFiltered;

  const handleSeniorityToggle = (tierId: SeniorityFilter) => {
    if (tierId === "all" || filters.seniority === tierId) {
      onChange({ ...filters, seniority: "all" });
    } else {
      onChange({ ...filters, seniority: tierId });
    }
  };

  // Contextual vacancies for seniority counts: scoped to active timeframe filter
  const timeframeFilteredVacancies = useMemo(() => {
    if (!vacancies) return [];
    if (filters.timeframes.includes("all") || filters.timeframes.length === 0) return vacancies;
    return filterVacanciesByTimeframes(vacancies, filters.timeframes, now);
  }, [vacancies, filters.timeframes, now]);

  const getSeniorityCount = (tierId: SeniorityFilter): number => {
    if (!vacancies) return 0;
    if (tierId === "all") return timeframeFilteredVacancies.length;
    return timeframeFilteredVacancies.filter((v) => v.seniority_level === tierId).length;
  };

  const handleTimeframeToggle = (tfId: TimeframeId) => {
    if (tfId === "all") {
      onChange({ ...filters, timeframes: ["all"] });
      return;
    }

    if (filters.timeframes.length === 1 && filters.timeframes[0] === tfId) {
      onChange({ ...filters, timeframes: ["all"] });
      return;
    }

    onChange({ ...filters, timeframes: [tfId] });
  };

  // Contextual vacancies for timeframe counts: scoped to active seniority filter
  const seniorityFilteredVacancies = useMemo(() => {
    if (!vacancies) return [];
    if (filters.seniority === "all") return vacancies;
    return vacancies.filter((v) => v.seniority_level === filters.seniority);
  }, [vacancies, filters.seniority]);

  const getCount = (tf: TimeframeConfig) => {
    if (!vacancies) return null;
    return calculateTimeframeCount(seniorityFilteredVacancies, tf, now);
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3 text-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-zinc-300 font-semibold uppercase tracking-wider text-[11px]">
          <Filter className="w-3.5 h-3.5 text-emerald-400" />
          <span>Filtros Mexicanos (Nivel de Experiencia, Modalidad & Fecha)</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 py-0.5 px-2 rounded bg-zinc-800"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restablecer</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Modality Filter */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">
            Modalidad de Trabajo
          </label>
          <div className="flex flex-wrap gap-1">
            {modalities.map((m) => {
              const active = filters.modality === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onChange({ ...filters, modality: m.id })}
                  className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                    active
                      ? "bg-emerald-950 border-emerald-600 text-emerald-300"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5-Tier Seniority Level Filter with Live Counters */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5 flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-emerald-400" />
            <span>Nivel de Experiencia</span>
          </label>
          <div className="flex flex-wrap gap-1">
            {seniorityTiers.map((t) => {
              const active = filters.seniority === t.id;
              const count = getSeniorityCount(t.id);
              const isFirstJobTier = t.id === "primer_empleo";
              return (
                <button
                  key={t.id}
                  onClick={() => handleSeniorityToggle(t.id)}
                  className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors flex items-center gap-1 ${
                    active
                      ? isFirstJobTier
                        ? "bg-emerald-950 border-emerald-500 text-emerald-300 font-bold shadow-xs shadow-emerald-500/20"
                        : "bg-emerald-950 border-emerald-600 text-emerald-300 font-semibold"
                      : isFirstJobTier
                      ? "bg-zinc-950 border-emerald-900/60 text-emerald-400 hover:border-emerald-600/70"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  <span>{t.label}</span>
                  {t.sublabel && <span className="opacity-70 text-[9px]">({t.sublabel})</span>}
                  <span
                    className={`px-1 py-0.2 rounded text-[10px] font-mono ${
                      active
                        ? "bg-emerald-900/80 text-emerald-200"
                        : "bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Publication Date Filter */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>Publicación</span>
          </label>
          <div className="flex flex-wrap gap-1">
            {TIMEFRAMES.map((tf) => {
              const active = filters.timeframes.includes(tf.id);
              const count = getCount(tf);
              return (
                <button
                  key={tf.id}
                  onClick={() => handleTimeframeToggle(tf.id)}
                  title={tf.description}
                  className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors flex items-center gap-1 ${
                    active
                      ? "bg-emerald-950 border-emerald-600 text-emerald-300 font-semibold"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  <span>{tf.label}</span>
                  {count !== null && (
                    <span
                      className={`px-1 py-0.2 rounded text-[10px] font-mono ${
                        active
                          ? "bg-emerald-900/80 text-emerald-200"
                          : "bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Location Dropdown */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">
            Estado / Ubicación
          </label>
          <select
            value={filters.location}
            onChange={(e) => onChange({ ...filters, location: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded p-2 focus:outline-none focus:border-emerald-500"
          >
            {mexicanStates.map((st) => (
              <option key={st.code} value={st.code}>
                {st.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
