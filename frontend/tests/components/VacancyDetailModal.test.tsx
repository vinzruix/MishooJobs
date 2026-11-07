import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { VacancyDetailModal } from "../../src/components/VacancyDetailModal";
import type { JobVacancy } from "../../src/types/job";
import type { CandidateProfile, AIEvaluation } from "../../src/types/profile";

describe("VacancyDetailModal Component Tests", () => {
  const profile: CandidateProfile = {
    id: "p1",
    name: "Alex Dev",
    target_role: "Junior Python Developer",
    skills: ["Python", "SQL"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const vacancyA: JobVacancy = {
    fingerprint: "fp-a-111",
    title: "Desarrollador Python Jr en Empresa Alpha",
    company_name: "Empresa Alpha",
    location_state: "CDMX",
    modality: "remoto",
    category: "junior",
    currency: "MXN",
    description: "Descripción original de la Vacante Alpha.",
    skills: ["Python", "Django"],
    external_links: [],
  };

  const vacancyB: JobVacancy = {
    fingerprint: "fp-b-222",
    title: "Frontend Developer Jr en Empresa Beta",
    company_name: "Empresa Beta",
    location_state: "JAL",
    modality: "hibrido",
    category: "junior",
    currency: "MXN",
    description: "Descripción original de la Vacante Beta.",
    skills: ["React", "TypeScript"],
    external_links: [],
  };

  const evalA: AIEvaluation = {
    fit_score: 90,
    fit_tier: "high",
    matched_skills: ["Python"],
    missing_skills: ["Django"],
    role_readiness_summary: "Excelente afinidad para Vacante Alpha.",
    actionable_advice: "Aprende Django ORM para cubrir la brecha.",
    full_description: "Descripción enriquecida completa de Vacante Alpha por IA.",
  };

  it("renders correctly with vacancy details and allows running AI evaluation when no cached evaluation exists", () => {
    const handleClose = vi.fn();
    render(
      <VacancyDetailModal
        vacancy={vacancyA}
        onClose={handleClose}
        activeProfile={profile}
      />
    );

    expect(screen.getByText("Desarrollador Python Jr en Empresa Alpha")).toBeInTheDocument();
    expect(screen.getByText("Descripción original de la Vacante Alpha.")).toBeInTheDocument();
    expect(screen.getByText("Evaluar con IA (agy)")).toBeInTheDocument();

    const closeBtn = screen.getByText("✕");
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("displays cached evaluation results when available", () => {
    render(
      <VacancyDetailModal
        vacancy={vacancyA}
        onClose={vi.fn()}
        activeProfile={profile}
        cachedEvaluation={evalA}
      />
    );

    expect(screen.getByText("90%")).toBeInTheDocument();
    expect(screen.getByText("Excelente afinidad para Vacante Alpha.")).toBeInTheDocument();
    expect(screen.getByText("Aprende Django ORM para cubrir la brecha.")).toBeInTheDocument();
    expect(screen.getByText("Descripción enriquecida completa de Vacante Alpha por IA.")).toBeInTheDocument();
    expect(screen.queryByText("Evaluar con IA (agy)")).not.toBeInTheDocument();
  });

  it("does not leak previous vacancy evaluation, description, or skills when switching to a different vacancy", () => {
    const { rerender } = render(
      <VacancyDetailModal
        key={vacancyA.fingerprint}
        vacancy={vacancyA}
        onClose={vi.fn()}
        activeProfile={profile}
        cachedEvaluation={evalA}
      />
    );

    // Initial check: Vacancy A evaluation is visible
    expect(screen.getByText("Desarrollador Python Jr en Empresa Alpha")).toBeInTheDocument();
    expect(screen.getByText("Excelente afinidad para Vacante Alpha.")).toBeInTheDocument();

    // Rerender with Vacancy B (no cached evaluation)
    rerender(
      <VacancyDetailModal
        key={vacancyB.fingerprint}
        vacancy={vacancyB}
        onClose={vi.fn()}
        activeProfile={profile}
        cachedEvaluation={undefined}
      />
    );

    // Vacancy B details must be shown
    expect(screen.getByText("Frontend Developer Jr en Empresa Beta")).toBeInTheDocument();
    expect(screen.getByText("Descripción original de la Vacante Beta.")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();

    // Vacancy A details and evaluation must NOT be present
    expect(screen.queryByText("Desarrollador Python Jr en Empresa Alpha")).not.toBeInTheDocument();
    expect(screen.queryByText("Excelente afinidad para Vacante Alpha.")).not.toBeInTheDocument();
    expect(screen.queryByText("Descripción enriquecida completa de Vacante Alpha por IA.")).not.toBeInTheDocument();

    // "Evaluar con IA" button must be available for Vacancy B
    expect(screen.getByText("Evaluar con IA (agy)")).toBeInTheDocument();
  });
});
