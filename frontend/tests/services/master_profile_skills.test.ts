import { describe, it, expect } from "vitest";
import type { MasterProfileData } from "../../src/types/master_profile";
import { extractMasterProfileSkills } from "../../src/services/master_profile_skills";

describe("master_profile_skills", () => {
  const mockProfile: MasterProfileData = {
    personal_info: {
      full_name: "Santiago Mendoza Ruiz",
      headline: "Backend Dev",
      email: "test@example.com",
      phone: "+52",
      location: "CDMX",
      photo: false,
    },
    about_me: "Bio",
    tech: {
      backend: ["Python", "FastAPI", "Django"],
      frontend: ["React", "TypeScript", "Tailwind CSS"],
      databases: ["PostgreSQL", "Redis"],
      messaging_distributed: ["RabbitMQ", "Celery"],
      ai_data: ["Pandas", "PyTorch"],
      devops_cloud: ["Docker", "Git"],
      tools: ["Linux", "Pytest"],
    },
    languages: [{ language: "Español", level: "Nativo" }],
    experience: [],
    projects: [
      {
        name: "Project 1",
        description: "Test",
        technologies: ["FastAPI", "PostgreSQL", "Docker", "GraphQL"],
        highlights: ["Highlight 1"],
      },
    ],
    education: [],
    certificates: [],
    logros_academicos: [],
  };

  it("extracts all unique skills across categorized tech and projects", () => {
    const skills = extractMasterProfileSkills(mockProfile);

    // Should include tech stack categories
    expect(skills).toContain("Python");
    expect(skills).toContain("FastAPI");
    expect(skills).toContain("Django");
    expect(skills).toContain("React");
    expect(skills).toContain("TypeScript");
    expect(skills).toContain("Tailwind CSS");
    expect(skills).toContain("PostgreSQL");
    expect(skills).toContain("Redis");
    expect(skills).toContain("RabbitMQ");
    expect(skills).toContain("Celery");
    expect(skills).toContain("Pandas");
    expect(skills).toContain("PyTorch");
    expect(skills).toContain("Docker");
    expect(skills).toContain("Git");
    expect(skills).toContain("Linux");
    expect(skills).toContain("Pytest");

    // Should include project technologies not in tech stack
    expect(skills).toContain("GraphQL");

    // Should be deduplicated (FastAPI, PostgreSQL, Docker appear in tech and project)
    const fastApiCount = skills.filter((s) => s.toLowerCase() === "fastapi").length;
    expect(fastApiCount).toBe(1);
  });

  it("handles empty tech categories and empty projects gracefully", () => {
    const emptyProfile: MasterProfileData = {
      ...mockProfile,
      tech: {
        backend: [],
        frontend: [],
        databases: [],
        messaging_distributed: [],
        ai_data: [],
        devops_cloud: [],
        tools: [],
      },
      projects: [],
    };

    const skills = extractMasterProfileSkills(emptyProfile);
    expect(skills).toEqual([]);
  });
});
