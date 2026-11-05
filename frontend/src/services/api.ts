import type { AIEvaluation } from "../types/profile";
import type { ScamReport } from "../types/job";

export interface EvaluationPayload {
  vacancy_fingerprint: string;
  target_role: string;
  candidate_skills: string[];
  job_description: string;
}

export async function evaluateVacancy(payload: EvaluationPayload): Promise<AIEvaluation> {
  const response = await fetch("/api/v1/vacancies/evaluate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `Error en evaluación: HTTP ${response.status}`);
  }

  return response.json();
}

export async function fetchScamReport(fingerprint: string): Promise<ScamReport> {
  const response = await fetch(`/api/v1/vacancies/${encodeURIComponent(fingerprint)}/scam-report`);
  if (!response.ok) {
    throw new Error(`Error al consultar reporte de fraude: HTTP ${response.status}`);
  }
  return response.json();
}
