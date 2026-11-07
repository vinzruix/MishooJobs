import { describe, it, expect } from "vitest";
import { calculateHeuristicScore, normalizeSkill } from "../../src/services/heuristic_scorer";

describe("heuristic_scorer", () => {
  it("normalizes skill strings correctly", () => {
    expect(normalizeSkill("React.js")).toBe("reactjs");
    expect(normalizeSkill("Node.js")).toBe("nodejs");
    expect(normalizeSkill("C#")).toBe("c#");
    expect(normalizeSkill("TypeScript")).toBe("typescript");
    expect(normalizeSkill("Programación")).toBe("programacion");
  });

  it("calculates high compatibility when skills and role align", () => {
    const candidateSkills = ["Python", "FastAPI", "PostgreSQL", "Docker"];
    const jobSkills = ["Python", "FastAPI"];
    const score = calculateHeuristicScore(candidateSkills, jobSkills, {
      jobTitle: "Junior Backend Developer",
      targetRole: "Junior Backend Developer",
      category: "junior",
    });
    // High compatibility tier (>= 80%)
    expect(score).toBeGreaterThanOrEqual(80);
    expect(score).toBeLessThanOrEqual(98);
  });

  it("calculates realistic graduated percentages for partial matches", () => {
    const candidateSkills = ["Python", "Git"];
    const jobSkills = ["Python", "Django", "PostgreSQL", "Docker"];
    const score = calculateHeuristicScore(candidateSkills, jobSkills, {
      jobTitle: "Desarrollador Python Junior",
      targetRole: "Junior Backend Developer",
      category: "junior",
    });
    // Should be a nuanced score around 40-60%, not flat 0%, 10% or 100%
    expect(score).toBeGreaterThanOrEqual(35);
    expect(score).toBeLessThanOrEqual(65);
  });

  it("returns 0% when no job skills match", () => {
    const candidateSkills = ["React", "TypeScript"];
    const jobSkills = ["Python", "Django"];
    expect(calculateHeuristicScore(candidateSkills, jobSkills)).toBe(0);
  });

  it("returns 0% when candidate has no skills", () => {
    expect(calculateHeuristicScore([], ["Python", "React"])).toBe(0);
  });

  it("uses fallback text when jobSkills array is empty", () => {
    const candidateSkills = ["Python", "FastAPI"];
    // Fallback title mentions Python
    const score = calculateHeuristicScore(
      candidateSkills,
      [],
      "Desarrollador Python Junior en Guadalajara"
    );
    expect(score).toBe(50); // 1 of 2 candidate skills found in text
  });

  it("returns 0% when jobSkills is empty and fallback text has no matches", () => {
    const candidateSkills = ["Python", "FastAPI"];
    const score = calculateHeuristicScore(
      candidateSkills,
      [],
      "Contador General y Auditor de Nómina"
    );
    expect(score).toBe(0);
  });
});
