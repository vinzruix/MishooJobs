export type PortalName = "computrabajo" | "indeed" | "occ";

export type PortalScraperStatus = "searching" | "completed" | "timeout" | "blocked" | "error";

export type Modality = "remoto" | "hibrido" | "presencial";

export type SeniorityLevel =
  | "pasantia"
  | "primer_empleo"
  | "junior"
  | "mid"
  | "senior";

export type SeniorityFilter = "all" | SeniorityLevel;

export type AuditStatus = "preliminary" | "verified";

export interface SeniorityTierOption {
  id: SeniorityFilter;
  label: string;
  sublabel: string;
  badgeLabel: string;
  badgeColor: string;
}

export interface SeniorityCounts {
  all: number;
  primer_empleo: number;
  pasantia: number;
  junior: number;
  mid: number;
  senior: number;
}

export interface SeniorityAuditResult {
  vacancy_fingerprint: string;
  seniority_level: SeniorityLevel;
  years_required_min: number;
  is_real_first_job: boolean;
  audit_status: AuditStatus;
  reasoning: string;
  has_discrepancy: boolean;
  is_cached: boolean;
  audited_at: string;
}

export interface ExternalLink {
  portal_name: PortalName;
  direct_url: string;
  is_active: boolean;
  http_status_code?: number;
  verified_at?: string;
}

export interface ScamReport {
  risk_level: "safe" | "warning" | "critical";
  risk_categories: string[];
  matched_indicators: string[];
  badge_label: string;
  explanation: string;
}

export interface JobVacancy {
  fingerprint: string;
  title: string;
  company_name: string;
  location_city?: string | null;
  location_state: string;
  modality: Modality | string;
  seniority_level: SeniorityLevel;
  years_required_min: number;
  is_real_first_job: boolean;
  audit_status: AuditStatus;
  reasoning: string;
  has_discrepancy: boolean;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_period?: "semanal" | "quincenal" | "mensual" | "anual" | null;
  currency: string;
  description: string;
  skills: string[];
  published_at?: string | null;
  external_links: ExternalLink[];
  scam_report?: ScamReport | null;
  heuristic_fit_score?: number | null;
  first_discovered_at?: string;
  last_verified_at?: string;
}

export interface PortalStatus {
  portal: PortalName;
  status: PortalScraperStatus;
  count: number;
  message?: string;
  duration_ms?: number;
}

export interface DeduplicationSummary {
  total_extracted: number;
  unique_vacancies: number;
  duplicates_merged: number;
}

export interface StreamEndEvent {
  status: "complete" | "partial" | "failed";
  total_vacancies: number;
  total_duration_ms: number;
}

export type TimeframeId =
  | "all"
  | "1h"
  | "24h"
  | "3d"
  | "7d"
  | "30d"
  | "30d_plus";

export type SortOrder = "recent" | "compatibility" | "relevance";

export interface SortOption {
  id: SortOrder;
  label: string;
}

export interface PublicationTimeframe {
  id: TimeframeId;
  label: string;
  description: string;
  maxAgeMs?: number;
  minAgeMs?: number;
  count: number;
}

export interface VacancyDateMetadata {
  published_at?: string | null;
  relative_text: string;
  is_new: boolean;
  age_ms?: number | null;
}
