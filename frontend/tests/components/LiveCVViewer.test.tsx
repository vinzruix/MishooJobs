import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "fake-indexeddb/auto";
import { db } from "../../src/db";
import { LiveCVViewer } from "../../src/components/LiveCVViewer";
import type { GeneratedResumeRecord } from "../../src/types/resume";

const mockResume: GeneratedResumeRecord = {
  id: "test-resume-uuid",
  type: "vacancy",
  title: "Mercado Libre - Backend Junior",
  target_role: "Backend Junior",
  language: "es",
  template_id: "technical_high_density",
  photo_enabled: true,
  content: {
    header: {
      full_name: "Santiago Mendoza Ruiz",
      headline: "Desarrollador Backend Junior",
      email: "santiago@ejemplo.com",
      phone: "+52 55 1234 5678",
      location: "CDMX",
      links: [],
      about_me: "Desarrollador enfocado en Python y APIs REST.",
    },
    skills_categorized: { Backend: ["Python", "FastAPI"] },
    languages: [{ language: "Español", level: "Nativo" }],
    experience: [
      {
        company: "FinTech MX",
        role: "Becario Backend",
        period: "2024",
        highlights: ["Diseñé endpoints REST."],
      },
    ],
    projects: [],
    education: [
      {
        institution: "UNAM",
        degree: "Ing. en Computación",
        period: "2021-2025",
      },
    ],
    certificates: [],
    logros_academicos: [],
  },
  ats_match_score: 95,
  revision: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("LiveCVViewer Component Tests", () => {
  beforeEach(async () => {
    await db.resumes.clear();
    await db.resumes.put(mockResume);
    vi.restoreAllMocks();
  });

  it("renders with default technical high-density template and proportional 96px photo", async () => {
    render(<LiveCVViewer resumeId={mockResume.id} onBack={() => {}} photoUrl="data:image/png;base64,fake" />);

    await waitFor(() => {
      expect(screen.getByTestId("technical-high-density-template")).toBeInTheDocument();
    });

    expect(screen.getByText("Santiago Mendoza Ruiz")).toBeInTheDocument();
    expect(screen.getByText("Mercado Libre - Backend Junior")).toBeInTheDocument();
    const avatarImg = screen.getByAltText("Avatar");
    expect(avatarImg.parentElement).toHaveClass("w-24");
    expect(avatarImg.parentElement).toHaveClass("h-24");
  });

  it("switches templates instantly on click without false-positive overflow on Modern Executive", async () => {
    render(<LiveCVViewer resumeId={mockResume.id} onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId("technical-high-density-template")).toBeInTheDocument();
    });

    const classicBtn = screen.getByTestId("template-classic-btn");
    fireEvent.click(classicBtn);

    await waitFor(() => {
      expect(screen.getByTestId("classic-ats-template")).toBeInTheDocument();
    });

    const modernBtn = screen.getByTestId("template-modern-btn");
    fireEvent.click(modernBtn);

    await waitFor(() => {
      expect(screen.getByTestId("modern-executive-template")).toBeInTheDocument();
    });

    // Default content should not show page exceeded warning badge
    expect(screen.queryByTestId("overflow-warning-badge")).not.toBeInTheDocument();
  });

  it("toggles photo visibility setting in Dexie", async () => {
    render(<LiveCVViewer resumeId={mockResume.id} onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId("photo-toggle-btn")).toBeInTheDocument();
    });

    const toggleBtn = screen.getByTestId("photo-toggle-btn");
    expect(toggleBtn).toHaveTextContent("Foto: ON");

    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(toggleBtn).toHaveTextContent("Foto: OFF");
    });

    const updated = await db.resumes.get(mockResume.id);
    expect(updated?.photo_enabled).toBe(false);
  });

  it("triggers window.print when Descargar PDF is clicked", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    render(<LiveCVViewer resumeId={mockResume.id} onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId("print-pdf-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("print-pdf-btn"));
    expect(printSpy).toHaveBeenCalled();
  });

  it("does not show overflow warning on Modern Executive default content under 1080px threshold", async () => {
    render(<LiveCVViewer resumeId={mockResume.id} onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId("technical-high-density-template")).toBeInTheDocument();
    });

    const modernBtn = screen.getByTestId("template-modern-btn");
    fireEvent.click(modernBtn);

    await waitFor(() => {
      expect(screen.getByTestId("modern-executive-template")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("overflow-warning-badge")).not.toBeInTheDocument();
  });
});
