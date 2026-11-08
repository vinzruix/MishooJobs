import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FilterDrawer, type FilterState } from "../../src/components/FilterDrawer";
import type { JobVacancy } from "../../src/types/job";

describe("FilterDrawer Component Tests", () => {
  const defaultFilters: FilterState = {
    modality: "all",
    seniority: "all",
    location: "México",
    timeframes: ["all"],
  };

  const sampleVacancies: JobVacancy[] = [
    {
      fingerprint: "v1",
      title: "Desarrollador Python Trainee",
      company_name: "Tech Corp",
      location_state: "CDMX",
      modality: "remoto",
      seniority_level: "primer_empleo",
      years_required_min: 0,
      is_real_first_job: true,
      audit_status: "verified",
      reasoning: "Sin experiencia previa requerida",
      has_discrepancy: false,
      currency: "MXN",
      description: "Desc",
      skills: [],
      external_links: [],
      published_at: new Date("2026-11-07T00:00:00Z").toISOString(),
    },
    {
      fingerprint: "v2",
      title: "Desarrollador React Junior",
      company_name: "SoftDev",
      location_state: "JAL",
      modality: "hibrido",
      seniority_level: "junior",
      years_required_min: 1,
      is_real_first_job: false,
      audit_status: "preliminary",
      reasoning: "Requiere 1 año",
      has_discrepancy: false,
      currency: "MXN",
      description: "Desc",
      skills: [],
      external_links: [],
      published_at: new Date("2026-11-07T00:00:00Z").toISOString(),
    },
    {
      fingerprint: "v3",
      title: "Becario de TI",
      company_name: "FinTech",
      location_state: "NL",
      modality: "presencial",
      seniority_level: "pasantia",
      years_required_min: 0,
      is_real_first_job: false,
      audit_status: "preliminary",
      reasoning: "Prácticas",
      has_discrepancy: false,
      currency: "MXN",
      description: "Desc",
      skills: [],
      external_links: [],
      published_at: new Date("2026-11-07T00:00:00Z").toISOString(),
    },
  ];

  it("renders 5 mutually exclusive experience tiers plus 'Todos los niveles' with live counters", () => {
    render(
      <FilterDrawer
        filters={defaultFilters}
        vacancies={sampleVacancies}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />
    );

    expect(screen.getByText("Todos los niveles")).toBeInTheDocument();
    expect(screen.getByText("Primer Empleo Real")).toBeInTheDocument();
    expect(screen.getByText("Pasantía / Prácticas")).toBeInTheDocument();
    expect(screen.getByText("Junior")).toBeInTheDocument();
    expect(screen.getByText("Mid")).toBeInTheDocument();
    expect(screen.getByText("Senior")).toBeInTheDocument();
  });

  it("selects specific experience tier when clicked", () => {
    const handleChange = vi.fn();
    render(
      <FilterDrawer
        filters={defaultFilters}
        vacancies={sampleVacancies}
        onChange={handleChange}
        onReset={vi.fn()}
      />
    );

    const firstJobBtn = screen.getByText("Primer Empleo Real");
    fireEvent.click(firstJobBtn);

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        seniority: "primer_empleo",
      })
    );
  });

  it("toggles active experience tier back to 'all' when clicked again", () => {
    const handleChange = vi.fn();
    render(
      <FilterDrawer
        filters={{ ...defaultFilters, seniority: "primer_empleo" }}
        vacancies={sampleVacancies}
        onChange={handleChange}
        onReset={vi.fn()}
      />
    );

    const firstJobBtn = screen.getByText("Primer Empleo Real");
    fireEvent.click(firstJobBtn);

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        seniority: "all",
      })
    );
  });

  it("selects specific timeframe when clicked and updates timeframes prop", () => {
    const handleChange = vi.fn();
    render(
      <FilterDrawer
        filters={defaultFilters}
        vacancies={sampleVacancies}
        onChange={handleChange}
        onReset={vi.fn()}
      />
    );

    const btn24h = screen.getByText(/Últimas 24 horas/);
    fireEvent.click(btn24h);

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        timeframes: ["24h"],
      })
    );
  });

  it("switches to another timeframe exclusively when a different timeframe is clicked", () => {
    const handleChange = vi.fn();
    render(
      <FilterDrawer
        filters={{ ...defaultFilters, timeframes: ["24h"] }}
        vacancies={sampleVacancies}
        onChange={handleChange}
        onReset={vi.fn()}
      />
    );

    const btn3d = screen.getByText(/Últimos 3 días/);
    fireEvent.click(btn3d);

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        timeframes: ["3d"],
      })
    );
  });

  it("toggles active timeframe off back to 'all' when clicked again", () => {
    const handleChange = vi.fn();
    render(
      <FilterDrawer
        filters={{ ...defaultFilters, timeframes: ["24h"] }}
        vacancies={sampleVacancies}
        onChange={handleChange}
        onReset={vi.fn()}
      />
    );

    const btn24h = screen.getByText(/Últimas 24 horas/);
    fireEvent.click(btn24h);

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        timeframes: ["all"],
      })
    );
  });

  it("sets timeframes to ['all'] when 'Cualquier fecha' is clicked", () => {
    const handleChange = vi.fn();
    render(
      <FilterDrawer
        filters={{ ...defaultFilters, timeframes: ["7d"] }}
        vacancies={sampleVacancies}
        onChange={handleChange}
        onReset={vi.fn()}
      />
    );

    const btnAll = screen.getByText("Cualquier fecha");
    fireEvent.click(btnAll);

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        timeframes: ["all"],
      })
    );
  });
});
