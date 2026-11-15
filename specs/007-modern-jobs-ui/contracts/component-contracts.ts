/**
 * Component Contracts: Modern Split-View Jobs Layout & Clean UI Redesign
 * Feature Branch: 007-modern-jobs-ui
 * 
 * Defines strict TypeScript interfaces for all components involved in the redesign.
 */

import type { JobVacancy, SeniorityFilter, SortOrder, TimeframeId } from "../../../frontend/src/types/job";
import type { CandidateProfile, AIEvaluation } from "../../../frontend/src/types/profile";
import type { MasterProfileData } from "../../../frontend/src/types/master_profile";
import type { ApplicationStatus } from "../../../frontend/src/types/application";
import type { PastelMetricItem, DetailTab } from "../data-model";

/**
 * 1. VacancyDetailPane Contract
 * Shared right-hand detail pane component (used inline on desktop and inside Vaul drawer on mobile).
 */
export interface VacancyDetailPaneProps {
  vacancy: JobVacancy | null;
  activeProfile?: CandidateProfile;
  masterProfile?: MasterProfileData | null;
  universalSkills?: string[];
  cachedEvaluation?: AIEvaluation;
  isMobileSheet?: boolean;
  onClose?: () => void;
  onEvaluationComplete?: (fingerprint: string, evalResult: AIEvaluation) => void;
  onOpenTailorModal?: (vacancy: JobVacancy) => void;
  onSave?: (vacancy: JobVacancy) => void;
  onMarkApplied?: (vacancy: JobVacancy) => void;
}

/**
 * 2. PastelMetricGrid Contract
 * The 4-column horizontal pastel metric block component.
 */
export interface PastelMetricGridProps {
  vacancy: JobVacancy;
  fitScore?: number | null;
  metrics?: PastelMetricItem[];
}

/**
 * 3. VacancyCard Contract
 * Individual job listing card rendered in the left master column.
 */
export interface VacancyCardProps {
  vacancy: JobVacancy;
  isSelected?: boolean;
  fitScore?: number | null;
  candidateSkills?: string[];
  applicationStatus?: ApplicationStatus;
  now?: Date;
  onSelect: (vacancy: JobVacancy) => void;
  onSave?: (vacancy: JobVacancy) => void;
  onMarkApplied?: (vacancy: JobVacancy) => void;
  onDiscard?: (vacancy: JobVacancy) => void;
}

/**
 * 4. MasterDetailView Contract
 * Orchestrates the 40/60 desktop split view and mobile slide-up sheet.
 */
export interface MasterDetailViewProps {
  vacancies: JobVacancy[];
  selectedVacancy: JobVacancy | null;
  isSearching: boolean;
  activeTab: DetailTab;
  evalCache: Record<string, AIEvaluation>;
  scoresByFingerprint: Record<string, number>;
  candidateSkills: string[];
  activeProfile?: CandidateProfile;
  masterProfile?: MasterProfileData | null;
  universalSkills?: string[];
  applicationStatuses: Record<string, ApplicationStatus>;
  now: Date;
  onSelectVacancy: (vacancy: JobVacancy) => void;
  onTabChange: (tab: DetailTab) => void;
  onEvaluationComplete: (fingerprint: string, evalResult: AIEvaluation) => void;
  onOpenTailorModal: (vacancy: JobVacancy) => void;
  onSave: (vacancy: JobVacancy) => void;
  onMarkApplied: (vacancy: JobVacancy) => void;
  onDiscard: (vacancy: JobVacancy) => void;
}

/**
 * 5. CleanFilterBar / FilterDrawer Contract
 * Purged of marketing slogans and promotional boilerplate.
 */
export interface FilterState {
  modality: string;
  seniority: SeniorityFilter;
  location: string;
  timeframes: TimeframeId[];
}

export interface CleanFilterProps {
  filters: FilterState;
  vacancies?: JobVacancy[];
  now?: Date;
  hideApplied?: boolean;
  hiddenCount?: number;
  onToggleHideApplied?: () => void;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}
