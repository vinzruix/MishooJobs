import type { MasterProfileData } from "../types/master_profile";

/**
 * Extracts and normalizes unique skills across all 7 tech categories and project items
 * from the Master Career Knowledge Base.
 */
export function extractMasterProfileSkills(profile?: MasterProfileData | null): string[] {
  if (!profile) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  const addSkill = (skill: string) => {
    if (!skill) return;
    const trimmed = skill.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(trimmed);
    }
  };

  // 1. Categorized Tech Stack
  if (profile.tech && typeof profile.tech === "object") {
    const categories: (keyof typeof profile.tech)[] = [
      "backend",
      "frontend",
      "databases",
      "messaging_distributed",
      "ai_data",
      "devops_cloud",
      "tools",
    ];

    for (const cat of categories) {
      const list = profile.tech[cat];
      if (Array.isArray(list)) {
        for (const item of list) {
          if (typeof item === "string") {
            addSkill(item);
          }
        }
      }
    }
  }

  // 2. Project Technologies
  if (Array.isArray(profile.projects)) {
    for (const proj of profile.projects) {
      if (proj && Array.isArray(proj.technologies)) {
        for (const item of proj.technologies) {
          if (typeof item === "string") {
            addSkill(item);
          }
        }
      }
    }
  }

  return result;
}
