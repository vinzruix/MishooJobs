import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FilterToolbar } from "../../src/components/FilterToolbar";
import type { FilterState, FilterToolbarProps } from "../../src/types/job";

describe("FilterToolbar Component Tests", () => {
  const defaultFilters: FilterState = {
    seniority: "all",
    timeframes: ["all"],
    modality: "all",
    location: "México",
  };

  const defaultSeniorityCounts = {
    all: 42,
    primer_empleo: 8,
    pasantia: 5,
    junior: 18,
    mid: 7,
    senior: 4,
  };

  const defaultTimeframeCounts = {
    all: 42,
    "1h": 2,
    "24h": 10,
    "3d": 15,
    "7d": 25,
    "30d": 38,
    "30d_plus": 4,
  };

  const renderToolbar = (props: Partial<FilterToolbarProps> = {}) => {
    const handleFilterChange = vi.fn();
    const handleToggleHideApplied = vi.fn();
    const handleResetFilters = vi.fn();

    const result = render(
      <FilterToolbar
        filters={defaultFilters}
        seniorityCounts={defaultSeniorityCounts}
        timeframeCounts={defaultTimeframeCounts}
        hideApplied={false}
        hiddenAppliedCount={0}
        totalResultsCount={42}
        duplicatesMergedCount={0}
        onFilterChange={handleFilterChange}
        onToggleHideApplied={handleToggleHideApplied}
        onResetFilters={handleResetFilters}
        {...props}
      />
    );

    return {
      ...result,
      handleFilterChange,
      handleToggleHideApplied,
      handleResetFilters,
    };
  };

  it("renders contiguous seniority segmented control with live counts", () => {
    renderToolbar();

    expect(screen.getByText("Todos")).toBeInTheDocument();
    expect(screen.getByText("Primer Empleo Real")).toBeInTheDocument();
    expect(screen.getByText("Pasantías")).toBeInTheDocument();
    expect(screen.getByText("Junior")).toBeInTheDocument();
    expect(screen.getByText("Mid")).toBeInTheDocument();
    expect(screen.getByText("Senior")).toBeInTheDocument();

    // Check live counts rendered inside pills
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
  });

  it("toggles seniority filter on click and toggles back to 'all' if active tier clicked", () => {
    const { rerender, handleFilterChange } = renderToolbar({
      filters: { ...defaultFilters, seniority: "all" },
    });

    fireEvent.click(screen.getByText("Primer Empleo Real"));
    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ seniority: "primer_empleo" })
    );

    // If already on junior, clicking junior toggles to all
    rerender(
      <FilterToolbar
        filters={{ ...defaultFilters, seniority: "junior" }}
        seniorityCounts={defaultSeniorityCounts}
        timeframeCounts={defaultTimeframeCounts}
        hideApplied={false}
        hiddenAppliedCount={0}
        totalResultsCount={18}
        duplicatesMergedCount={0}
        onFilterChange={handleFilterChange}
        onToggleHideApplied={vi.fn()}
        onResetFilters={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Junior"));
    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ seniority: "all" })
    );
  });

  it("opens Date dropdown popover on click and updates timeframe filter", () => {
    const { handleFilterChange } = renderToolbar();

    // Find Date button
    const dateTrigger = screen.getByRole("button", { name: /fecha/i });
    fireEvent.click(dateTrigger);

    // Popover options should now be visible
    expect(screen.getByText("Hoy (24h)")).toBeInTheDocument();
    expect(screen.getByText("Últimos 7 días")).toBeInTheDocument();

    // Click 7 days
    fireEvent.click(screen.getByText("Últimos 7 días"));
    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ timeframes: ["7d"] })
    );
  });

  it("closes popover when pressing Escape", () => {
    renderToolbar();

    const dateTrigger = screen.getByRole("button", { name: /fecha/i });
    fireEvent.click(dateTrigger);
    expect(screen.getByText("Hoy (24h)")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Hoy (24h)")).not.toBeInTheDocument();
  });

  it("opens Modality dropdown popover and updates modality filter", () => {
    const { handleFilterChange } = renderToolbar();

    const modalityTrigger = screen.getByRole("button", { name: /modalidad/i });
    fireEvent.click(modalityTrigger);

    expect(screen.getByText("Remoto")).toBeInTheDocument();
    expect(screen.getByText("Híbrido")).toBeInTheDocument();
    expect(screen.getByText("Presencial")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Remoto"));
    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ modality: "remoto" })
    );
  });

  it("opens Mexican States dropdown popover and updates location filter", () => {
    const { handleFilterChange } = renderToolbar();

    const stateTrigger = screen.getByRole("button", { name: /ubicación|estado|república/i });
    fireEvent.click(stateTrigger);

    expect(screen.getByText("Ciudad de México (CDMX)")).toBeInTheDocument();
    expect(screen.getByText("Jalisco (GDL / Zapopan)")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Ciudad de México (CDMX)"));
    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ location: "CDMX" })
    );
  });

  it("calls onToggleHideApplied when toggle button is clicked", () => {
    const { handleToggleHideApplied } = renderToolbar({
      hideApplied: false,
      hiddenAppliedCount: 3,
    });

    const hideAppliedBtn = screen.getByRole("button", { name: /ocultar postuladas/i });
    fireEvent.click(hideAppliedBtn);
    expect(handleToggleHideApplied).toHaveBeenCalled();
  });

  it("shows 'Restablecer' button only when filters are non-default and triggers onResetFilters", () => {
    // When default, Restablecer should not be visible
    const { rerender, handleResetFilters } = renderToolbar();
    expect(screen.queryByRole("button", { name: /restablecer/i })).not.toBeInTheDocument();

    // With non-default seniority
    rerender(
      <FilterToolbar
        filters={{ ...defaultFilters, seniority: "junior" }}
        seniorityCounts={defaultSeniorityCounts}
        timeframeCounts={defaultTimeframeCounts}
        hideApplied={false}
        hiddenAppliedCount={0}
        totalResultsCount={18}
        onFilterChange={vi.fn()}
        onToggleHideApplied={vi.fn()}
        onResetFilters={handleResetFilters}
      />
    );

    const resetBtn = screen.getByRole("button", { name: /restablecer/i });
    expect(resetBtn).toBeInTheDocument();
    fireEvent.click(resetBtn);
    expect(handleResetFilters).toHaveBeenCalled();
  });

  it("contains mobile single-row scroll classes (overflow-x-auto flex-nowrap)", () => {
    const { container } = renderToolbar();

    const scrollContainer = container.querySelector(".overflow-x-auto");
    expect(scrollContainer).toBeInTheDocument();
    expect(scrollContainer?.className).toContain("flex-nowrap");
  });
});
