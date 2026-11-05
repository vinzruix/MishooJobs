import * as pdfjsLib from "pdfjs-dist";
import type { CandidateProfile } from "../types/profile";

// Configure worker for pdfjs-dist if in browser
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const COMMON_SKILLS = [
  "Python", "JavaScript", "TypeScript", "React", "Vue", "Angular", "Node.js", "Express",
  "FastAPI", "Django", "Flask", "Java", "Spring Boot", "C#", ".NET", "Golang", "Rust",
  "C++", "PHP", "Laravel", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis",
  "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Git", "GitHub", "Linux",
  "Tailwind CSS", "HTML", "CSS", "Next.js", "REST", "GraphQL", "CI/CD"
];

export function extractSkillsFromText(text: string): string[] {
  const found: string[] = [];
  const lower = ` ${text.toLowerCase()} `;
  for (const skill of COMMON_SKILLS) {
    const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(?:\\b|\\s)${escaped}(?:\\b|\\s)`, "i");
    if (pattern.test(lower)) {
      found.push(skill);
    }
  }
  return found;
}

export function extractTargetRole(text: string): string {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    const clean = line.replace(/^[#*-]\s*/, "");
    if (clean.length > 3 && clean.length < 50 && !clean.includes("@")) {
      return clean;
    }
  }
  return "Junior Software Engineer";
}

export function extractCoursework(text: string): string[] {
  const courses: string[] = [];
  const lines = text.split("\n");
  let inCourseSection = false;

  for (const line of lines) {
    const l = line.toLowerCase();
    if (l.includes("materias") || l.includes("cursos") || l.includes("coursework") || l.includes("educación")) {
      inCourseSection = true;
      continue;
    }
    if (inCourseSection) {
      if (line.startsWith("#") || line.toLowerCase().includes("experiencia") || line.toLowerCase().includes("habilidades")) {
        break;
      }
      const item = line.replace(/^[-*•]\s*/, "").trim();
      if (item && item.length > 3) {
        courses.push(item);
      }
    }
  }
  return courses;
}

export async function parsePdfFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    fullText += pageText + "\n";
  }

  return fullText;
}

export async function parseResumeFile(file: File): Promise<CandidateProfile> {
  let rawText = "";

  if (file.name.endsWith(".pdf")) {
    rawText = await parsePdfFile(file);
  } else {
    rawText = await file.text();
  }

  const skills = extractSkillsFromText(rawText);
  const targetRole = extractTargetRole(rawText);
  const coursework = extractCoursework(rawText);
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    name: file.name.replace(/\.[^/.]+$/, ""),
    target_role: targetRole,
    skills,
    coursework,
    raw_text: rawText,
    created_at: now,
    updated_at: now,
  };
}
