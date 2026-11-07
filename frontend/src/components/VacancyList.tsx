import { Briefcase, Clock, RotateCcw } from "lucide-react";
import type { JobVacancy, SortOrder, TimeframeId } from "../types/job";
import type { ApplicationStatus } from "../types/application";
import { VacancyCard } from "./VacancyCard";

interface VacancyListProps {
  vacancies: JobVacancy[];
  isSearching: boolean;
  isDateFiltered?: boolean;
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
}

export function VacancyList({
  vacancies,
  isSearching,
  isDateFiltered = false,
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
}: VacancyListProps) {
  if (vacancies.length === 0) {
    if (isSearching && !isDateFiltered) {
      return (
        <div className="py-16 text-center flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-lg">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-3" />
          <p className="text-sm font-semibold text-zinc-300">Consultando bolsas de empleo mexicanas en vivo...</p>
          <p className="text-xs text-zinc-500 mt-1">Verificando enlaces directos vía HTTP HEAD en tiempo real.</p>
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

  return (
    <div className="flex flex-col gap-3">
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
