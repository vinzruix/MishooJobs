import { Briefcase, Clock, RotateCcw, Sparkles } from "lucide-react";
import type { JobVacancy, SeniorityFilter, SortOrder, TimeframeId } from "../types/job";
import type { ApplicationStatus } from "../types/application";
import { VacancyCard } from "./VacancyCard";

interface VacancyListProps {
  vacancies: JobVacancy[];
  isSearching: boolean;
  isDateFiltered?: boolean;
  activeSeniority?: SeniorityFilter;
  seniorityCounts?: Record<SeniorityFilter, number>;
  sortOrder?: SortOrder;
  now?: Date;
  scoresByFingerprint?: Record<string, number>;
  applicationStatuses?: Record<string, ApplicationStatus>;
  onInspect: (vacancy: JobVacancy) => void;
  onSave?: (vacancy: JobVacancy) => void;
  onMarkApplied?: (vacancy: JobVacancy) => void;
  onDiscard?: (vacancy: JobVacancy) => void;
  onSortChange?: (order: SortOrder) => void;
  onClearDateFilter?: () => void;
  onSelectTimeframe?: (timeframe: TimeframeId) => void;
  onSelectSeniority?: (seniority: SeniorityFilter) => void;
  onClearSeniorityFilter?: () => void;
}

export function VacancyList({
  vacancies,
  isSearching,
  isDateFiltered = false,
  activeSeniority = "all",
  seniorityCounts,
  sortOrder = "recent",
  now,
  scoresByFingerprint = {},
  applicationStatuses = {},
  onInspect,
  onSave,
  onMarkApplied,
  onDiscard,
  onSortChange,
  onClearDateFilter,
  onSelectTimeframe,
  onSelectSeniority,
  onClearSeniorityFilter,
}: VacancyListProps) {
  const isSeniorityFiltered = activeSeniority !== "all";

  if (vacancies.length === 0) {
    if (isSearching && !isDateFiltered && !isSeniorityFiltered) {
      return (
        <div className="py-16 text-center flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-lg">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-3" />
          <p className="text-sm font-semibold text-zinc-300">Consultando bolsas de empleo mexicanas en vivo...</p>
          <p className="text-xs text-zinc-500 mt-1">Verificando enlaces directos vía HTTP HEAD en tiempo real.</p>
        </div>
      );
    }

    if (isSeniorityFiltered) {
      return (
        <div className="py-16 text-center flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-lg p-6">
          <Briefcase className="w-10 h-10 text-zinc-600 mb-2" />
          <p className="text-sm font-semibold text-zinc-300">
            No se encontraron vacantes para el nivel seleccionado en esta búsqueda
          </p>
          <p className="text-xs text-zinc-500 mt-1 max-w-md">
            Prueba ampliando tu búsqueda a{" "}
            <button
              onClick={() => onSelectSeniority?.("pasantia")}
              className="text-cyan-400 underline hover:text-cyan-300 font-medium"
            >
              Pasantía / Prácticas
            </button>{" "}
            o{" "}
            <button
              onClick={() => onSelectSeniority?.("junior")}
              className="text-violet-400 underline hover:text-violet-300 font-medium"
            >
              Junior
            </button>{" "}
            para descubrir más opciones.
          </p>
          {onClearSeniorityFilter && (
            <button
              onClick={onClearSeniorityFilter}
              className="mt-4 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
              <span>Limpiar filtro de experiencia</span>
            </button>
          )}
        </div>
      );
    }

    if (isDateFiltered) {
      return (
        <div className="py-16 text-center flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-lg p-6">
          <Clock className="w-10 h-10 text-zinc-600 mb-2" />
          <p className="text-sm font-semibold text-zinc-300">
            No se encontraron vacantes para este marco de tiempo
          </p>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            Prueba ampliando tu filtro a{" "}
            <button
              onClick={() => onSelectTimeframe?.("7d")}
              className="text-emerald-400 underline hover:text-emerald-300 font-medium"
            >
              Última semana
            </button>{" "}
            para descubrir más oportunidades.
          </p>
          {onClearDateFilter && (
            <button
              onClick={onClearDateFilter}
              className="mt-4 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
              <span>Limpiar filtro de fecha</span>
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="py-16 text-center flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-lg text-zinc-500">
        <Briefcase className="w-10 h-10 text-zinc-600 mb-2" />
        <p className="text-sm font-semibold text-zinc-400">No se encontraron vacantes para este criterio</p>
        <p className="text-xs text-zinc-600 mt-1">Prueba ampliando tu búsqueda o seleccionando otra ubicación en México.</p>
      </div>
    );
  }

  const quickSeniorityOptions: { id: SeniorityFilter; label: string; isHighlight?: boolean }[] = [
    { id: "all", label: "Todos" },
    { id: "primer_empleo", label: "Primer Empleo Real (0 Exp)", isHighlight: true },
    { id: "pasantia", label: "Pasantía / Prácticas" },
    { id: "junior", label: "Junior (1-2 años)" },
    { id: "mid", label: "Mid (2-4 años)" },
    { id: "senior", label: "Senior (5+ años)" },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Horizontal quick filter pills with real-time counters */}
      {onSelectSeniority && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {quickSeniorityOptions.map((opt) => {
            const active = activeSeniority === opt.id;
            const count = seniorityCounts ? seniorityCounts[opt.id] ?? 0 : undefined;
            return (
              <button
                key={opt.id}
                onClick={() => onSelectSeniority(active && opt.id !== "all" ? "all" : opt.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  active
                    ? opt.isHighlight
                      ? "bg-emerald-950 border-emerald-500 text-emerald-300 font-bold shadow-xs shadow-emerald-500/30"
                      : "bg-emerald-950 border-emerald-600 text-emerald-300 font-semibold"
                    : opt.isHighlight
                    ? "bg-zinc-900 border-emerald-800/60 text-emerald-400 hover:border-emerald-600/80"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                {opt.isHighlight && <Sparkles className="w-3 h-3 text-emerald-400" />}
                <span>{opt.label}</span>
                {count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      active
                        ? "bg-emerald-900/90 text-emerald-200"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Header toolbar with count & sorting dropdown */}
      <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 px-1 gap-2">
        <span>
          Mostrando <strong className="text-emerald-400 font-semibold">{vacancies.length}</strong> vacantes verificadas en vivo
        </span>

        {onSortChange && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 text-[11px]">Ordenar por:</span>
            <select
              aria-label="Ordenar resultados"
              value={sortOrder}
              onChange={(e) => onSortChange(e.target.value as SortOrder)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-emerald-500"
            >
              <option value="recent">Más recientes primero</option>
              <option value="compatibility">Mayor compatibilidad (Fit Score)</option>
              <option value="relevance">Relevancia por defecto</option>
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {vacancies.map((vacancy) => (
          <VacancyCard
            key={vacancy.fingerprint}
            vacancy={vacancy}
            now={now}
            fitScore={scoresByFingerprint[vacancy.fingerprint]}
            applicationStatus={applicationStatuses[vacancy.fingerprint]}
            onInspect={onInspect}
            onSave={onSave}
            onMarkApplied={onMarkApplied}
            onDiscard={onDiscard}
          />
        ))}
      </div>
    </div>
  );
}
