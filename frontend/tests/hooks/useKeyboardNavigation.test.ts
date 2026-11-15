import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useKeyboardNavigation } from "../../src/hooks/useKeyboardNavigation";
import type { JobVacancy } from "../../src/types/job";

describe("useKeyboardNavigation Hook Tests", () => {
  const createMockVacancy = (id: string): JobVacancy => ({
    fingerprint: id,
    title: `Job ${id}`,
    company_name: "Company",
    location_state: "CDMX",
    modality: "remoto",
    seniority_level: "junior",
    years_required_min: 1,
    is_real_first_job: false,
    audit_status: "preliminary",
    reasoning: "",
    has_discrepancy: false,
    currency: "MXN",
    description: "",
    skills: [],
    external_links: [],
  });

  const vac1 = createMockVacancy("v1");
  const vac2 = createMockVacancy("v2");
  const vac3 = createMockVacancy("v3");

  it("clamps selectedIndex when visible vacancies shrink in-flight", () => {
    const { result, rerender } = renderHook(
      ({ vacancies }) =>
        useKeyboardNavigation({
          vacancies,
          isModalOpen: false,
          onInspect: vi.fn(),
          onCloseModal: vi.fn(),
        }),
      { initialProps: { vacancies: [vac1, vac2, vac3] } }
    );

    // Navigate to the 3rd vacancy (index 2)
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
    });
    expect(result.current.selectedIndex).toBe(2);

    // Simulate in-flight removal of vac3: vacancies shrinks to [vac1, vac2]
    rerender({ vacancies: [vac1, vac2] });
    expect(result.current.selectedIndex).toBe(1);

    // When all vacancies are removed, selectedIndex clamps to -1
    rerender({ vacancies: [] });
    expect(result.current.selectedIndex).toBe(-1);
  });

  it("does not clamp selectedIndex to non-negative if previously unselected (-1)", () => {
    const { result, rerender } = renderHook(
      ({ vacancies }) =>
        useKeyboardNavigation({
          vacancies,
          isModalOpen: false,
          onInspect: vi.fn(),
          onCloseModal: vi.fn(),
        }),
      { initialProps: { vacancies: [vac1, vac2] } }
    );

    expect(result.current.selectedIndex).toBe(-1);

    // Vacancy removed while nothing was selected
    rerender({ vacancies: [vac1] });
    expect(result.current.selectedIndex).toBe(-1);
  });

  it("triggers onToggleHideApplied when pressing 'h' or 'H'", () => {
    const onToggleHideApplied = vi.fn();
    renderHook(() =>
      useKeyboardNavigation({
        vacancies: [vac1],
        isModalOpen: false,
        onInspect: vi.fn(),
        onCloseModal: vi.fn(),
        onToggleHideApplied,
      })
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
    });
    expect(onToggleHideApplied).toHaveBeenCalledTimes(1);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "H" }));
    });
    expect(onToggleHideApplied).toHaveBeenCalledTimes(2);
  });

  it("triggers onToggleHideApplied even when vacancies list is empty", () => {
    const onToggleHideApplied = vi.fn();
    renderHook(() =>
      useKeyboardNavigation({
        vacancies: [],
        isModalOpen: false,
        onInspect: vi.fn(),
        onCloseModal: vi.fn(),
        onToggleHideApplied,
      })
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
    });
    expect(onToggleHideApplied).toHaveBeenCalledTimes(1);
  });

  it("suppresses 'h' shortcut when a modal dialog is open", () => {
    const onToggleHideApplied = vi.fn();
    renderHook(() =>
      useKeyboardNavigation({
        vacancies: [vac1],
        isModalOpen: true,
        onInspect: vi.fn(),
        onCloseModal: vi.fn(),
        onToggleHideApplied,
      })
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
    });
    expect(onToggleHideApplied).not.toHaveBeenCalled();
  });

  it("triggers onCycleTab when pressing Space", () => {
    const onCycleTab = vi.fn();
    renderHook(() =>
      useKeyboardNavigation({
        vacancies: [vac1, vac2],
        isModalOpen: false,
        onInspect: vi.fn(),
        onCycleTab,
      })
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    });
    expect(onCycleTab).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenPrimaryLink when pressing Enter on selected vacancy", () => {
    const onOpenPrimaryLink = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        vacancies: [vac1, vac2],
        isModalOpen: false,
        onOpenPrimaryLink,
      })
    );

    // Select first item
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
    });
    expect(result.current.selectedIndex).toBe(0);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    });
    expect(onOpenPrimaryLink).toHaveBeenCalledWith(vac1);
  });

  it("calls onSelect when pressing j and k", () => {
    const onSelect = vi.fn();
    renderHook(() =>
      useKeyboardNavigation({
        vacancies: [vac1, vac2],
        isModalOpen: false,
        onSelect,
      })
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
    });
    expect(onSelect).toHaveBeenCalledWith(vac1);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
    });
    expect(onSelect).toHaveBeenCalledWith(vac2);
  });
});
