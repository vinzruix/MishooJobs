import type { AIEvaluation } from "../types/profile";
import type { ScamReport } from "../types/job";

export interface EvaluationPayload {
  vacancy_fingerprint: string;
  target_role: string;
  candidate_skills: string[];
  job_description: string;
  direct_url?: string;
  desired_skills?: string[];
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
    let msg = `Error en evaluación: HTTP ${response.status}`;
    if (typeof errorData.detail === "string") {
      msg = errorData.detail;
    } else if (Array.isArray(errorData.detail)) {
      msg = errorData.detail
        .map((e: any) => (typeof e === "object" ? e.msg || JSON.stringify(e) : String(e)))
        .join("; ");
    } else if (errorData.detail && typeof errorData.detail === "object") {
      msg = JSON.stringify(errorData.detail);
    } else if (errorData.message) {
      msg = String(errorData.message);
    }
    throw new Error(msg);
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
