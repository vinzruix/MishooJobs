import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VacancyList } from "../../src/components/VacancyList";
import type { JobVacancy } from "../../src/types/job";

describe("VacancyList Component Tests", () => {
  it("renders generic empty state when vacancies is empty and not date-filtered", () => {
    render(
      <VacancyList
        vacancies={[]}
        isSearching={false}
        isDateFiltered={false}
        onInspect={vi.fn()}
      />
    );

    expect(screen.getByText("No se encontraron vacantes para este criterio")).toBeInTheDocument();
  });

  it("renders date-filter empty state when isDateFiltered is true and vacancies is empty", () => {
    const handleClearDateFilter = vi.fn();
    const handleSelectTimeframe = vi.fn();

    render(
      <VacancyList
        vacancies={[]}
        isSearching={false}
        isDateFiltered={true}
        onInspect={vi.fn()}
        onClearDateFilter={handleClearDateFilter}
        onSelectTimeframe={handleSelectTimeframe}
      />
    );

    expect(
      screen.getByText("No se encontraron vacantes para este marco de tiempo")
    ).toBeInTheDocument();

    const recommendationBtn = screen.getByText("Última semana");
    fireEvent.click(recommendationBtn);
    expect(handleSelectTimeframe).toHaveBeenCalledWith("7d");

    const clearBtn = screen.getByText("Limpiar filtro de fecha");
    fireEvent.click(clearBtn);
    expect(handleClearDateFilter).toHaveBeenCalledTimes(1);
  });

  it("renders sorting dropdown and emits onSortChange", () => {
    const sampleVacancy: JobVacancy = {
      fingerprint: "v1",
      title: "Desarrollador React",
      company_name: "Tech Corp",
      location_state: "CDMX",
      modality: "remoto",
      category: "junior",
      currency: "MXN",
      description: "Desc",
      skills: [],
      external_links: [],
    };

    const handleSortChange = vi.fn();

    render(
      <VacancyList
        vacancies={[sampleVacancy]}
        isSearching={false}
        sortOrder="recent"
        onSortChange={handleSortChange}
        onInspect={vi.fn()}
      />
    );

    const sortSelect = screen.getByRole("combobox", { name: "Ordenar resultados" });
    expect(sortSelect).toBeInTheDocument();
    expect(sortSelect).toHaveValue("recent");

    fireEvent.change(sortSelect, { target: { value: "compatibility" } });
    expect(handleSortChange).toHaveBeenCalledWith("compatibility");
  });
});
