import { Briefcase } from "lucide-react";
import type { JobVacancy } from "../types/job";
import type { ApplicationStatus } from "../types/application";
import { VacancyCard } from "./VacancyCard";

interface VacancyListProps {
  vacancies: JobVacancy[];
  isSearching: boolean;
  scoresByFingerprint?: Record<string, number>;
  applicationStatuses?: Record<string, ApplicationStatus>;
  onInspect: (vacancy: JobVacancy) => void;
  onSave?: (vacancy: JobVacancy) => void;
  onMarkApplied?: (vacancy: JobVacancy) => void;
  onDiscard?: (vacancy: JobVacancy) => void;
}

export function VacancyList({
  vacancies,
  isSearching,
  scoresByFingerprint = {},
  applicationStatuses = {},
  onInspect,
  onSave,
  onMarkApplied,
  onDiscard,
}: VacancyListProps) {
  if (vacancies.length === 0) {
    if (isSearching) {
      return (
        <div className="py-16 text-center flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-lg">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-3" />
          <p className="text-sm font-semibold text-zinc-300">Consultando bolsas de empleo mexicanas en vivo...</p>
          <p className="text-xs text-zinc-500 mt-1">Verificando enlaces directos vía HTTP HEAD en tiempo real.</p>
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
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span>
          Mostrando <strong className="text-emerald-400 font-semibold">{vacancies.length}</strong> vacantes verificadas en vivo
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {vacancies.map((vacancy) => (
          <VacancyCard
            key={vacancy.fingerprint}
            vacancy={vacancy}
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
