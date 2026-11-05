export function normalizeSkill(skill: string): string {
  return skill
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.\-_\s]/g, "");
}

export function calculateHeuristicScore(
  candidateSkills: string[],
  jobSkills: string[]
): number {
  if (!candidateSkills || candidateSkills.length === 0) return 0;
  if (!jobSkills || jobSkills.length === 0) return 50; // Neutral baseline if no specific skills tagged

  const candNorm = new Set(candidateSkills.map(normalizeSkill));
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
