import { useMemo, useState } from "react";
import { Terminal, Shield, Zap } from "lucide-react";
import { Header } from "./components/Header";
import { SearchBar } from "./components/SearchBar";
import { FilterDrawer, type FilterState } from "./components/FilterDrawer";
import { PortalStatusBar } from "./components/PortalStatusBar";
import { VacancyList } from "./components/VacancyList";
import { PipelineView } from "./components/PipelineView";
import { ProfileManagerModal } from "./components/ProfileManagerModal";
import { VacancyDetailModal } from "./components/VacancyDetailModal";
import { useJobStream } from "./hooks/useJobStream";
import { useProfiles } from "./hooks/useProfiles";
import { useApplications } from "./hooks/useApplications";
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import { calculateHeuristicScore } from "./services/heuristic_scorer";
import type { JobVacancy } from "./types/job";
import type { AIEvaluation } from "./types/profile";

export default function App() {
  const [activeTab, setActiveTab] = useState<"search" | "pipeline">("search");
  const [selectedVacancy, setSelectedVacancy] = useState<JobVacancy | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [evalCache, setEvalCache] = useState<Record<string, AIEvaluation>>({});
  const [currentQuery, setCurrentQuery] = useState("Python Junior");
  const [filters, setFilters] = useState<FilterState>({
    modality: "all",
    category: "all",
    location: "México",
  });

  const {
    isSearching,
    portalStatuses,
    vacancies,
    summary,
    search,
  } = useJobStream();

  const {
    profiles,
    activeProfile,
    activeProfileId,
    selectActiveProfile,
    addProfile,
    removeProfile,
  } = useProfiles();

  const {
    applications,
    statusMap,
    ignoredSet,
    setApplicationStatus,
    removeApplication,
  } = useApplications();

  const handleSearch = (query: string, location: string) => {
    setCurrentQuery(query);
    setFilters((prev) => ({ ...prev, location }));
    search({
      query,
      location,
      modality: filters.modality,
      category: filters.category,
    });
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    search({
      query: currentQuery,
      location: newFilters.location,
      modality: newFilters.modality,
      category: newFilters.category,
    });
  };

  const handleFilterReset = () => {
    const defaultFilters: FilterState = {
      modality: "all",
      category: "all",
      location: "México",
    };
    setFilters(defaultFilters);
    search({
      query: currentQuery,
      location: defaultFilters.location,
      modality: defaultFilters.modality,
      category: defaultFilters.category,
    });
  };

  // Visible vacancies excluding discarded ones (US5, SC-007)
  const visibleVacancies = useMemo(() => {
    return vacancies.filter((v) => !ignoredSet.has(v.fingerprint));
  }, [vacancies, ignoredSet]);

  const isAnyModalOpen = selectedVacancy !== null || isProfileModalOpen;

  useKeyboardNavigation({
    vacancies: visibleVacancies,
    isModalOpen: isAnyModalOpen,
    onInspect: (v) => setSelectedVacancy(v),
    onCloseModal: () => {
      setSelectedVacancy(null);
      setIsProfileModalOpen(false);
    },
    onSave: (v) => setApplicationStatus(v, "saved"),
    onMarkApplied: (v) => setApplicationStatus(v, "applied"),
  });

  // Instant Tier 1 heuristic match score calculation across all cards (<2s)
  const scoresByFingerprint = useMemo(() => {
    if (!activeProfile || activeProfile.skills.length === 0) return {};
    const map: Record<string, number> = {};
    for (const v of visibleVacancies) {
      map[v.fingerprint] = calculateHeuristicScore(activeProfile.skills, v.skills);
    }
    return map;
  }, [activeProfile, visibleVacancies]);

  const handleEvaluationComplete = (fingerprint: string, evalResult: AIEvaluation) => {
    setEvalCache((prev) => ({
      ...prev,
      [fingerprint]: evalResult,
    }));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono flex flex-col selection:bg-zinc-800 selection:text-emerald-400">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfileManager={() => setIsProfileModalOpen(true)}
        activeProfileName={activeProfile?.name}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-4">
        {/* Banner with Constitution Guarantee */}
        <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 text-xs text-zinc-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              <strong className="text-zinc-200">100% Búsqueda en Vivo:</strong> Concurrencia directa contra Computrabajo, Indeed y OCC. Sin base de datos estática ni registros previos.
            </span>
          </div>
          <div className="flex items-center gap-2 text-zinc-500">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sin cuenta • Privacidad en tu navegador</span>
          </div>
        </div>

        {/* Search View */}
        {activeTab === "search" && (
          <div className="flex flex-col gap-4">
            {/* Search Input Bar */}
            <SearchBar onSearch={handleSearch} isSearching={isSearching} initialQuery={currentQuery} initialLocation={filters.location} />

            {/* Mexican Filters Drawer */}
            <FilterDrawer filters={filters} onChange={handleFilterChange} onReset={handleFilterReset} />

            {/* Portal Live Progress Badges */}
            <PortalStatusBar statuses={portalStatuses} isSearching={isSearching} />

            {/* Deduplication Metric Badge */}
            {summary && summary.duplicates_merged > 0 && (
              <div className="text-[11px] text-zinc-400 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded flex items-center justify-between">
                <span>
                  ⚡ Se combinaron <strong className="text-emerald-400">{summary.duplicates_merged}</strong> vacantes duplicadas entre bolsas de trabajo.
                </span>
                <span className="text-zinc-500 text-[10px]">Total extraídas: {summary.total_extracted}</span>
              </div>
            )}

            {/* Vacancy Results Feed */}
            {visibleVacancies.length === 0 && !isSearching ? (
              <div className="flex-1 flex flex-col items-center justify-center p-16 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                <Terminal className="w-10 h-10 text-zinc-700 mb-3" />
                <p className="text-sm font-semibold text-zinc-300">Empieza tu búsqueda de empleo en México</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-md">
                  Ingresa un rol como <code className="text-emerald-400 bg-zinc-900 px-1 py-0.5 rounded">Python Junior</code> o <code className="text-emerald-400 bg-zinc-900 px-1 py-0.5 rounded">Becario Frontend</code> para consultar en tiempo real.
                </p>
              </div>
            ) : (
              <VacancyList
                vacancies={visibleVacancies}
                isSearching={isSearching}
                scoresByFingerprint={scoresByFingerprint}
                applicationStatuses={statusMap}
                onInspect={(v) => setSelectedVacancy(v)}
                onSave={(v) => setApplicationStatus(v, "saved")}
                onMarkApplied={(v) => setApplicationStatus(v, "applied")}
                onDiscard={(v) => setApplicationStatus(v, "ignored")}
              />
            )}
          </div>
        )}

        {/* Pipeline Tab */}
        {activeTab === "pipeline" && (
          <PipelineView
            applications={applications}
            onUpdateStatus={(rec, newStatus) => {
              const stubVacancy: JobVacancy = {
                fingerprint: rec.vacancy_fingerprint,
                title: rec.title,
                company_name: rec.company_name,
                location_state: "MEXICO",
                modality: "presencial",
                category: "junior",
                currency: "MXN",
                description: "",
                skills: [],
                external_links: rec.direct_url
                  ? [{ portal_name: "computrabajo", direct_url: rec.direct_url, is_active: true }]
                  : [],
              };
              setApplicationStatus(stubVacancy, newStatus, rec.notes);
            }}
            onRemove={removeApplication}
          />
        )}
      </main>

      {/* Profile Manager Modal */}
      <ProfileManagerModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelectProfile={selectActiveProfile}
        onAddProfile={addProfile}
        onRemoveProfile={removeProfile}
      />

      {/* Detail Modal Preview with On-Demand AI Evaluation */}
      <VacancyDetailModal
        vacancy={selectedVacancy}
        onClose={() => setSelectedVacancy(null)}
        activeProfile={activeProfile}
        cachedEvaluation={selectedVacancy ? evalCache[selectedVacancy.fingerprint] : undefined}
        onEvaluationComplete={handleEvaluationComplete}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-3 px-4 text-center text-xs text-zinc-600">
        MishooJobs • Desarrollado para juniors y estudiantes en México • Moneda MXN ($)
      </footer>
    </div>
  );
}
