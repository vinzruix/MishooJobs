import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { VacancyDetailPane } from "../../src/components/VacancyDetailPane";
import type { JobVacancy } from "../../src/types/job";

vi.mock("../../src/services/api", () => ({
  auditVacancy: vi.fn(),
  evaluateVacancy: vi.fn(),
}));

const mockVacancy: JobVacancy = {
  fingerprint: "vac-test-1",
  title: "Frontend React Developer",
  company_name: "FinTech MX",
  location_city: "Guadalajara",
  location_state: "JAL",
  modality: "remoto",
  seniority_level: "junior",
  years_required_min: 1,
  is_real_first_job: false,
  audit_status: "verified",
  reasoning: "Requiere 1 año de experiencia con React.",
  has_discrepancy: false,
  salary_min: 20000,
  salary_max: 25000,
  currency: "MXN",
  description: "Buscamos desarrollador frontend apasionado por React, TypeScript y Tailwind.",
  skills: ["React", "TypeScript", "Tailwind CSS"],
  published_at: "2026-11-14T10:00:00Z",
  external_links: [
    {
      portal_name: "computrabajo",
      direct_url: "https://computrabajo.com.mx/oferta/123",
      is_active: true,
    },
    {
      portal_name: "indeed",
      direct_url: "https://indeed.com/viewjob?jk=abc",
      is_active: true,
    },
  ],
};

describe("VacancyDetailPane Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state placeholder when no vacancy is selected", () => {
    render(<VacancyDetailPane vacancy={null} />);
    expect(screen.getByText("Selecciona una vacante")).toBeInTheDocument();
    expect(
      screen.getByText(/Haz clic en cualquier vacante del listado para ver sus detalles/i)
    ).toBeInTheDocument();
  });

  it("renders header, company squircle, and pastel metrics when vacancy is provided", () => {
    render(<VacancyDetailPane vacancy={mockVacancy} />);

    expect(screen.getByText("Frontend React Developer")).toBeInTheDocument();
    expect(screen.getByText("FinTech MX")).toBeInTheDocument();
    expect(screen.getByText(/Guadalajara, JAL/)).toBeInTheDocument();
    // Company squircle initial
    expect(screen.getByText("F")).toBeInTheDocument();

    // 4 Pastel metrics present
    expect(screen.getByText("Salario")).toBeInTheDocument();
    expect(screen.getByText("Modalidad")).toBeInTheDocument();
    expect(screen.getByText("Experiencia")).toBeInTheDocument();
    expect(screen.getByText("Nivel")).toBeInTheDocument();
  });

  it("switches between Descripción and Evaluación AI tabs", async () => {
    render(<VacancyDetailPane vacancy={mockVacancy} />);

    // Default tab is Descripción
    expect(screen.getByText("Descripción del Puesto")).toBeInTheDocument();
    expect(
      screen.getByText(/Buscamos desarrollador frontend apasionado por React/)
    ).toBeInTheDocument();

    // Switch to Evaluación AI tab
    const aiTabBtn = screen.getByTestId("tab-ai-eval-btn");
    fireEvent.click(aiTabBtn);

    expect(
      screen.getByText(/Análisis de Brechas & Afinidad Técnica/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId("run-ai-eval-btn")).toBeInTheDocument();

    // Switch back to Descripción
    const descTabBtn = screen.getByTestId("tab-description-btn");
    fireEvent.click(descTabBtn);
    expect(screen.getByText("Descripción del Puesto")).toBeInTheDocument();
  });

  it("triggers close callback when close button is clicked in mobile sheet mode", () => {
    const handleClose = vi.fn();
    render(<VacancyDetailPane vacancy={mockVacancy} isMobileSheet={true} onClose={handleClose} />);

    const closeBtn = screen.getByTestId("detail-pane-close-btn");
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("triggers onSave and onMarkApplied secondary actions", () => {
    const handleSave = vi.fn();
    const handleMarkApplied = vi.fn();

    render(
      <VacancyDetailPane
        vacancy={mockVacancy}
        onSave={handleSave}
        onMarkApplied={handleMarkApplied}
      />
    );

    const saveBtn = screen.getByTestId("save-vacancy-btn");
    fireEvent.click(saveBtn);
    expect(handleSave).toHaveBeenCalledWith(mockVacancy);

    const appliedBtn = screen.getByTestId("mark-applied-btn");
    fireEvent.click(appliedBtn);
    expect(handleMarkApplied).toHaveBeenCalledWith(mockVacancy);
  });

  it("renders primary application link to direct URL", () => {
    render(<VacancyDetailPane vacancy={mockVacancy} />);

    const primaryApply = screen.getByTestId("primary-apply-btn");
    expect(primaryApply).toHaveAttribute("href", "https://computrabajo.com.mx/oferta/123");
    expect(primaryApply).toHaveAttribute("target", "_blank");
  });

  it("displays discrepancy warning if vacancy has discrepancy", () => {
    const discrepancyVacancy: JobVacancy = {
      ...mockVacancy,
      has_discrepancy: true,
      seniority_level: "junior",
      years_required_min: 3,
    };

    render(<VacancyDetailPane vacancy={discrepancyVacancy} />);
    expect(screen.getByText("Requisitos de experiencia discrepantes")).toBeInTheDocument();
  });

  it("renders cached AI evaluation results and triggers tailor CV callback", () => {
    const handleTailor = vi.fn();
    const cachedEval = {
      fit_score: 90,
      fit_tier: "high" as const,
      matched_skills: ["React", "TypeScript"],
      missing_skills: ["Tailwind CSS"],
      role_readiness_summary: "Excelente afinidad con el puesto.",
      actionable_advice: "Crea un proyecto de demostración en Tailwind.",
    };

    render(
      <VacancyDetailPane
        vacancy={mockVacancy}
        cachedEvaluation={cachedEval}
        onOpenTailorModal={handleTailor}
        initialTab="ai_eval"
      />
    );

    expect(screen.getAllByText("90%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Nivel high")).toBeInTheDocument();
    expect(screen.getByText("Excelente afinidad con el puesto.")).toBeInTheDocument();

    const tailorBtn = screen.getByTestId("tailor-cv-btn");
    fireEvent.click(tailorBtn);
    expect(handleTailor).toHaveBeenCalledWith(mockVacancy);

    const aiEvalTailorBtn = screen.getByTestId("ai-eval-tailor-btn");
    fireEvent.click(aiEvalTailorBtn);
    expect(handleTailor).toHaveBeenCalledTimes(2);
  });

  it("renders tailor CV button in default description view and triggers onOpenTailorModal", () => {
    const handleTailor = vi.fn();
    render(
      <VacancyDetailPane
        vacancy={mockVacancy}
        onOpenTailorModal={handleTailor}
      />
    );

    // Primary persistent tailor button in sticky bottom bar
    const tailorBtn = screen.getByTestId("tailor-cv-btn");
    expect(tailorBtn).toBeInTheDocument();
    expect(tailorBtn).toHaveTextContent("Adaptar CV");
    fireEvent.click(tailorBtn);
    expect(handleTailor).toHaveBeenCalledWith(mockVacancy);

    // In-flow callout button in description tab
    const descTailorBtn = screen.getByTestId("desc-tailor-cv-btn");
    expect(descTailorBtn).toBeInTheDocument();
    expect(descTailorBtn).toHaveTextContent("Adaptar mi CV");
    fireEvent.click(descTailorBtn);
    expect(handleTailor).toHaveBeenCalledTimes(2);
  });

  it("isolates evaluation cache strictly by vacancy fingerprint", () => {
    const cachedEval = {
      fit_score: 95,
      fit_tier: "high" as const,
      matched_skills: ["React"],
      missing_skills: [],
      role_readiness_summary: "Afinidad perfecta.",
      actionable_advice: "Postula de inmediato.",
    };

    const { rerender } = render(
      <VacancyDetailPane
        vacancy={mockVacancy}
        cachedEvaluation={cachedEval}
        initialTab="ai_eval"
      />
    );

    expect(screen.getAllByText("95%").length).toBeGreaterThanOrEqual(1);

    // Switch to a new vacancy with NO cached evaluation
    const secondVacancy: JobVacancy = {
      ...mockVacancy,
      fingerprint: "vac-test-2",
      title: "Backend Go Developer",
    };

    rerender(
      <VacancyDetailPane
        vacancy={secondVacancy}
        cachedEvaluation={undefined}
        initialTab="ai_eval"
      />
    );

    // Old evaluation should NOT bleed in
    expect(screen.queryByText("95%")).not.toBeInTheDocument();
    expect(screen.queryByText("Afinidad perfecta.")).not.toBeInTheDocument();
    expect(screen.getByTestId("run-ai-eval-btn")).toBeInTheDocument();
  });

  it("renders a constrained scrollable container with flex-1 min-h-0 overflow-y-auto for desktop scrolling", () => {
    const { container } = render(<VacancyDetailPane vacancy={mockVacancy} />);
    const scrollContainer = container.querySelector(".overflow-y-auto");
    expect(scrollContainer).toBeInTheDocument();
    expect(scrollContainer).toHaveClass("flex-1");
    expect(scrollContainer).toHaveClass("min-h-0");
    expect(scrollContainer).toHaveClass("overflow-y-auto");
  });
});
