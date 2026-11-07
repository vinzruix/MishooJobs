import { Clock, Filter, RotateCcw } from "lucide-react";
import { calculateTimeframeCount, TIMEFRAMES, TimeframeConfig } from "../services/date_utils";
import type { JobVacancy, TimeframeId } from "../types/job";

export interface FilterState {
  modality: string;
  category: string;
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

  const categories = [
    { id: "all", label: "Todos los formatos" },
    { id: "becario", label: "Becario" },
    { id: "practicas", label: "Prácticas Profesionales" },
    { id: "residencias", label: "Residencias" },
    { id: "servicio_social", label: "Servicio Social" },
    { id: "dualidad", label: "Dualidad" },
    { id: "trainee", label: "Trainee" },
    { id: "junior", label: "Junior" },
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
    filters.category !== "all" ||
    (filters.location !== "México" && filters.location !== "") ||
    isDateFiltered;

  const handleTimeframeToggle = (tfId: TimeframeId) => {
    if (tfId === "all") {
      onChange({ ...filters, timeframes: ["all"] });
      return;
    }

    // Single-select behavior: if clicking the active timeframe, toggle it off back to "all"
    if (filters.timeframes.length === 1 && filters.timeframes[0] === tfId) {
      onChange({ ...filters, timeframes: ["all"] });
      return;
    }

    // Otherwise, select this specific timeframe exclusively
    onChange({ ...filters, timeframes: [tfId] });
  };

  const getCount = (tf: TimeframeConfig) => {
    if (!vacancies) return null;
    return calculateTimeframeCount(vacancies, tf, now);
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3 text-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-zinc-300 font-semibold uppercase tracking-wider text-[11px]">
          <Filter className="w-3.5 h-3.5 text-emerald-400" />
          <span>Filtros Mexicanos (Modalidad, Formato & Fecha)</span>
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

        {/* Academic Role Type */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">
            Formato Académico / Nivel
          </label>
          <div className="flex flex-wrap gap-1">
            {categories.map((c) => {
              const active = filters.category === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => onChange({ ...filters, category: c.id })}
                  className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                    active
                      ? "bg-emerald-950 border-emerald-600 text-emerald-300"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Publication Date Filter */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>Fecha de Publicación</span>
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
                  className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                    active
                      ? "bg-emerald-950 border-emerald-600 text-emerald-300"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {tf.label}
                  {count !== null && (
                    <span className="ml-1 opacity-75 text-[10px]">({count})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mexican Region / State */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">
            Región en México
          </label>
          <select
            value={filters.location}
            onChange={(e) => onChange({ ...filters, location: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
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
