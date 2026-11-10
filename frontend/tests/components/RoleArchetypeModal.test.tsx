import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "fake-indexeddb/auto";
import { db } from "../../src/db";
import { RoleArchetypeModal } from "../../src/components/RoleArchetypeModal";
import type { MasterProfileData } from "../../src/types/master_profile";
import * as cvApi from "../../src/services/cv_api";

const completeProfile: MasterProfileData = {
  personal_info: {
    full_name: "Santiago Mendoza Ruiz",
    headline: "Junior Dev",
    email: "test@ciencias.unam.mx",
    phone: "+52",
    location: "CDMX",
    photo: true,
  },
  about_me: "Bio",
  tech: {
    backend: ["Python", "FastAPI"],
    frontend: ["React"],
    databases: ["PostgreSQL"],
    messaging_distributed: [],
    ai_data: ["PyTorch"],
    devops_cloud: [],
    tools: [],
  },
  languages: [{ language: "Español", level: "Nativo" }],
  experience: [
    {
      company: "Company",
      role: "Dev",
      start_date: "2024",
      end_date: "Presente",
      current: true,
      highlights: ["H1"],
    },
  ],
  projects: [],
  education: [],
  certificates: [],
  logros_academicos: [],
};

describe("RoleArchetypeModal Component Tests", () => {
  beforeEach(async () => {
    await db.resumes.clear();
    vi.restoreAllMocks();
  });

  it("allows entering target role title and adding/removing focus tags", () => {
    render(
      <RoleArchetypeModal
        isOpen={true}
        onClose={() => {}}
        masterProfile={completeProfile}
        onSuccess={() => {}}
      />
    );

    const roleInput = screen.getByLabelText("Título del Rol Objetivo:");
    fireEvent.change(roleInput, { target: { value: "AI Engineer" } });
    expect(roleInput).toHaveValue("AI Engineer");

    const tagInput = screen.getByLabelText("Etiquetas de Enfoque Tecnológico:");
    fireEvent.change(tagInput, { target: { value: "PyTorch" } });
    fireEvent.click(screen.getByTestId("add-tag-btn"));

    expect(screen.getByText("PyTorch")).toBeInTheDocument();

    const removeBtn = screen.getByLabelText("Eliminar PyTorch");
    fireEvent.click(removeBtn);
    expect(screen.queryByText("PyTorch")).not.toBeInTheDocument();
  });

  it("toggles language between Spanish and English", () => {
    render(
      <RoleArchetypeModal
        isOpen={true}
        onClose={() => {}}
        masterProfile={completeProfile}
        onSuccess={() => {}}
      />
    );

    const enBtn = screen.getByTestId("role-lang-en-btn");
    fireEvent.click(enBtn);
    expect(enBtn).toHaveClass("bg-emerald-600");
  });

  it("calls generateRoleCV API, persists role archetype resume in Dexie, and calls onSuccess", async () => {
    const onSuccess = vi.fn();

    vi.spyOn(cvApi, "generateRoleCV").mockResolvedValueOnce({
      content: {
        header: {
          full_name: "Santiago Mendoza Ruiz",
          headline: "AI Engineer",
          email: "test@ciencias.unam.mx",
          phone: "+52",
          location: "CDMX",
          links: [],
          about_me: "Bio",
        },
        skills_categorized: { "AI / Data": ["PyTorch"] },
        languages: [{ language: "Español", level: "Nativo" }],
        experience: [],
        projects: [],
        education: [],
        certificates: [],
        logros_academicos: [],
      },
      ats_match_score: 90,
      word_count: 210,
    });

    render(
      <RoleArchetypeModal
        isOpen={true}
        onClose={() => {}}
        masterProfile={completeProfile}
        onSuccess={onSuccess}
      />
    );

    const roleInput = screen.getByLabelText("Título del Rol Objetivo:");
    fireEvent.change(roleInput, { target: { value: "AI Engineer" } });

    const submitBtn = screen.getByTestId("generate-role-cv-submit-btn");
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });

    const saved = await db.resumes.toArray();
    expect(saved.length).toBe(1);
    expect(saved[0].type).toBe("role_archetype");
    expect(saved[0].target_role).toBe("AI Engineer");
  });
});
