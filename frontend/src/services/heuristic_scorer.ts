import type { SeniorityLevel } from "../types/job";

export function normalizeSkill(skill: string): string {
  return skill
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.\-_\s]/g, "");
}

function normalizeWords(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

const STOP_WORDS = new Set([
  "de", "en", "para", "el", "la", "los", "las", "un", "una", "y", "o", "a", "con", "por", "del", "al"
]);

const TECH_DOMAIN_WORDS = new Set([
  "software", "desarrollo", "desarrollador", "programacion", "programador",
  "sistemas", "ti", "it", "computacion", "developer", "informatica",
  "backend", "frontend", "web", "datos", "data", "qa", "devops", "cloud",
  "ingeniero", "tecnologia", "fullstack", "mobile", "full"
]);

const SYNONYMS: Record<string, string[]> = {
  developer: ["desarrollador", "desarrollo", "programador", "ingeniero", "software", "dev"],
  desarrollador: ["developer", "desarrollo", "programador", "ingeniero", "software", "dev"],
  backend: ["back", "api", "servidor", "datos", "data"],
  frontend: ["front", "web", "ui", "ux", "react", "vue", "angular"],
  junior: ["jr", "trainee", "becario", "practicas", "practicante", "pasante"],
  jr: ["junior", "trainee", "becario", "practicas", "practicante", "pasante"],
  sistemas: ["ti", "software", "computacion", "informatica", "it"],
  datos: ["data", "analytics", "sql", "bi", "analista"],
};

export interface CompatibilityOptions {
  fallbackText?: string;
  targetRole?: string;
  jobTitle?: string;
  seniority_level?: SeniorityLevel | string;
  category?: string;
}

export function calculateHeuristicScore(
  candidateSkills: string[],
  jobSkills: string[],
  options?: string | CompatibilityOptions
): number {
  if (!candidateSkills || candidateSkills.length === 0) return 0;

  const fallbackText = typeof options === "string" ? options : options?.fallbackText || "";
  const targetRole = typeof options === "object" ? options?.targetRole || "" : "";
  const jobTitle = typeof options === "object" ? options?.jobTitle || "" : "";
  const seniority = typeof options === "object" ? options?.seniority_level || options?.category || "" : "";

  const candNorm = candidateSkills.map(normalizeSkill);

  // 1. Technical Skills Score (S_tech)
  let sTech = 0;
  if (jobSkills && jobSkills.length > 0) {
    let matchedJob = 0;
    for (const jSkill of jobSkills) {
      const jNorm = normalizeSkill(jSkill);
      for (const cNorm of candNorm) {
        if (
          cNorm === jNorm ||
          (cNorm.length >= 3 && jNorm.length >= 3 && (cNorm.includes(jNorm) || jNorm.includes(cNorm)))
        ) {
          matchedJob++;
          break;
        }
      }
    }

    let matchedCand = 0;
    for (const cNorm of candNorm) {
      for (const jSkill of jobSkills) {
        const jNorm = normalizeSkill(jSkill);
        if (
          cNorm === jNorm ||
          (cNorm.length >= 3 && jNorm.length >= 3 && (cNorm.includes(jNorm) || jNorm.includes(cNorm)))
        ) {
          matchedCand++;
          break;
        }
      }
    }

    const rJob = matchedJob / jobSkills.length;
    const rCand = matchedCand / candidateSkills.length;
    // Harmonic balance: 65% on meeting job requirements, 35% on candidate skill breadth
    sTech = (0.65 * rJob + 0.35 * rCand) * 100;
  } else if (fallbackText && fallbackText.trim().length > 0) {
    const textNorm = normalizeSkill(fallbackText);
    let matchedInText = 0;
    for (const cNorm of candNorm) {
      if (cNorm.length >= 3 && textNorm.includes(cNorm)) {
        matchedInText++;
      }
    }
    if (matchedInText > 0) {
      const denom = Math.max(1, Math.min(candidateSkills.length, 3));
      sTech = Math.min(85, (matchedInText / denom) * 65);
    }
  }

  // 2. Role Title & Domain Alignment (S_role)
  const combinedTitleText = `${jobTitle} ${seniority} ${fallbackText}`;
  const titleWords = new Set(normalizeWords(combinedTitleText));

  let sRole = 50;
  if (targetRole && targetRole.trim().length > 0) {
    const roleTokens = normalizeWords(targetRole).filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
    if (roleTokens.length > 0) {
      let matchedCount = 0;
      for (const tok of roleTokens) {
        const variants = [tok, ...(SYNONYMS[tok] || [])];
        if (variants.some((v) => titleWords.has(v) || combinedTitleText.toLowerCase().includes(v))) {
          matchedCount++;
        }
      }
      sRole = (matchedCount / roleTokens.length) * 100;
    }
  }

  // Domain affinity check
  const hasTechAffinity = Array.from(TECH_DOMAIN_WORDS).some((tw) => titleWords.has(tw));

  // If no technical match and no domain relevance, return 0%
  if (sTech === 0 && !hasTechAffinity) {
    return 0;
  }

  // 3. Seniority Level Fit (S_level)
  const senLevel = (options && typeof options === "object" ? options.seniority_level || options.category || "" : "").toLowerCase();

  const isSenior =
    senLevel === "senior" ||
    ["sr", "senior", "lider", "lead", "gerente", "arquitecto", "principal", "director"].some((w) =>
      titleWords.has(w)
    );
  const isMid =
    senLevel === "mid" ||
    ["mid", "semi senior", "ssr"].some((w) => titleWords.has(w));
  const isFirstJob =
    senLevel === "primer_empleo" ||
    ["primer empleo", "sin experiencia"].some((w) => combinedTitleText.toLowerCase().includes(w));
  const isPasantia =
    senLevel === "pasantia" ||
    ["becario", "practicas", "residencias", "servicio social", "estadias"].some((w) => titleWords.has(w));
  const isJunior =
    senLevel === "junior" ||
    ["jr", "junior", "trainee"].some((w) => titleWords.has(w));

  let sLevel = 75; // neutral baseline
  if (isSenior) {
    sLevel = 25; // penalty for senior postings
  } else if (isMid) {
    sLevel = 50; // penalty for mid postings
  } else if (isFirstJob) {
    sLevel = 100; // full fit weight for 0-exp primer empleo
  } else if (isJunior) {
    sLevel = 95; // full fit weight for junior
  } else if (isPasantia) {
    sLevel = 75; // neutral for pasantia
  }

  // Weighted composite score: 50% tech stack, 30% role title, 20% seniority
  const finalScore = Math.round(0.50 * sTech + 0.30 * sRole + 0.20 * sLevel);
  return Math.min(98, Math.max(0, finalScore));
}
