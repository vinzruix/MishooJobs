export type TemplateId = "technical_high_density" | "classic_ats" | "modern_executive";

export interface GeneratedCVHeader {
  full_name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  links: Array<{ label: string; url: string }>;
  about_me: string;
}

export interface GeneratedCVExperienceItem {
  company: string;
  role: string;
  location?: string;
  period: string;
  highlights: string[];
}

export interface GeneratedCVProjectItem {
  name: string;
  description: string;
  technologies: string[];
  link?: string;
  highlights: string[];
}

export interface GeneratedCVEducationItem {
  institution: string;
  degree: string;
  period: string;
  details?: string;
}

export interface GeneratedCVCertificateItem {
  name: string;
  issuer: string;
  date: string;
}

export interface GeneratedCVLogroAcademicoItem {
  title: string;
  organization: string;
  date: string;
  description: string;
}

export interface GeneratedCVContent {
  header: GeneratedCVHeader;
  skills_categorized: Record<string, string[]>;
  languages: Array<{ language: string; level: string }>;
  experience: GeneratedCVExperienceItem[];
  projects: GeneratedCVProjectItem[];
  education: GeneratedCVEducationItem[];
  certificates: GeneratedCVCertificateItem[];
  logros_academicos: GeneratedCVLogroAcademicoItem[];
}

export interface GeneratedResumeRecord {
  id: string; // UUID v4
  type: "vacancy" | "role_archetype";
  title: string;
  target_role: string;
  language: "es" | "en";
  vacancy_fingerprint?: string;
  vacancy_company?: string;
  vacancy_title?: string;
  template_id: TemplateId;
  photo_enabled: boolean;
  content: GeneratedCVContent;
  ats_match_score?: number;
  revision: number;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}
