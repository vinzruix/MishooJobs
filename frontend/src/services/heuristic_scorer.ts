export function normalizeSkill(skill: string): string {
  return skill
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.\-_\s]/g, "");
}

export function calculateHeuristicScore(
  candidateSkills: string[],
  jobSkills: string[],
  fallbackText?: string
): number {
  if (!candidateSkills || candidateSkills.length === 0) return 0;

  const candNorm = new Set(candidateSkills.map(normalizeSkill));

  // If specific job skills are tagged, calculate exact token overlap
  if (jobSkills && jobSkills.length > 0) {
    let matchedCount = 0;
    for (const jSkill of jobSkills) {
      const jNorm = normalizeSkill(jSkill);
      for (const cNorm of candNorm) {
        if (
          cNorm === jNorm ||
          (cNorm.length >= 3 && jNorm.length >= 3 && (cNorm.includes(jNorm) || jNorm.includes(cNorm)))
        ) {
          matchedCount++;
          break;
        }
      }
    }
    const ratio = matchedCount / jobSkills.length;
    return Math.min(100, Math.max(0, Math.round(ratio * 100)));
  }

  // Fallback: If no explicit job skills tagged, search candidate skills inside fallback text (title + description)
  if (fallbackText && fallbackText.trim().length > 0) {
    const textNorm = normalizeSkill(fallbackText);
    let matchedCandidateSkills = 0;
    for (const cNorm of candNorm) {
      if (cNorm.length >= 3 && textNorm.includes(cNorm)) {
        matchedCandidateSkills++;
      }
    }
    if (matchedCandidateSkills > 0) {
      const ratio = matchedCandidateSkills / candidateSkills.length;
      return Math.min(100, Math.max(10, Math.round(ratio * 100)));
    }
    return 0;
  }

  return 0;
}
