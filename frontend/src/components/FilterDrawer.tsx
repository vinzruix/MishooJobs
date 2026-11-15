import { useMemo } from "react";
import { Clock, Filter, RotateCcw, Briefcase, EyeOff } from "lucide-react";
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
  hideApplied?: boolean;
  hiddenCount?: number;
  onToggleHideApplied?: () => void;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

export function FilterDrawer({
  filters,
  vacancies,
  now = new Date(),
  hideApplied = false,
  hiddenCount = 0,
  onToggleHideApplied,
  onChange,
  onReset,
}: FilterDrawerProps) {
  const modalities = [
    { id: "all", label: "Todas" },
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
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-xs space-y-3.5 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-600" />
          <span>Filtros</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 py-1 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors shadow-xs"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restablecer</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Modality Filter */}
        <div>
          <label className="block text-[11px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
            Modalidad de Trabajo
          </label>
          <div className="flex flex-wrap gap-1">
            {modalities.map((m) => {
              const active = filters.modality === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onChange({ ...filters, modality: m.id })}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all ${
                    active
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs font-semibold"
                      : "bg-slate-100 hover:bg-slate-200 border-transparent text-slate-700"
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
          <label className="block text-[11px] uppercase font-bold text-slate-700 tracking-wider mb-1.5 flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-slate-500" />
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
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1 ${
                    active
                      ? isFirstJobTier
                        ? "bg-emerald-700 border-emerald-700 text-white font-bold shadow-xs"
                        : "bg-slate-900 border-slate-900 text-white font-semibold shadow-xs"
                      : isFirstJobTier
                      ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800"
                      : "bg-slate-100 hover:bg-slate-200 border-transparent text-slate-700"
                  }`}
                >
                  <span>{t.label}</span>
                  {t.sublabel && <span className="opacity-70 text-[9px]">({t.sublabel})</span>}
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      active
                        ? "bg-slate-800 text-slate-200"
                        : "bg-slate-200/80 text-slate-600"
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
          <label className="block text-[11px] uppercase font-bold text-slate-700 tracking-wider mb-1.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
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
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1 ${
                    active
                      ? "bg-slate-900 border-slate-900 text-white font-semibold shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 border-transparent text-slate-700"
                  }`}
                >
                  <span>{tf.label}</span>
                  {count !== null && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        active
                          ? "bg-slate-800 text-slate-200"
                          : "bg-slate-200/80 text-slate-600"
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
          <label className="block text-[11px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
            Estado / Ubicación
          </label>
          <select
            value={filters.location}
            onChange={(e) => onChange({ ...filters, location: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200/80 text-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:border-slate-900 shadow-xs font-medium"
          >
            {mexicanStates.map((st) => (
              <option key={st.code} value={st.code}>
                {st.name}
              </option>
            ))}
          </select>
        </div>

        {/* Hide Applied Switch */}
        {onToggleHideApplied && (
          <div>
            <label className="block text-[11px] uppercase font-bold text-slate-700 tracking-wider mb-1.5 flex items-center gap-1">
              <EyeOff className="w-3 h-3 text-slate-500" />
              <span>Postuladas</span>
            </label>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2">
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-medium text-slate-700">Ocultar postuladas</span>
                {hiddenCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-600 font-bold">
                    {hiddenCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                role="switch"
                aria-label="Ocultar postuladas"
                aria-checked={hideApplied}
                onClick={onToggleHideApplied}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  hideApplied ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    hideApplied ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
