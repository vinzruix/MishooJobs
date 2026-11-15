import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Header } from "../../src/components/Header";
import { PipelineView } from "../../src/components/PipelineView";
import { ResumeLibraryView } from "../../src/components/ResumeLibraryView";
import { MasterProfileEditor } from "../../src/components/MasterProfileEditor";
import type { ApplicationRecord } from "../../src/types/application";
import type { ResumeRecord } from "../../src/types/master_profile";

vi.mock("../../src/hooks/useResumes", () => ({
  useResumes: () => ({
    resumes: [
      {
        id: "res-1",
        title: "CV Frontend",
        type: "vacancy",
        vacancy_company: "Mercado Libre",
        revision: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ats_score: 95,
        word_count: 350,
      } as ResumeRecord,
      {
        id: "res-2",
        title: "CV Fullstack",
        type: "role",
        target_role: "Frontend Junior",
        revision: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ats_score: 90,
        word_count: 380,
      } as ResumeRecord,
    ],
    isLoading: false,
    deleteResume: vi.fn(),
    duplicateResume: vi.fn(),
  }),
}));

vi.mock("../../src/services/master_profile_service", () => ({
  STARTER_MASTER_PROFILE_YAML: "candidate:\n  name: Test User",
  loadMasterProfile: vi.fn().mockResolvedValue({
    raw_yaml: "candidate:\n  name: Test User",
  }),
  parseAndValidateYAML: vi.fn().mockReturnValue({
    valid: true,
    parsed: { candidate: { name: "Test User" } },
  }),
  saveMasterProfile: vi.fn().mockResolvedValue(undefined),
  exportMasterProfileYAML: vi.fn(),
}));

describe("UI De-Cluttering & Technical Boilerplate Purge Tests", () => {
  it("Header renders concise navigation labels and omits version badge", () => {
    render(
      <Header
        activeTab="search"
        setActiveTab={vi.fn()}
        onOpenMasterProfile={vi.fn()}
        resumesCount={2}
      />
    );

    // Concise tab labels
    expect(screen.getByText("Vacantes")).toBeInTheDocument();
    expect(screen.getByText("Postulaciones")).toBeInTheDocument();
    expect(screen.getByText("CVs")).toBeInTheDocument();
    expect(screen.getByText("Perfil")).toBeInTheDocument();

    // Technical version badge must be gone
    expect(screen.queryByText(/v0\.1\.0/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/MX Jr Live/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Búsqueda en Vivo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mi Pipeline/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mis CVs/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Perfil Maestro/i)).not.toBeInTheDocument();
  });

  it("PipelineView header omits IndexedDB badge and renders concise title", () => {
    const apps: ApplicationRecord[] = [
      {
        id: "app-1",
        vacancy_fingerprint: "v1",
        title: "Desarrollador Trainee",
        company_name: "Empresa",
        status: "applied",
        applied_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    render(<PipelineView applications={apps} onUpdateStatus={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getByText("Postulaciones (1)")).toBeInTheDocument();
    expect(screen.queryByText(/IndexedDB/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Almacenamiento Local/i)).not.toBeInTheDocument();
  });

  it("ResumeLibraryView renders clean bracket-free badges and omits promotional copy", () => {
    render(
      <ResumeLibraryView
        onSelectResume={vi.fn()}
        onExploreVacancies={vi.fn()}
        onOpenRoleModal={vi.fn()}
      />
    );

    // Verify promotional boilerplate paragraph is removed
    expect(screen.queryByText(/Currículums adaptados a vacantes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cero servidores/i)).not.toBeInTheDocument();

    // Verify bracket-free badges
    expect(screen.getByText("Mercado Libre")).toBeInTheDocument();
    expect(screen.queryByText(/\[VACANTE:/i)).not.toBeInTheDocument();

    expect(screen.getByText("Frontend Junior")).toBeInTheDocument();
    expect(screen.queryByText(/\[ROL:/i)).not.toBeInTheDocument();
  });

  it("MasterProfileEditor renders clean validation badge without brackets and omits subtitle", async () => {
    render(<MasterProfileEditor isOpen={true} onClose={vi.fn()} />);

    // Subtitle must be gone
    expect(screen.queryByText(/Master Career Knowledge Base/i)).not.toBeInTheDocument();

    // Validation badge without brackets
    expect(screen.getByText("Estructura válida")).toBeInTheDocument();
    expect(screen.queryByText(/\[ESTRUCTURA VÁLIDA\]/i)).not.toBeInTheDocument();
  });
});
