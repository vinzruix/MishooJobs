import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VacancyList } from "../../src/components/VacancyList";
import type { JobVacancy } from "../../src/types/job";

describe("VacancyList Component Tests", () => {
  const baseVacancy: JobVacancy = {
    fingerprint: "v1",
    title: "Desarrollador React",
    company_name: "Tech Corp",
    location_state: "CDMX",
    modality: "remoto",
    seniority_level: "junior",
    years_required_min: 1,
    is_real_first_job: false,
    audit_status: "preliminary",
    reasoning: "Junior",
    has_discrepancy: false,
    currency: "MXN",
    description: "Desc",
    skills: [],
    external_links: [],
  };

  it("renders generic empty state when vacancies is empty and not filtered", () => {
    render(
      <VacancyList
        vacancies={[]}
        isSearching={false}
        isDateFiltered={false}
        activeSeniority="all"
        onInspect={vi.fn()}
      />
    );

    expect(screen.getByText("No se encontraron vacantes para este criterio")).toBeInTheDocument();
  });

  it("renders dedicated empty state when activeSeniority is filtered and vacancies is empty", () => {
    render(
      <VacancyList
        vacancies={[]}
        isSearching={false}
        isDateFiltered={false}
        activeSeniority="primer_empleo"
        onInspect={vi.fn()}
      />
    );

    expect(
      screen.getByText("No se encontraron vacantes para el nivel seleccionado en esta búsqueda")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Prueba ajustando el nivel de experiencia/i)
    ).toBeInTheDocument();
  });

  it("renders date-filter empty state when isDateFiltered is true and vacancies is empty", () => {
    const handleClearDateFilter = vi.fn();
    const handleSelectTimeframe = vi.fn();

    render(
      <VacancyList
        vacancies={[]}
        isSearching={false}
        isDateFiltered={true}
        activeSeniority="all"
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
    const handleSortChange = vi.fn();

    render(
      <VacancyList
        vacancies={[baseVacancy]}
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

  it("renders cleanly without duplicate seniority quick pills", () => {
    render(
      <VacancyList
        vacancies={[baseVacancy]}
        isSearching={false}
        activeSeniority="all"
        onInspect={vi.fn()}
      />
    );

    expect(screen.queryByText("Primer Empleo Real")).not.toBeInTheDocument();
  });

  it("renders inactive toolbar toggle pill ('Ocultar postuladas') with hiddenCount badge and tooltip", () => {
    const handleToggle = vi.fn();
    render(
      <VacancyList
        vacancies={[baseVacancy]}
        isSearching={false}
        hideApplied={false}
        hiddenCount={3}
        onToggleHideApplied={handleToggle}
        onInspect={vi.fn()}
      />
    );

    const toggleBtn = screen.getByRole("button", { name: /Ocultar postuladas/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute("title", "Ocultar vacantes con postulación enviada (Atajo: H)");
    expect(toggleBtn).toHaveAttribute("aria-pressed", "false");
    expect(toggleBtn).toHaveTextContent("3");

    fireEvent.click(toggleBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it("renders active toolbar toggle pill ('Ocultando postuladas') with emerald styling and active aria-pressed", () => {
    const handleToggle = vi.fn();
    render(
      <VacancyList
        vacancies={[baseVacancy]}
        isSearching={false}
        hideApplied={true}
        hiddenCount={3}
        onToggleHideApplied={handleToggle}
        onInspect={vi.fn()}
      />
    );

    const toggleBtn = screen.getByRole("button", { name: /Ocultando postuladas/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute("title", "Mostrar vacantes con postulación enviada (Atajo: H)");
    expect(toggleBtn).toHaveAttribute("aria-pressed", "true");
    expect(toggleBtn).toHaveTextContent("3");

    fireEvent.click(toggleBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it("displays summary text with hidden count when hideApplied is true and hiddenCount > 0", () => {
    render(
      <VacancyList
        vacancies={[baseVacancy]}
        isSearching={false}
        hideApplied={true}
        hiddenCount={2}
        onInspect={vi.fn()}
      />
    );

    expect(screen.getByText(/vacante encontrada/i)).toBeInTheDocument();
    expect(screen.getByText("(2 postuladas ocultas)")).toBeInTheDocument();
  });

  it("displays standard summary text without hidden count when hideApplied is false", () => {
    render(
      <VacancyList
        vacancies={[baseVacancy]}
        isSearching={false}
        hideApplied={false}
        hiddenCount={2}
        onInspect={vi.fn()}
      />
    );

    expect(screen.getByText(/vacante encontrada/i)).toBeInTheDocument();
    expect(screen.queryByText("(2 postuladas ocultas)")).not.toBeInTheDocument();
  });

  it("renders 100% applied empty state when hideApplied is true and all matching vacancies are applied", () => {
    const handleToggle = vi.fn();
    render(
      <VacancyList
        vacancies={[]}
        isSearching={false}
        hideApplied={true}
        hiddenCount={4}
        totalUnignoredCount={4}
        onToggleHideApplied={handleToggle}
        onInspect={vi.fn()}
      />
    );

    expect(
      screen.getByText("¡Te has postulado a todas las vacantes encontradas para este criterio!")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Has completado la postulación de las 4 vacantes coincidentes/i)
    ).toBeInTheDocument();

    const showAppliedBtn = screen.getByRole("button", {
      name: /Mostrar vacantes postuladas \(4\)/i,
    });
    expect(showAppliedBtn).toBeInTheDocument();

    fireEvent.click(showAppliedBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it("renders singular grammar for 1 hidden vacancy in 100% applied empty state", () => {
    render(
      <VacancyList
        vacancies={[]}
        isSearching={false}
        hideApplied={true}
        hiddenCount={1}
        totalUnignoredCount={1}
        onToggleHideApplied={vi.fn()}
        onInspect={vi.fn()}
      />
    );

    expect(
      screen.getByText(/Has completado la postulación de las 1 vacante coincidente/i)
    ).toBeInTheDocument();
  });

  it("renders shimmering skeleton cards during in-flight streaming search", () => {
    render(
      <VacancyList
        vacancies={[]}
        isSearching={true}
        onInspect={vi.fn()}
      />
    );

    expect(screen.getByText("Buscando vacantes...")).toBeInTheDocument();
    expect(screen.getByTestId("vacancy-skeletons")).toBeInTheDocument();
  });

  it("binds selectedFingerprint to highlight active card", () => {
    const vac2: JobVacancy = { ...baseVacancy, fingerprint: "v2", title: "Python Dev" };
    render(
      <VacancyList
        vacancies={[baseVacancy, vac2]}
        selectedFingerprint="v2"
        isSearching={false}
        onInspect={vi.fn()}
      />
    );

    const cards = screen.getAllByTestId("vacancy-card");
    expect(cards[0]).not.toHaveClass("border-slate-900");
    expect(cards[1]).toHaveClass("border-slate-900", "ring-2", "ring-slate-900/10");
  });
});
