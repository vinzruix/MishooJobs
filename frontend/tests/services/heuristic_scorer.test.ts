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

  it("calculates 100% when all job skills are matched", () => {
    const candidateSkills = ["Python", "FastAPI", "PostgreSQL", "Docker"];
    const jobSkills = ["Python", "FastAPI"];
    expect(calculateHeuristicScore(candidateSkills, jobSkills)).toBe(100);
  });

  it("calculates accurate partial match percentages", () => {
    const candidateSkills = ["Python", "Git"];
    const jobSkills = ["Python", "Django", "PostgreSQL", "Docker"];
    // 1 of 4 matched = 25%
    expect(calculateHeuristicScore(candidateSkills, jobSkills)).toBe(25);
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
