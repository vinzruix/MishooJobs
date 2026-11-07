export interface ProjectItem {
  title: string;
  description: string;
  technologies: string[];
}

export interface CandidateProfile {
  id: string;
  name: string;
  target_role: string;
  skills: string[];
  coursework?: string[];
  projects?: ProjectItem[];
  raw_text?: string;
  created_at: string;
  updated_at: string;
}

export interface SkillMatch {
  skill: string;
  matched: boolean;
  is_missing_critical?: boolean;
}

export interface AIEvaluation {
  fit_score: number;
  fit_tier: "high" | "moderate" | "low";
  matched_skills: string[];
  missing_skills: string[];
  role_readiness_summary: string;
  actionable_advice: string;
  is_cached?: boolean;
  evaluated_at?: string;
  full_description?: string;
}
