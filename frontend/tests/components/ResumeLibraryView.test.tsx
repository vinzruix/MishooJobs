import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "fake-indexeddb/auto";
import { db } from "../../src/db";
import { ResumeLibraryView } from "../../src/components/ResumeLibraryView";
import type { GeneratedResumeRecord } from "../../src/types/resume";

const mockResumes: GeneratedResumeRecord[] = [
  {
    id: "res-1",
    type: "vacancy",
    title: "Mercado Libre - Backend Jr",
    target_role: "Backend Jr",
    language: "es",
    vacancy_company: "Mercado Libre",
    vacancy_title: "Backend Jr",
    template_id: "technical_high_density",
    photo_enabled: true,
    content: {
      header: { full_name: "Santiago Mendoza", headline: "Dev", email: "a@b.com", phone: "123", location: "CDMX", links: [], about_me: "" },
      skills_categorized: {},
      languages: [],
      experience: [],
      projects: [],
      education: [],
      certificates: [],
      logros_academicos: [],
    },
    revision: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "res-2",
    type: "role_archetype",
    title: "CV Base - Frontend Developer",
    target_role: "Frontend Developer",
    language: "es",
    template_id: "classic_ats",
    photo_enabled: false,
    content: {
      header: { full_name: "Santiago Mendoza", headline: "Frontend Dev", email: "a@b.com", phone: "123", location: "CDMX", links: [], about_me: "" },
      skills_categorized: {},
      languages: [],
      experience: [],
      projects: [],
      education: [],
      certificates: [],
      logros_academicos: [],
    },
    revision: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe("ResumeLibraryView Component Tests", () => {
  beforeEach(async () => {
    await db.resumes.clear();
    vi.restoreAllMocks();
  });

  it("renders empty state when no resumes exist and allows navigating to create role CV or explore vacancies", async () => {
    const onExplore = vi.fn();
    const onOpenRole = vi.fn();

    render(
      <ResumeLibraryView
        onSelectResume={() => {}}
        onExploreVacancies={onExplore}
        onOpenRoleModal={onOpenRole}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("empty-resume-library")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("explore-vacancies-btn"));
    expect(onExplore).toHaveBeenCalled();
  });

  it("renders resume cards with correct badges, revisions and allows preview, duplicate, and delete", async () => {
    for (const r of mockResumes) {
      await db.resumes.put(r);
    }

    const onSelect = vi.fn();
    render(
      <ResumeLibraryView
        onSelectResume={onSelect}
        onExploreVacancies={() => {}}
        onOpenRoleModal={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Mercado Libre - Backend Jr")).toBeInTheDocument();
    });

    expect(screen.getByText("[VACANTE: Mercado Libre]")).toBeInTheDocument();
    expect(screen.getByText("[ROL: Frontend Developer]")).toBeInTheDocument();

    // Preview
    fireEvent.click(screen.getByTestId("preview-btn-res-1"));
    expect(onSelect).toHaveBeenCalledWith("res-1");

    // Duplicate
    fireEvent.click(screen.getByTestId("duplicate-btn-res-1"));
    await waitFor(async () => {
      const all = await db.resumes.toArray();
      expect(all.length).toBe(3);
      expect(all.some((r) => r.title.includes("(Copia)"))).toBe(true);
    });

    // Delete
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByTestId("delete-btn-res-2"));
    await waitFor(async () => {
      const all = await db.resumes.toArray();
      expect(all.some((r) => r.id === "res-2")).toBe(false);
    });
  });
});
