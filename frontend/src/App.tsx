import { useEffect, useMemo, useState } from "react";
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
import { useDateTicker } from "./hooks/useDateTicker";
import {
  filterVacanciesByTimeframes,
  parseTimeframesFromQuery,
  serializeTimeframesToQuery,
  sortVacancies,
} from "./services/date_utils";
import { calculateHeuristicScore } from "./services/heuristic_scorer";
import type { JobVacancy, SortOrder, TimeframeId } from "./types/job";
import type { AIEvaluation } from "./types/profile";

export default function App() {
  const [activeTab, setActiveTab] = useState<"search" | "pipeline">("search");
  const [selectedVacancy, setSelectedVacancy] = useState<JobVacancy | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [evalCache, setEvalCache] = useState<Record<string, AIEvaluation>>({});
  const [currentQuery, setCurrentQuery] = useState("Python Junior");

  // Read initial timeframe from URL query parameter (?published_within=...)
  const initialTimeframes = useMemo<TimeframeId[]>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return parseTimeframesFromQuery(params.get("published_within"));
    }
    return ["all"];
  }, []);

  const [filters, setFilters] = useState<FilterState>({
    modality: "all",
    category: "all",
    location: "México",
    timeframes: initialTimeframes,
  });

  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");
  const [isSortUserOverridden, setIsSortUserOverridden] = useState<boolean>(false);

  // Single top-level 60-second ticker for relative timestamps and "Nueva" badges
  const currentNow = useDateTicker(60_000);

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

  // URL query sync: update ?published_within=... on timeframe changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const serialized = serializeTimeframesToQuery(filters.timeframes);
    if (serialized) {
      url.searchParams.set("published_within", serialized);
    } else {
      url.searchParams.delete("published_within");
    }
    window.history.replaceState({}, "", url.toString());
  }, [filters.timeframes]);

  // Browser back/forward (popstate) listener to sync timeframe filter
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlTfs = parseTimeframesFromQuery(params.get("published_within"));
      setFilters((prev) => ({ ...prev, timeframes: urlTfs }));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Smart Recency auto-switching: if <= 3 days and user hasn't overridden sort
  useEffect(() => {
    if (!isSortUserOverridden) {
      const hasRecentTimeframe = filters.timeframes.some((t) =>
        ["1h", "24h", "3d"].includes(t)
      );
      if (hasRecentTimeframe) {
        setSortOrder("recent");
      }
    }
  }, [filters.timeframes, isSortUserOverridden]);

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
    const backendFilterChanged =
      newFilters.location !== filters.location ||
      newFilters.modality !== filters.modality ||
      newFilters.category !== filters.category;

    setFilters(newFilters);

    if (backendFilterChanged) {
      search({
        query: currentQuery,
        location: newFilters.location,
        modality: newFilters.modality,
        category: newFilters.category,
      });
    }
  };

  const handleFilterReset = () => {
    const backendFilterChanged =
      filters.modality !== "all" ||
      filters.category !== "all" ||
      (filters.location !== "México" && filters.location !== "");

    const defaultFilters: FilterState = {
      modality: "all",
      category: "all",
      location: "México",
      timeframes: ["all"],
    };
    setFilters(defaultFilters);

    if (backendFilterChanged) {
      search({
        query: currentQuery,
        location: defaultFilters.location,
        modality: defaultFilters.modality,
        category: defaultFilters.category,
      });
    }
  };

  // 1. Visible vacancies excluding discarded ones (US5, SC-007) with strict fingerprint uniqueness
  const visibleVacancies = useMemo(() => {
    const seen = new Set<string>();
    const result: JobVacancy[] = [];
    for (const v of vacancies) {
      if (!ignoredSet.has(v.fingerprint) && !seen.has(v.fingerprint)) {
        seen.add(v.fingerprint);
        result.push(v);
      }
    }
    return result;
  }, [vacancies, ignoredSet]);

  // 2. Client-side date timeframe filtering
  const dateFilteredVacancies = useMemo(() => {
    return filterVacanciesByTimeframes(visibleVacancies, filters.timeframes, currentNow);
  }, [visibleVacancies, filters.timeframes, currentNow]);

  // 3. Sorting by active sort order
  const displayedVacancies = useMemo(() => {
    return sortVacancies(dateFilteredVacancies, sortOrder);
  }, [dateFilteredVacancies, sortOrder]);

  const isAnyModalOpen = selectedVacancy !== null || isProfileModalOpen;

  useKeyboardNavigation({
    vacancies: displayedVacancies,
    isModalOpen: isAnyModalOpen,
    onInspect: (v) => setSelectedVacancy(v),
    onCloseModal: () => {
      setSelectedVacancy(null);
      setIsProfileModalOpen(false);
    },
    onSave: (v) => setApplicationStatus(v, "saved"),
    onMarkApplied: (v) => setApplicationStatus(v, "applied"),
  });

  // Instant Tier 1 heuristic match score calculation across displayed cards (<2s)
  const scoresByFingerprint = useMemo(() => {
    if (!activeProfile || activeProfile.skills.length === 0) return {};
    const map: Record<string, number> = {};
    for (const v of displayedVacancies) {
      const vSkills = Array.isArray(v.skills) ? v.skills : (Array.isArray((v as any).skills_extracted) ? (v as any).skills_extracted : []);
      const fallbackText = `${v.title} ${v.description || (v as any).description_clean || ""}`;
      map[v.fingerprint] = calculateHeuristicScore(activeProfile.skills, vSkills, {
        fallbackText,
        targetRole: activeProfile.target_role,
        jobTitle: v.title,
        category: v.category,
      });
    }
    return map;
  }, [activeProfile, displayedVacancies]);

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
            <SearchBar
              onSearch={handleSearch}
              isSearching={isSearching}
              initialQuery={currentQuery}
              initialLocation={filters.location}
            />

            {/* Mexican Filters Drawer */}
            <FilterDrawer
              filters={filters}
              vacancies={visibleVacancies}
              now={currentNow}
              onChange={handleFilterChange}
              onReset={handleFilterReset}
            />

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
            {displayedVacancies.length === 0 && !isSearching && visibleVacancies.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-16 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                <Terminal className="w-10 h-10 text-zinc-700 mb-3" />
                <p className="text-sm font-semibold text-zinc-300">Empieza tu búsqueda de empleo en México</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-md">
                  Ingresa un rol como <code className="text-emerald-400 bg-zinc-900 px-1 py-0.5 rounded">Python Junior</code> o <code className="text-emerald-400 bg-zinc-900 px-1 py-0.5 rounded">Becario Frontend</code> para consultar en tiempo real.
                </p>
              </div>
            ) : (
              <VacancyList
                vacancies={displayedVacancies}
                isSearching={isSearching}
                isDateFiltered={!filters.timeframes.includes("all") && filters.timeframes.length > 0}
                sortOrder={sortOrder}
                now={currentNow}
                scoresByFingerprint={scoresByFingerprint}
                applicationStatuses={statusMap}
                onInspect={(v) => setSelectedVacancy(v)}
                onSave={(v) => setApplicationStatus(v, "saved")}
                onMarkApplied={(v) => setApplicationStatus(v, "applied")}
                onDiscard={(v) => setApplicationStatus(v, "ignored")}
                onSortChange={(order) => {
                  setSortOrder(order);
                  setIsSortUserOverridden(true);
                }}
                onClearDateFilter={() => {
                  setFilters((prev) => ({ ...prev, timeframes: ["all"] }));
                }}
                onSelectTimeframe={(tf) => {
                  setFilters((prev) => ({ ...prev, timeframes: [tf] }));
                }}
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
      {selectedVacancy && (
        <VacancyDetailModal
          key={selectedVacancy.fingerprint}
          vacancy={selectedVacancy}
          onClose={() => setSelectedVacancy(null)}
          activeProfile={activeProfile}
          cachedEvaluation={evalCache[selectedVacancy.fingerprint]}
          onEvaluationComplete={handleEvaluationComplete}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-3 px-4 text-center text-xs text-zinc-600">
        MishooJobs • Desarrollado para juniors y estudiantes en México • Moneda MXN ($)
      </footer>
    </div>
  );
}
