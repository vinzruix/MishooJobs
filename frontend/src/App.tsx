import { useEffect, useMemo, useState } from "react";
import { Terminal } from "lucide-react";
import { Drawer } from "vaul";
import { Header } from "./components/Header";
import { SearchBar } from "./components/SearchBar";
import { FilterToolbar } from "./components/FilterToolbar";
import { PortalStatusBar } from "./components/PortalStatusBar";
import { VacancyList } from "./components/VacancyList";
import { VacancyDetailPane } from "./components/VacancyDetailPane";
import { PipelineView } from "./components/PipelineView";
import { ProfileManagerModal } from "./components/ProfileManagerModal";
import { MasterProfileEditor } from "./components/MasterProfileEditor";
import { LiveCVViewer } from "./components/LiveCVViewer";
import { ResumeLibraryView } from "./components/ResumeLibraryView";
import { VacancyTailorModal } from "./components/VacancyTailorModal";
import { RoleArchetypeModal } from "./components/RoleArchetypeModal";
import { useMasterProfile } from "./hooks/useMasterProfile";
import { useResumes } from "./hooks/useResumes";
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
import type { JobVacancy, SeniorityCounts, SeniorityFilter, SortOrder, TimeframeId, DetailTab, FilterState } from "./types/job";
import type { AIEvaluation } from "./types/profile";

const VALID_SENIORITIES: Set<SeniorityFilter> = new Set([
  "all",
  "primer_empleo",
  "pasantia",
  "junior",
  "mid",
  "senior",
]);

function parseSeniorityFromQuery(raw: string | null): SeniorityFilter {
  if (raw && VALID_SENIORITIES.has(raw as SeniorityFilter)) {
    return raw as SeniorityFilter;
  }
  return "all";
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"search" | "pipeline" | "resumes">("search");
  const [selectedVacancy, setSelectedVacancy] = useState<JobVacancy | null>(null);
  const [viewingResumeId, setViewingResumeId] = useState<string | null>(null);
  const [tailoringVacancy, setTailoringVacancy] = useState<JobVacancy | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMasterProfileOpen, setIsMasterProfileOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>("description");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 1024;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobileViewport(e.matches);
      if (!e.matches) {
        setIsMobileDrawerOpen(false);
      }
    };
    setIsMobileViewport(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, []);
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

  const initialSeniority = useMemo<SeniorityFilter>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return parseSeniorityFromQuery(params.get("seniority"));
    }
    return "all";
  }, []);

  const [filters, setFilters] = useState<FilterState>({
    modality: "all",
    seniority: initialSeniority,
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

  const { profile: masterProfile, photoUrl, universalSkills } = useMasterProfile();
  const { resumes } = useResumes();

  const {
    applications,
    statusMap,
    ignoredSet,
    appliedFingerprintSet = new Set<string>(),
    setApplicationStatus,
    removeApplication,
  } = useApplications();

  const [hideApplied, setHideApplied] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = window.localStorage.getItem("mishoojobs_hide_applied");
      return stored !== null ? JSON.parse(stored) === true : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("mishoojobs_hide_applied", JSON.stringify(hideApplied));
    } catch {
      // Graceful ignore
    }
  }, [hideApplied]);

  const handleToggleHideApplied = () => {
    setHideApplied((prev) => !prev);
  };

  // URL query sync: update ?published_within=... and ?seniority=... on filter changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const serializedTf = serializeTimeframesToQuery(filters.timeframes);
    if (serializedTf) {
      url.searchParams.set("published_within", serializedTf);
    } else {
      url.searchParams.delete("published_within");
    }

    if (filters.seniority && filters.seniority !== "all") {
      url.searchParams.set("seniority", filters.seniority);
    } else {
      url.searchParams.delete("seniority");
    }

    window.history.replaceState({}, "", url.toString());
  }, [filters.timeframes, filters.seniority]);

  // Browser back/forward (popstate) listener to sync filters
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlTfs = parseTimeframesFromQuery(params.get("published_within"));
      const urlSeniority = parseSeniorityFromQuery(params.get("seniority"));
      setFilters((prev) => ({ ...prev, timeframes: urlTfs, seniority: urlSeniority }));
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

  const handleSearch = (query: string) => {
    setCurrentQuery(query);
    search({
      query,
      location: filters.location,
      modality: filters.modality,
      seniority: "all",
    });
  };

  const handleFilterChange = (newFilters: FilterState) => {
    const backendFilterChanged =
      newFilters.location !== filters.location ||
      newFilters.modality !== filters.modality;

    setFilters(newFilters);

    if (backendFilterChanged) {
      search({
        query: currentQuery,
        location: newFilters.location,
        modality: newFilters.modality,
        seniority: "all",
      });
    }
  };

  const handleFilterReset = () => {
    const backendFilterChanged =
      filters.modality !== "all" ||
      (filters.location !== "México" && filters.location !== "");

    const defaultFilters: FilterState = {
      modality: "all",
      seniority: "all",
      location: "México",
      timeframes: ["all"],
    };
    setFilters(defaultFilters);

    if (backendFilterChanged) {
      search({
        query: currentQuery,
        location: defaultFilters.location,
        modality: defaultFilters.modality,
        seniority: "all",
      });
    }
  };

  // 1. Unignored vacancies with strict fingerprint uniqueness
  const unignoredVacancies = useMemo(() => {
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

  // 2. Base active vacancies (excluding applied vacancies when hideApplied is active)
  const baseActiveVacancies = useMemo(() => {
    if (!hideApplied) return unignoredVacancies;
    return unignoredVacancies.filter((v) => !appliedFingerprintSet.has(v.fingerprint));
  }, [unignoredVacancies, hideApplied, appliedFingerprintSet]);

  // 3. Contextual matching unignored vacancies to compute hidden count and empty state
  const matchingUnignoredVacancies = useMemo(() => {
    const bySeniority =
      filters.seniority === "all"
        ? unignoredVacancies
        : unignoredVacancies.filter((v) => v.seniority_level === filters.seniority);
    return filterVacanciesByTimeframes(bySeniority, filters.timeframes, currentNow);
  }, [unignoredVacancies, filters.seniority, filters.timeframes, currentNow]);

  const hiddenAppliedCount = useMemo(() => {
    return matchingUnignoredVacancies.filter((v) => appliedFingerprintSet.has(v.fingerprint)).length;
  }, [matchingUnignoredVacancies, appliedFingerprintSet]);

  // Dynamic real-time counters across all 6 seniority options (scoped to active timeframe if set)
  const tierCounts = useMemo<SeniorityCounts>(() => {
    const base =
      !filters.timeframes.includes("all") && filters.timeframes.length > 0
        ? filterVacanciesByTimeframes(baseActiveVacancies, filters.timeframes, currentNow)
        : baseActiveVacancies;

    const counts: SeniorityCounts = {
      all: base.length,
      primer_empleo: 0,
      pasantia: 0,
      junior: 0,
      mid: 0,
      senior: 0,
    };
    for (const v of base) {
      if (v.seniority_level in counts) {
        counts[v.seniority_level as keyof SeniorityCounts]++;
      }
    }
    return counts;
  }, [baseActiveVacancies, filters.timeframes, currentNow]);

  // 2. Client-side experience tier filtering
  const seniorityFilteredVacancies = useMemo(() => {
    if (filters.seniority === "all") return baseActiveVacancies;
    return baseActiveVacancies.filter((v) => v.seniority_level === filters.seniority);
  }, [baseActiveVacancies, filters.seniority]);

  const timeframeCounts = useMemo<Record<TimeframeId, number>>(() => {
    const counts: Record<TimeframeId, number> = {
      all: seniorityFilteredVacancies.length,
      "1h": 0,
      "24h": 0,
      "3d": 0,
      "7d": 0,
      "30d": 0,
      "30d_plus": 0,
    };
    for (const tf of (["1h", "24h", "3d", "7d", "30d", "30d_plus"] as TimeframeId[])) {
      counts[tf] = filterVacanciesByTimeframes(seniorityFilteredVacancies, [tf], currentNow).length;
    }
    return counts;
  }, [seniorityFilteredVacancies, currentNow]);

  // 3. Client-side date timeframe filtering
  const dateFilteredVacancies = useMemo(() => {
    return filterVacanciesByTimeframes(seniorityFilteredVacancies, filters.timeframes, currentNow);
  }, [seniorityFilteredVacancies, filters.timeframes, currentNow]);

  // 4. Sorting by active sort order with smart default sorting for primer_empleo (FR-011)
  const displayedVacancies = useMemo(() => {
    if (filters.seniority === "primer_empleo" && !isSortUserOverridden) {
      return [...dateFilteredVacancies].sort((a, b) => {
        const aVer = a.audit_status === "verified" ? 1 : 0;
        const bVer = b.audit_status === "verified" ? 1 : 0;
        if (aVer !== bVer) {
          return bVer - aVer;
        }
        const aTime = a.published_at ? new Date(a.published_at).getTime() : 0;
        const bTime = b.published_at ? new Date(b.published_at).getTime() : 0;
        return bTime - aTime;
      });
    }
    return sortVacancies(dateFilteredVacancies, sortOrder);
  }, [dateFilteredVacancies, filters.seniority, isSortUserOverridden, sortOrder]);

  // Stream auto-selection of first vacancy upon stream arrival
  useEffect(() => {
    if (displayedVacancies.length > 0) {
      if (!selectedVacancy || !displayedVacancies.some((v) => v.fingerprint === selectedVacancy.fingerprint)) {
        setSelectedVacancy(displayedVacancies[0]);
      }
    } else {
      setSelectedVacancy(null);
    }
  }, [displayedVacancies]);

  const isBlockingModalOpen =
    isMobileDrawerOpen ||
    isProfileModalOpen ||
    isMasterProfileOpen ||
    tailoringVacancy !== null ||
    isRoleModalOpen ||
    viewingResumeId !== null;

  useKeyboardNavigation({
    vacancies: displayedVacancies,
    selectedFingerprint: selectedVacancy?.fingerprint,
    isModalOpen: isBlockingModalOpen,
    onSelect: (v) => setSelectedVacancy(v),
    onInspect: (v) => {
      setSelectedVacancy(v);
      if (isMobileViewport) {
        setIsMobileDrawerOpen(true);
      }
    },
    onCloseModal: () => {
      if (isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false);
        return;
      }
      if (tailoringVacancy !== null) {
        setTailoringVacancy(null);
        return;
      }
      if (isRoleModalOpen) {
        setIsRoleModalOpen(false);
        return;
      }
      if (isMasterProfileOpen) {
        setIsMasterProfileOpen(false);
        return;
      }
      if (isProfileModalOpen) {
        setIsProfileModalOpen(false);
        return;
      }
      if (viewingResumeId) {
        setViewingResumeId(null);
        return;
      }
    },
    onSave: (v) => setApplicationStatus(v, "saved"),
    onMarkApplied: (v) => setApplicationStatus(v, "applied"),
    onToggleHideApplied: handleToggleHideApplied,
    onCycleTab: () => setDetailTab((prev) => (prev === "description" ? "ai_eval" : "description")),
    onOpenPrimaryLink: (v) => {
      const link = v.external_links?.[0]?.direct_url;
      if (link && typeof window !== "undefined") {
        window.open(link, "_blank", "noopener,noreferrer");
      }
    },
  });

  const effectiveCandidateSkills = useMemo(() => {
    return universalSkills.length > 0 ? universalSkills : (activeProfile?.skills || []);
  }, [universalSkills, activeProfile?.skills]);

  const effectiveTargetRole = useMemo(() => {
    return masterProfile?.personal_info?.headline || activeProfile?.target_role || "";
  }, [masterProfile?.personal_info?.headline, activeProfile?.target_role]);

  // Instant Tier 1 heuristic match score calculation across displayed cards (<2s)
  const scoresByFingerprint = useMemo(() => {
    if (effectiveCandidateSkills.length === 0) return {};
    const map: Record<string, number> = {};
    for (const v of displayedVacancies) {
      const vSkills = Array.isArray(v.skills) ? v.skills : (Array.isArray((v as any).skills_extracted) ? (v as any).skills_extracted : []);
      const fallbackText = `${v.title} ${v.description || (v as any).description_clean || ""}`;
      map[v.fingerprint] = calculateHeuristicScore(effectiveCandidateSkills, vSkills, {
        fallbackText,
        targetRole: effectiveTargetRole,
        jobTitle: v.title,
        seniority_level: v.seniority_level,
      });
    }
    return map;
  }, [effectiveCandidateSkills, effectiveTargetRole, displayedVacancies]);

  const handleEvaluationComplete = (fingerprint: string, evalResult: AIEvaluation) => {
    setEvalCache((prev) => ({
      ...prev,
      [fingerprint]: evalResult,
    }));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-sans flex flex-col selection:bg-slate-200 selection:text-slate-900 print:min-h-0 print:block print:bg-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setViewingResumeId(null);
        }}
        onOpenMasterProfile={() => setIsMasterProfileOpen(true)}
        resumesCount={resumes.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-4 print:p-0 print:max-w-none print:m-0 print:block">
        {viewingResumeId ? (
          <LiveCVViewer
            resumeId={viewingResumeId}
            photoUrl={photoUrl}
            onBack={() => setViewingResumeId(null)}
          />
        ) : (
          <>
            {/* Search View */}
            {activeTab === "search" && (
              <div className="flex flex-col gap-4">
                {/* Search Input Bar */}
                <SearchBar
                  onSearch={handleSearch}
                  isSearching={isSearching}
                  initialQuery={currentQuery}
                />

                {/* Unified Compact Filter Toolbar */}
                <FilterToolbar
                  filters={filters}
                  seniorityCounts={tierCounts}
                  timeframeCounts={timeframeCounts}
                  hideApplied={hideApplied}
                  hiddenAppliedCount={hiddenAppliedCount}
                  totalResultsCount={displayedVacancies.length}
                  duplicatesMergedCount={summary?.duplicates_merged}
                  onFilterChange={handleFilterChange}
                  onToggleHideApplied={handleToggleHideApplied}
                  onResetFilters={handleFilterReset}
                />

                {/* Portal Live Progress Badges */}
                <PortalStatusBar statuses={portalStatuses} isSearching={isSearching} />

                {/* Vacancy Results Feed - Master-Detail Split Grid */}
                {displayedVacancies.length === 0 && !isSearching && unignoredVacancies.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-16 text-center text-slate-500 border border-dashed border-slate-300 rounded-2xl bg-white/60">
                    <Terminal className="w-10 h-10 text-slate-400 mb-3" />
                    <p className="text-sm font-semibold text-slate-800">Empieza tu búsqueda de empleo en México</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md">
                      Ingresa un rol como <code className="text-slate-900 font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">Python Junior</code> o <code className="text-slate-900 font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">Becario Frontend</code> para consultar en tiempo real.
                    </p>
                  </div>
                ) : (
                  <div
                    data-testid="master-detail-container"
                    className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                  >
                    {/* Left Column: Master Feed (40% width on desktop: lg:col-span-5) */}
                    <div className="lg:col-span-5 w-full">
                      <VacancyList
                        vacancies={displayedVacancies}
                        selectedFingerprint={selectedVacancy?.fingerprint}
                        isSearching={isSearching}
                        isDateFiltered={!filters.timeframes.includes("all") && filters.timeframes.length > 0}
                        activeSeniority={filters.seniority}
                        seniorityCounts={tierCounts}
                        sortOrder={sortOrder}
                        now={currentNow}
                        scoresByFingerprint={scoresByFingerprint}
                        candidateSkills={effectiveCandidateSkills}
                        applicationStatuses={statusMap}
                        hideApplied={hideApplied}
                        hiddenCount={hiddenAppliedCount}
                        totalUnignoredCount={matchingUnignoredVacancies.length}
                        duplicatesMergedCount={summary?.duplicates_merged}
                        onToggleHideApplied={handleToggleHideApplied}
                        onInspect={(v) => {
                          setSelectedVacancy(v);
                          if (isMobileViewport) {
                            setIsMobileDrawerOpen(true);
                          }
                        }}
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
                    </div>

                    {/* Right Column: Sticky Detail Pane (60% width on desktop: lg:col-span-7, min-w 420px) */}
                    <div
                      data-testid="desktop-detail-pane"
                      className="hidden lg:block lg:col-span-7 sticky top-20 min-w-[420px]"
                    >
                      <VacancyDetailPane
                        vacancy={selectedVacancy}
                        activeProfile={activeProfile}
                        masterProfile={masterProfile}
                        universalSkills={universalSkills}
                        cachedEvaluation={selectedVacancy ? evalCache[selectedVacancy.fingerprint] : undefined}
                        onEvaluationComplete={handleEvaluationComplete}
                        onOpenTailorModal={(v) => setTailoringVacancy(v)}
                        onSave={(v) => setApplicationStatus(v, "saved")}
                        onMarkApplied={(v) => setApplicationStatus(v, "applied")}
                        isSaved={selectedVacancy ? statusMap[selectedVacancy.fingerprint] === "saved" : false}
                        isApplied={selectedVacancy ? statusMap[selectedVacancy.fingerprint] === "applied" : false}
                        initialTab={detailTab}
                      />
                    </div>
                  </div>
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
                    seniority_level: "junior",
                    years_required_min: 0,
                    is_real_first_job: false,
                    audit_status: "preliminary",
                    reasoning: "",
                    has_discrepancy: false,
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

            {/* Resumes Library Tab */}
            {activeTab === "resumes" && (
              <ResumeLibraryView
                onSelectResume={(id) => setViewingResumeId(id)}
                onExploreVacancies={() => setActiveTab("search")}
                onOpenRoleModal={() => setIsRoleModalOpen(true)}
                onOpenMasterProfile={() => setIsMasterProfileOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Master Profile Editor Modal */}
      <MasterProfileEditor
        isOpen={isMasterProfileOpen}
        onClose={() => setIsMasterProfileOpen(false)}
      />

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

      {/* Mobile Slide-Up Bottom Sheet Drawer (< 1024px) */}
      <Drawer.Root
        open={isMobileViewport && isMobileDrawerOpen && !!selectedVacancy}
        onOpenChange={(open) => {
          if (!isMobileViewport) {
            setIsMobileDrawerOpen(false);
            return;
          }
          setIsMobileDrawerOpen(open);
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-xs lg:hidden" />
          <Drawer.Content
            data-testid="mobile-detail-drawer"
            className="bg-white flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 max-h-[90vh] z-50 focus:outline-none lg:hidden"
          >
            <div className="p-3 bg-white rounded-t-[20px] flex-1 overflow-y-auto">
              <div
                data-testid="drawer-drag-handle"
                className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-300 mb-3 cursor-grab"
              />
              <VacancyDetailPane
                vacancy={selectedVacancy}
                isMobileSheet={true}
                onClose={() => setIsMobileDrawerOpen(false)}
                activeProfile={activeProfile}
                masterProfile={masterProfile}
                universalSkills={universalSkills}
                cachedEvaluation={selectedVacancy ? evalCache[selectedVacancy.fingerprint] : undefined}
                onEvaluationComplete={handleEvaluationComplete}
                onOpenTailorModal={(v) => {
                  setIsMobileDrawerOpen(false);
                  setTailoringVacancy(v);
                }}
                onSave={(v) => setApplicationStatus(v, "saved")}
                onMarkApplied={(v) => setApplicationStatus(v, "applied")}
                isSaved={selectedVacancy ? statusMap[selectedVacancy.fingerprint] === "saved" : false}
                isApplied={selectedVacancy ? statusMap[selectedVacancy.fingerprint] === "applied" : false}
                initialTab={detailTab}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Vacancy Tailor Modal */}
      {tailoringVacancy && (
        <VacancyTailorModal
          isOpen={!!tailoringVacancy}
          vacancy={tailoringVacancy}
          masterProfile={masterProfile}
          onClose={() => setTailoringVacancy(null)}
          onSuccess={(id) => {
            setTailoringVacancy(null);
            setSelectedVacancy(null);
            setViewingResumeId(id);
          }}
          onOpenMasterProfile={() => setIsMasterProfileOpen(true)}
        />
      )}

      {/* Role Archetype Modal */}
      <RoleArchetypeModal
        isOpen={isRoleModalOpen}
        masterProfile={masterProfile}
        onClose={() => setIsRoleModalOpen(false)}
        onSuccess={(id) => {
          setIsRoleModalOpen(false);
          setViewingResumeId(id);
        }}
        onOpenMasterProfile={() => setIsMasterProfileOpen(true)}
      />

      {/* Footer */}
      <footer className="no-print print:hidden border-t border-slate-200/80 py-4 px-4 text-center text-xs text-slate-400">
        MishooJobs © 2026
      </footer>
    </div>
  );
}
