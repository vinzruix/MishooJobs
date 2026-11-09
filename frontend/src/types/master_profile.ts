export interface PersonalInfo {
  full_name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  github?: string;
  linkedin?: string;
  photo: boolean;
}

export interface CategorizedTechStack {
  backend: string[];
  frontend: string[];
  databases: string[];
  messaging_distributed: string[];
  ai_data: string[];
  devops_cloud: string[];
  tools: string[];
}

export interface LanguageItem {
  language: string;
  level: string;
}

export interface ExperienceItem {
  company: string;
  role: string;
  location?: string;
  start_date: string;
  end_date: string;
  current: boolean;
  highlights: string[];
}

export interface ProjectItem {
  name: string;
  description: string;
  technologies: string[];
  link?: string;
  highlights: string[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date: string;
  gpa?: string;
  current: boolean;
}

export interface CertificateItem {
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
  url?: string;
}

export interface LogroAcademicoItem {
  title: string;
  organization: string;
  date: string;
  description: string;
}

export interface MasterProfileData {
  personal_info: PersonalInfo;
  about_me: string;
  tech: CategorizedTechStack;
  languages: LanguageItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certificates: CertificateItem[];
  logros_academicos: LogroAcademicoItem[];
}

export interface MasterProfileRecord {
  id: string; // "current"
  raw_yaml: string;
  parsed: MasterProfileData;
  updated_at: string; // ISO 8601
}

export interface MasterProfilePhotoRecord {
  id: string; // "current"
  blob: Blob;
  mime_type: string;
  updated_at: string; // ISO 8601
}
