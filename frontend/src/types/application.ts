export type ApplicationStatus =
  | "new"
  | "saved"
  | "applied"
  | "interviewing"
  | "rejected"
  | "offer"
  | "ignored";

export const APPLIED_STATUSES = new Set<ApplicationStatus>([
  "applied",
  "interviewing",
  "rejected",
  "offer",
]);

export interface AppliedFilterPreference {
  key: "mishoojobs_hide_applied";
  value: boolean;
}

export interface ApplicationRecord {
  vacancy_fingerprint: string;
  title: string;
  company_name: string;
  status: ApplicationStatus;
  direct_url: string;
  fit_score?: number;
  notes?: string;
  applied_at?: string | null;
  updated_at: string;
}

export interface UserPreference {
  key: "active_profile_id" | "theme" | "default_filters" | string;
  value: string;
}
