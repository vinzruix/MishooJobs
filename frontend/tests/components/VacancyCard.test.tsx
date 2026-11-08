import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { VacancyCard } from "../../src/components/VacancyCard";
import { ScamBadge } from "../../src/components/ScamBadge";
import { FitScoreBadge } from "../../src/components/FitScoreBadge";
import type { JobVacancy } from "../../src/types/job";

describe("Frontend Component Tests", () => {
  const sampleVacancy: JobVacancy = {
    fingerprint: "test-fp-12345678",
    title: "Desarrollador Python Junior",
    company_name: "Tech Solutions MX",
    location_city: "Guadalajara",
    location_state: "JAL",
    modality: "hibrido",
    seniority_level: "junior",
    years_required_min: 1,
    is_real_first_job: false,
    audit_status: "preliminary",
    reasoning: "Junior con 1 año de experiencia",
    has_discrepancy: false,
    salary_min: 15000,
    salary_max: 18000,
    salary_period: "mensual",
    currency: "MXN",
    description: "Vacante junior para desarrollo backend.",
    skills: ["Python", "FastAPI", "SQL"],
    external_links: [
      {
        portal_name: "computrabajo",
        direct_url: "https://mx.computrabajo.com/oferta/1",
        is_active: true,
      },
    ],
  };

  it("renders VacancyCard correctly with MXN salary and direct links", () => {
    const handleInspect = vi.fn();
    render(
      <VacancyCard
        vacancy={sampleVacancy}
        fitScore={85}
        onInspect={handleInspect}
      />
    );

    expect(screen.getByText("Desarrollador Python Junior")).toBeInTheDocument();
    expect(screen.getByText("Tech Solutions MX")).toBeInTheDocument();
    expect(screen.getByText(/15,000/)).toBeInTheDocument();
    expect(screen.getByText("85% Match")).toBeInTheDocument();
    expect(screen.getByText("[ JR ]")).toBeInTheDocument();

    const detailsButton = screen.getByText("Detalles");
    fireEvent.click(detailsButton);
    expect(handleInspect).toHaveBeenCalledWith(sampleVacancy);
  });

  it("renders only one platform button on the card even if vacancy has multiple merged links", () => {
    const multiLinkVacancy: JobVacancy = {
      ...sampleVacancy,
      external_links: [
        {
          portal_name: "indeed",
          direct_url: "https://mx.indeed.com/viewjob?jk=123",
          is_active: true,
        },
        {
          portal_name: "computrabajo",
          direct_url: "https://mx.computrabajo.com/oferta/456",
          is_active: true,
        },
      ],
    };

    render(
      <VacancyCard
        vacancy={multiLinkVacancy}
        onInspect={vi.fn()}
      />
    );

    expect(screen.getByText("indeed")).toBeInTheDocument();
    expect(screen.queryByText("computrabajo")).not.toBeInTheDocument();
  });

  it("renders ScamBadge with critical risk warning", () => {
    render(
      <ScamBadge
        report={{
          risk_level: "critical",
          risk_categories: ["MLM_SCHEME"],
          matched_indicators: ["3000 a 5000 semanales"],
          badge_label: "[POSIBLE FRAUDE / PIRAMIDAL]",
          explanation: "Actividades de oficina sospechosas.",
        }}
      />
    );

    expect(screen.getByText("[POSIBLE FRAUDE / PIRAMIDAL]")).toBeInTheDocument();
  });

  it("renders FitScoreBadge with color tier", () => {
    render(<FitScoreBadge score={92} tier="high" />);
    expect(screen.getByText("92% Compatibilidad")).toBeInTheDocument();
  });

  it("renders 'Nueva' badge and relative time for fresh vacancy (<= 48h)", () => {
    const fixedNow = new Date("2026-11-06T12:00:00Z");
    const freshVacancy: JobVacancy = {
      ...sampleVacancy,
      published_at: "2026-11-06T10:00:00Z", // 2 hours ago
    };

    render(
      <VacancyCard
        vacancy={freshVacancy}
        now={fixedNow}
        onInspect={vi.fn()}
      />
    );

    expect(screen.getByText("Nueva")).toBeInTheDocument();
    expect(screen.getByText("Hace 2 horas")).toBeInTheDocument();
  });

  it("does not render 'Nueva' badge for older vacancy (> 48h) or null date", () => {
    const fixedNow = new Date("2026-11-06T12:00:00Z");
    const olderVacancy: JobVacancy = {
      ...sampleVacancy,
      published_at: "2026-11-03T12:00:00Z", // 3 days ago
    };

    const { rerender } = render(
      <VacancyCard
        vacancy={olderVacancy}
        now={fixedNow}
        onInspect={vi.fn()}
      />
    );

    expect(screen.queryByText("Nueva")).not.toBeInTheDocument();
    expect(screen.getByText("Hace 3 días")).toBeInTheDocument();

    const nullDateVacancy: JobVacancy = {
      ...sampleVacancy,
      published_at: null,
    };

    rerender(
      <VacancyCard
        vacancy={nullDateVacancy}
        now={fixedNow}
        onInspect={vi.fn()}
      />
    );

    expect(screen.queryByText("Nueva")).not.toBeInTheDocument();
    expect(screen.getByText("Fecha no especificada")).toBeInTheDocument();
  });

  it("renders amber discrepancy warning tag [ REQUISITOS DISCREPANTES ] when has_discrepancy is true", () => {
    const discrepantVacancy: JobVacancy = {
      ...sampleVacancy,
      seniority_level: "mid",
      years_required_min: 3,
      has_discrepancy: true,
      reasoning: "Título marcado como Junior pero exige 3 años de experiencia.",
    };

    render(
      <VacancyCard
        vacancy={discrepantVacancy}
        onInspect={vi.fn()}
      />
    );

    expect(screen.getByText("[ REQ. DISCREPANTES ]")).toBeInTheDocument();
    expect(screen.getByText("[ MID ]")).toBeInTheDocument();
  });

  it("renders emerald primer empleo real badge with verified indicator", () => {
    const verifiedFirstJob: JobVacancy = {
      ...sampleVacancy,
      seniority_level: "primer_empleo",
      years_required_min: 0,
      is_real_first_job: true,
      audit_status: "verified",
    };

    const { rerender } = render(
      <VacancyCard
        vacancy={verifiedFirstJob}
        onInspect={vi.fn()}
      />
    );

    expect(screen.getByText("[ ✓ 0 EXP ]")).toBeInTheDocument();

    const preliminaryFirstJob: JobVacancy = {
      ...sampleVacancy,
      seniority_level: "primer_empleo",
      years_required_min: 0,
      is_real_first_job: true,
      audit_status: "preliminary",
    };

    rerender(
      <VacancyCard
        vacancy={preliminaryFirstJob}
        onInspect={vi.fn()}
      />
    );

    expect(screen.getByText("[ 0 EXP ]")).toBeInTheDocument();
  });
});
