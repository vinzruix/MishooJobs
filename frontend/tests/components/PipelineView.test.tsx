import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PipelineView } from "../../src/components/PipelineView";
import type { ApplicationRecord } from "../../src/types/application";

const mockApplications: ApplicationRecord[] = [
  {
    vacancy_fingerprint: "app-1",
    title: "Fullstack Junior Developer",
    company_name: "Tech Solutions México",
    status: "saved",
    fit_score: 85,
    direct_url: "https://example.com/job/1",
    updated_at: new Date().toISOString(),
  },
  {
    vacancy_fingerprint: "app-2",
    title: "Backend Engineer",
    company_name: "FinTech Hub",
    status: "applied",
    fit_score: 92,
    direct_url: "https://example.com/job/2",
    applied_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe("PipelineView Light Theme & Interaction Tests", () => {
  it("renders with light design tokens, white cards, and pastel status pills", () => {
    const onUpdateStatus = vi.fn();
    const onRemove = vi.fn();

    const { container } = render(
      <PipelineView
        applications={mockApplications}
        onUpdateStatus={onUpdateStatus}
        onRemove={onRemove}
      />
    );

    // Title and container
    expect(screen.getByText(/Postulaciones/i)).toHaveClass("text-slate-900");

    // Cards should have white background and light slate border
    const cards = container.querySelectorAll(".grid > div");
    expect(cards.length).toBe(2);
    expect(cards[0]).toHaveClass("bg-white");
    expect(cards[0]).toHaveClass("border-slate-200/80");

    // Badges inside cards
    const cardBadges = container.querySelectorAll(".grid span.rounded-full");
    expect(cardBadges[0]).toHaveTextContent("Guardadas");
    expect(cardBadges[0]).toHaveClass("bg-amber-50");
    expect(cardBadges[0]).toHaveClass("text-amber-800");

    expect(cardBadges[1]).toHaveTextContent("Postuladas");
    expect(cardBadges[1]).toHaveClass("bg-emerald-50");
    expect(cardBadges[1]).toHaveClass("text-emerald-800");
  });

  it("handles status update and removal actions", () => {
    const onUpdateStatus = vi.fn();
    const onRemove = vi.fn();

    render(
      <PipelineView
        applications={mockApplications}
        onUpdateStatus={onUpdateStatus}
        onRemove={onRemove}
      />
    );

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "interviewing" } });
    expect(onUpdateStatus).toHaveBeenCalledWith(mockApplications[0], "interviewing");

    const deleteButtons = screen.getAllByTitle("Eliminar de mi pipeline");
    fireEvent.click(deleteButtons[0]);
    expect(onRemove).toHaveBeenCalledWith("app-1");
  });

  it("renders empty state with light container when no applications match", () => {
    const { container } = render(
      <PipelineView
        applications={[]}
        onUpdateStatus={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText("No hay postulaciones en este estado")).toHaveClass("text-slate-800");
    const emptyContainer = container.querySelector(".border-dashed");
    expect(emptyContainer).toHaveClass("bg-white/60");
    expect(emptyContainer).toHaveClass("border-slate-300");
  });
});
