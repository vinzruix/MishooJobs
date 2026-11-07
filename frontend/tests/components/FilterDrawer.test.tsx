import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FilterDrawer, type FilterState } from "../../src/components/FilterDrawer";
import type { JobVacancy } from "../../src/types/job";

describe("FilterDrawer Component Tests", () => {
  const defaultFilters: FilterState = {
    modality: "all",
    category: "all",
    location: "México",
    timeframes: ["all"],
  };

  const sampleVacancies: JobVacancy[] = [
    {
      fingerprint: "v1",
      title: "Desarrollador Python",
      company_name: "Tech Corp",
      location_state: "CDMX",
      modality: "remoto",
      category: "junior",
      currency: "MXN",
      description: "Desc",
      skills: [],
      external_links: [],
      published_at: new Date("2026-11-07T00:00:00Z").toISOString(),
    },
  ];

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

    const btnAll = screen.getByText(/Cualquier fecha/);
    fireEvent.click(btnAll);

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        timeframes: ["all"],
      })
    );
  });
});
