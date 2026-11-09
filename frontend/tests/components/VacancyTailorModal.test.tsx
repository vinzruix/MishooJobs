import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "fake-indexeddb/auto";
import { db } from "../../src/db";
import { VacancyTailorModal } from "../../src/components/VacancyTailorModal";
import type { JobVacancy } from "../../src/types/job";
import type { MasterProfileData } from "../../src/types/master_profile";
import * as cvApi from "../../src/services/cv_api";

const mockVacancy: JobVacancy = {
  fingerprint: "test-vac-123",
  title: "Desarrollador Python Junior",
  company_name: "FinTech MX",
  location_state: "CDMX",
  modality: "remoto",
  seniority_level: "junior",
  years_required_min: 1,
  is_real_first_job: false,
  audit_status: "verified",
  reasoning: "Posición junior estándar.",
  has_discrepancy: false,
  currency: "MXN",
  description: "Buscamos desarrollador Python con FastAPI.",
  skills: ["Python", "FastAPI"],
  external_links: [],
};

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
    ai_data: [],
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

describe("VacancyTailorModal Component Tests", () => {
  beforeEach(async () => {
    await db.resumes.clear();
    vi.restoreAllMocks();
  });

  it("renders target vacancy details and defaults to Spanish language", () => {
    render(
      <VacancyTailorModal
        isOpen={true}
        onClose={() => {}}
        vacancy={mockVacancy}
        masterProfile={completeProfile}
        onSuccess={() => {}}
      />
    );

    expect(screen.getByText("Desarrollador Python Junior")).toBeInTheDocument();
    expect(screen.getByText("FinTech MX")).toBeInTheDocument();
    expect(screen.getByTestId("lang-es-btn")).toHaveClass("bg-emerald-600");
  });

  it("toggles language between Spanish and English", () => {
    render(
      <VacancyTailorModal
        isOpen={true}
        onClose={() => {}}
        vacancy={mockVacancy}
        masterProfile={completeProfile}
        onSuccess={() => {}}
      />
    );

    const enBtn = screen.getByTestId("lang-en-btn");
    fireEvent.click(enBtn);
    expect(enBtn).toHaveClass("bg-emerald-600");
    expect(screen.getByTestId("lang-es-btn")).not.toHaveClass("bg-emerald-600");
  });

  it("disables generate button and shows alert when profile is incomplete", () => {
    const incompleteProfile: MasterProfileData = {
      ...completeProfile,
      experience: [],
      projects: [],
    };

    render(
      <VacancyTailorModal
        isOpen={true}
        onClose={() => {}}
        vacancy={mockVacancy}
        masterProfile={incompleteProfile}
        onSuccess={() => {}}
      />
    );

    expect(screen.getByTestId("incomplete-profile-alert")).toBeInTheDocument();
    const generateBtn = screen.getByTestId("generate-cv-submit-btn");
    expect(generateBtn).toBeDisabled();
  });

  it("calls API, saves tailored resume to Dexie, and triggers onSuccess", async () => {
    const onSuccess = vi.fn();

    vi.spyOn(cvApi, "generateTailoredCV").mockResolvedValueOnce({
      content: {
        header: {
          full_name: "Santiago Mendoza Ruiz",
          headline: "Junior Dev",
          email: "test@ciencias.unam.mx",
          phone: "+52",
          location: "CDMX",
          links: [],
          about_me: "Bio",
        },
        skills_categorized: { Backend: ["Python", "FastAPI"] },
        languages: [{ language: "Español", level: "Nativo" }],
        experience: [],
        projects: [],
        education: [],
        certificates: [],
        logros_academicos: [],
      },
      ats_match_score: 95,
      word_count: 240,
    });

    render(
      <VacancyTailorModal
        isOpen={true}
        onClose={() => {}}
        vacancy={mockVacancy}
        masterProfile={completeProfile}
        onSuccess={onSuccess}
      />
    );

    const generateBtn = screen.getByTestId("generate-cv-submit-btn");
    expect(generateBtn).not.toBeDisabled();
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });

    const saved = await db.resumes.toArray();
    expect(saved.length).toBe(1);
    expect(saved[0].vacancy_fingerprint).toBe(mockVacancy.fingerprint);
    expect(saved[0].type).toBe("vacancy");
    expect(saved[0].revision).toBe(1);
  });
});
