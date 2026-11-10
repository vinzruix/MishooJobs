import type { MasterProfileData } from "../types/master_profile";
import type { GeneratedCVContent } from "../types/resume";

export interface ParseResumeResponse {
  yaml_content: string;
  warnings: string[];
}

export interface GenerateTailoredCVRequest {
  master_profile: MasterProfileData;
  vacancy_title: string;
  vacancy_company: string;
  job_description: string;
  vacancy_fingerprint?: string;
  desired_skills?: string[];
  language?: "es" | "en";
}

export interface GenerateRoleCVRequest {
  master_profile: MasterProfileData;
  target_role_title: string;
  focus_tags?: string[];
  language?: "es" | "en";
}

export interface GenerateCVResponse {
  content: GeneratedCVContent;
  ats_match_score: number;
  word_count: number;
  curation_notes?: string;
}

export async function parseResume(file: File): Promise<ParseResumeResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/cv/parse-resume", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Error al analizar currículum (${response.status})`);
  }

  return response.json();
}

export async function generateTailoredCV(
  request: GenerateTailoredCVRequest
): Promise<GenerateCVResponse> {
  const response = await fetch("/cv/generate-tailored", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Error al generar CV adaptado (${response.status})`);
  }

  return response.json();
}

export async function generateRoleCV(
  request: GenerateRoleCVRequest
): Promise<GenerateCVResponse> {
  const response = await fetch("/cv/generate-role", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Error al generar CV por rol (${response.status})`);
  }

  return response.json();
}
