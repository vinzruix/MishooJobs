import { Briefcase, Clock, RotateCcw, Sparkles, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import type { JobVacancy, SeniorityFilter, SortOrder, TimeframeId } from "../types/job";
import type { ApplicationStatus } from "../types/application";
import { VacancyCard } from "./VacancyCard";

export interface VacancyListProps {
  vacancies: JobVacancy[];
  selectedFingerprint?: string | null;
  isSearching: boolean;
  isDateFiltered?: boolean;
  activeSeniority?: SeniorityFilter;
  seniorityCounts?: Record<SeniorityFilter, number>;
  sortOrder?: SortOrder;
  now?: Date;
  scoresByFingerprint?: Record<string, number>;
  candidateSkills?: string[];
  applicationStatuses?: Record<string, ApplicationStatus>;
  hideApplied?: boolean;
  hiddenCount?: number;
  totalUnignoredCount?: number;
  onToggleHideApplied?: () => void;
  onSelect?: (vacancy: JobVacancy) => void;
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
  selectedFingerprint,
  isSearching,
  isDateFiltered = false,
  activeSeniority = "all",
  seniorityCounts,
  sortOrder = "recent",
  now,
  scoresByFingerprint = {},
  candidateSkills,
  applicationStatuses = {},
  hideApplied = false,
  hiddenCount = 0,
  totalUnignoredCount,
  onToggleHideApplied,
  onSelect,
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

  // Shimmering skeleton cards for in-flight search
  const renderSkeletons = () => (
    <div data-testid="vacancy-skeletons" className="flex flex-col gap-3.5 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 bg-slate-100 rounded w-1/3" />
              <div className="h-2.5 bg-slate-100 rounded w-1/4" />
            </div>
          </div>
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="flex gap-2">
            <div className="h-5 bg-emerald-50 border border-emerald-100 rounded-md w-16" />
            <div className="h-5 bg-sky-50 border border-sky-100 rounded-md w-16" />
            <div className="h-5 bg-amber-50 border border-amber-100 rounded-md w-20" />
          </div>
        </div>
      ))}
    </div>
  );

  if (vacancies.length === 0) {
    if (isSearching && !isDateFiltered && !isSeniorityFiltered) {
      return (
        <div className="space-y-4">
          <div className="py-6 text-center text-slate-500 text-xs">
            Buscando vacantes...
          </div>
          {renderSkeletons()}
        </div>
      );
    }

    if (hideApplied && hiddenCount > 0 && (totalUnignoredCount === undefined || totalUnignoredCount > 0)) {
      return (
        <div className="py-16 text-center flex flex-col items-center justify-center border border-dashed border-emerald-200 bg-emerald-50/40 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            ¡Te has postulado a todas las vacantes encontradas para este criterio!
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Has completado la postulación de las {hiddenCount}{" "}
            {hiddenCount === 1 ? "vacante coincidente" : "vacantes coincidentes"}. Puedes
            revisar tu progreso en la pestaña de Postulaciones o verlas nuevamente aquí.
          </p>
          {onToggleHideApplied && (
            <button
              type="button"
              onClick={onToggleHideApplied}
              className="mt-4 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-emerald-700 text-xs font-semibold border border-emerald-200 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mostrar vacantes postuladas ({hiddenCount})</span>
            </button>
          )}
        </div>
      );
    }

    if (isSeniorityFiltered) {
      return (
        <div className="py-16 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 bg-white rounded-2xl p-6">
          <Briefcase className="w-10 h-10 text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-700">
            No se encontraron vacantes para el nivel seleccionado en esta búsqueda
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Prueba ampliando tu búsqueda a{" "}
            <button
              onClick={() => onSelectSeniority?.("pasantia")}
              className="text-sky-600 underline hover:text-sky-700 font-medium"
            >
              Pasantía / Prácticas
            </button>{" "}
            o{" "}
            <button
              onClick={() => onSelectSeniority?.("junior")}
              className="text-purple-600 underline hover:text-purple-700 font-medium"
            >
              Junior
            </button>{" "}
            para descubrir más opciones.
          </p>
          {onClearSeniorityFilter && (
            <button
              onClick={onClearSeniorityFilter}
              className="mt-4 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Limpiar filtro de experiencia</span>
            </button>
          )}
        </div>
      );
    }

    if (isDateFiltered) {
      return (
        <div className="py-16 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 bg-white rounded-2xl p-6">
          <Clock className="w-10 h-10 text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-700">
            No se encontraron vacantes para este marco de tiempo
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Prueba ampliando tu filtro a{" "}
            <button
              onClick={() => onSelectTimeframe?.("7d")}
              className="text-emerald-600 underline hover:text-emerald-700 font-medium"
            >
              Última semana
            </button>{" "}
            para descubrir más oportunidades.
          </p>
          {onClearDateFilter && (
            <button
              onClick={onClearDateFilter}
              className="mt-4 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Limpiar filtro de fecha</span>
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="py-16 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 bg-white rounded-2xl text-slate-500">
        <Briefcase className="w-10 h-10 text-slate-400 mb-2" />
        <p className="text-sm font-semibold text-slate-700">No se encontraron vacantes para este criterio</p>
        <p className="text-xs text-slate-500 mt-1">Prueba ampliando tu búsqueda o seleccionando otra ubicación en México.</p>
      </div>
    );
  }

  const quickSeniorityOptions: { id: SeniorityFilter; label: string; isHighlight?: boolean }[] = [
    { id: "all", label: "Todos" },
    { id: "primer_empleo", label: "Primer Empleo Real", isHighlight: true },
    { id: "pasantia", label: "Pasantía / Prácticas" },
    { id: "junior", label: "Junior" },
    { id: "mid", label: "Mid" },
    { id: "senior", label: "Senior" },
  ];

  return (
    <div className="flex flex-col gap-3.5">
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
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 whitespace-nowrap transition-all shadow-xs ${
                  active
                    ? "bg-slate-900 border-slate-900 text-white font-semibold"
                    : "bg-white border-slate-200/80 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                {opt.isHighlight && <Sparkles className={`w-3.5 h-3.5 ${active ? "text-amber-400" : "text-emerald-600"}`} />}
                <span>{opt.label}</span>
                {count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      active
                        ? "bg-slate-800 text-slate-200"
                        : "bg-slate-100 text-slate-500"
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
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-1 gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-medium">
            <strong className="text-slate-900 font-bold">{vacancies.length}</strong>{" "}
            {vacancies.length === 1 ? "vacante encontrada" : "vacantes encontradas"}
            {hideApplied && hiddenCount > 0 && (
              <span className="text-slate-400 text-[11px] ml-1.5">
                ({hiddenCount} {hiddenCount === 1 ? "postulada oculta" : "postuladas ocultas"})
              </span>
            )}
          </span>

          {onToggleHideApplied && (
            <button
              type="button"
              title={
                hideApplied
                  ? "Mostrar vacantes con postulación enviada (Atajo: H)"
                  : "Ocultar vacantes con postulación enviada (Atajo: H)"
              }
              aria-pressed={hideApplied}
              onClick={onToggleHideApplied}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 shadow-xs ${
                hideApplied
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold"
                  : "bg-white border-slate-200/80 text-slate-500 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              {hideApplied ? (
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{hideApplied ? "Ocultando postuladas" : "Ocultar postuladas"}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  hideApplied
                    ? "bg-emerald-200 text-emerald-900 font-bold"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {hiddenCount}
              </span>
            </button>
          )}
        </div>

        {onSortChange && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Ordenar por:</span>
            <select
              aria-label="Ordenar resultados"
              value={sortOrder}
              onChange={(e) => onSortChange(e.target.value as SortOrder)}
              className="bg-white border border-slate-200/80 text-slate-700 text-xs rounded-xl px-2.5 py-1 focus:outline-none focus:border-slate-900 shadow-xs"
            >
              <option value="recent">Más recientes primero</option>
              <option value="compatibility">Mayor compatibilidad (Fit Score)</option>
              <option value="relevance">Relevancia por defecto</option>
            </select>
          </div>
        )}
      </div>

      {/* Vacancy Card List */}
      <div className="flex flex-col gap-3.5">
        {vacancies.map((vacancy) => (
          <VacancyCard
            key={vacancy.fingerprint}
            vacancy={vacancy}
            isSelected={selectedFingerprint === vacancy.fingerprint}
            now={now}
            fitScore={scoresByFingerprint[vacancy.fingerprint]}
            candidateSkills={candidateSkills}
            applicationStatus={applicationStatuses[vacancy.fingerprint]}
            onSelect={onSelect}
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
