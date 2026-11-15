import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "../src/App";
import type { JobVacancy } from "../src/types/job";

const mockSearch = vi.fn();
let mockSummary: { total_extracted: number; unique_vacancies: number; duplicates_merged: number } | null = null;

const sampleVacancies: JobVacancy[] = [
  {
    fingerprint: "vac-1",
    title: "Desarrollador Java Junior",
    company_name: "Tech Solutions",
    location_state: "CDMX",
    modality: "remoto",
    seniority_level: "junior",
    years_required_min: 1,
    is_real_first_job: false,
    audit_status: "preliminary",
    reasoning: "Requiere 1 año",
    has_discrepancy: false,
    currency: "MXN",
    description: "Java, Spring Boot",
    skills: ["Java", "Spring Boot"],
    external_links: [{ portal_name: "computrabajo", direct_url: "https://example.com/1", is_active: true }],
  },
  {
    fingerprint: "vac-2",
    title: "Becario de Software",
    company_name: "Startup MX",
    location_state: "JAL",
    modality: "remoto",
    seniority_level: "primer_empleo",
    years_required_min: 0,
    is_real_first_job: true,
    audit_status: "verified",
    reasoning: "Sin experiencia requerida",
    has_discrepancy: false,
    currency: "MXN",
    description: "Aprende Java y Python",
    skills: ["Java"],
    external_links: [{ portal_name: "indeed", direct_url: "https://example.com/2", is_active: true }],
  },
];

vi.mock("../src/hooks/useJobStream", () => ({
  useJobStream: () => ({
    isSearching: false,
    portalStatuses: {
      computrabajo: { portal: "computrabajo", status: "completed", count: 1 },
      indeed: { portal: "indeed", status: "completed", count: 1 },
      occ: { portal: "occ", status: "completed", count: 0 },
    },
    vacancies: sampleVacancies,
    summary: mockSummary,
    search: mockSearch,
  }),
}));

vi.mock("../src/hooks/useProfiles", () => ({
  useProfiles: () => ({
    profiles: [],
    activeProfile: null,
    activeProfileId: null,
    selectActiveProfile: vi.fn(),
    addProfile: vi.fn(),
    removeProfile: vi.fn(),
  }),
}));

vi.mock("../src/hooks/useApplications", () => ({
  useApplications: () => ({
    applications: [],
    statusMap: {},
    ignoredSet: new Set(),
    appliedFingerprintSet: new Set(),
    setApplicationStatus: vi.fn(),
    removeApplication: vi.fn(),
  }),
}));

describe("App Seniority Filtering Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSummary = null;
    window.history.replaceState({}, "", "/");
  });

  it("filters vacancies by experience level in-memory without calling search()", () => {
    render(<App />);

    // Both vacancies should initially be visible
    expect(screen.getAllByText("Desarrollador Java Junior").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Becario de Software")).toBeInTheDocument();

    // Click on "Primer Empleo Real" in the filter drawer or quick filter pill
    const firstJobButtons = screen.getAllByRole("button", { name: /Primer Empleo Real/i });
    expect(firstJobButtons.length).toBeGreaterThan(0);
    fireEvent.click(firstJobButtons[0]);

    // Crucial assertion: search() MUST NOT be called when changing seniority
    expect(mockSearch).not.toHaveBeenCalled();

    // Only the primer_empleo vacancy should remain visible
    expect(screen.getAllByText("Becario de Software").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Desarrollador Java Junior")).not.toBeInTheDocument();
  });

  it("calls search() when modality filter changes, keeping seniority as 'all'", () => {
    render(<App />);

    // Click on "Híbrido" modality
    const hibridoButton = screen.getByRole("button", { name: "Híbrido" });
    fireEvent.click(hibridoButton);

    // search() SHOULD be called for backend filters (modality)
    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(mockSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        modality: "hibrido",
        seniority: "all",
      })
    );
  });

  it("contextually scopes quick filter pill counters to the active timeframe filter", () => {
    render(<App />);

    // Click on "Últimas 24 horas" in FilterDrawer
    const btn24h = screen.getByText(/Últimas 24 horas/);
    fireEvent.click(btn24h);

    // Quick filter pills reflect the active timeframe without triggering search
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("displays deduplication metric badge with coherent duplicate count and total extracted", () => {
    mockSummary = {
      total_extracted: 2,
      unique_vacancies: 1,
      duplicates_merged: 1,
    };

    render(<App />);
    expect(screen.getByText(/Se combinaron/)).toBeInTheDocument();
    expect(screen.getByText(/Total extraídas: 2/)).toBeInTheDocument();
  });
});

describe("App Hide Applied localStorage and URL Isolation Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSummary = null;
    window.history.replaceState({}, "", "/");
    window.localStorage.clear();
  });

  it("hydrates hideApplied preference synchronously from localStorage ('true')", () => {
    window.localStorage.setItem("mishoojobs_hide_applied", "true");
    render(<App />);

    const toggleBtn = screen.getByTitle("Mostrar vacantes con postulación enviada (Atajo: H)");
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("persists hideApplied preference to localStorage on toggle", () => {
    render(<App />);

    const toggleBtn = screen.getByTitle("Ocultar vacantes con postulación enviada (Atajo: H)");
    expect(toggleBtn).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(toggleBtn);
    expect(window.localStorage.getItem("mishoojobs_hide_applied")).toBe("true");
  });

  it("gracefully falls back to false when localStorage.getItem throws an exception", () => {
    const spy = vi.spyOn(window.localStorage, "getItem").mockImplementationOnce(() => {
      throw new Error("SecurityError: Access Denied");
    });

    render(<App />);

    const toggleBtn = screen.getByTitle("Ocultar vacantes con postulación enviada (Atajo: H)");
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute("aria-pressed", "false");

    spy.mockRestore();
  });

  it("strictly isolates hideApplied preference from URL query parameters", () => {
    render(<App />);

    const toggleBtn = screen.getByTitle("Ocultar vacantes con postulación enviada (Atajo: H)");
    fireEvent.click(toggleBtn);

    expect(window.location.search).not.toContain("hide_applied");
    expect(window.location.search).not.toContain("mishoojobs_hide_applied");
  });

  it("marks app footer as non-printable so it never leaks into downloaded CV PDFs", () => {
    render(<App />);

    const footer = screen.getByText(/MishooJobs © 2026/);
    expect(footer).toHaveClass("no-print");
    expect(footer).toHaveClass("print:hidden");
  });

  it("asserts 0 occurrences of marketing slogans and verbose banners", () => {
    render(<App />);

    expect(screen.queryByText(/Filtros Mexicanos/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Desarrollado para juniors y estudiantes en México/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/100% Búsqueda en Vivo: Concurrencia directa/i)).not.toBeInTheDocument();
  });
});

describe("App Master-Detail Split Layout & Navigation Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSummary = null;
    window.history.replaceState({}, "", "/");
    window.localStorage.clear();
  });

  it("renders 12-column master-detail split layout on desktop with sticky detail pane", () => {
    render(<App />);

    const container = screen.getByTestId("master-detail-container");
    expect(container).toHaveClass("grid-cols-1", "lg:grid-cols-12");

    const desktopPane = screen.getByTestId("desktop-detail-pane");
    expect(desktopPane).toHaveClass("lg:col-span-7", "sticky");
  });

  it("automatically selects first streaming vacancy in the detail pane without opening any modal", () => {
    render(<App />);

    // First vacancy is "Desarrollador Java Junior"
    const desktopPane = screen.getByTestId("desktop-detail-pane");
    expect(desktopPane).toHaveTextContent("Desarrollador Java Junior");
    expect(desktopPane).toHaveTextContent("Tech Solutions");

    // Modal overlay is not rendered for desktop view
    expect(screen.queryByTestId("detail-pane-close-btn")).not.toBeInTheDocument();
  });

  it("updates selected vacancy in detail pane when clicking a different vacancy card", () => {
    render(<App />);

    const desktopPane = screen.getByTestId("desktop-detail-pane");
    expect(desktopPane).toHaveTextContent("Desarrollador Java Junior");

    // Click second card ("Becario de Software")
    const secondJob = screen.getByRole("heading", { name: "Becario de Software" });
    fireEvent.click(secondJob);

    expect(desktopPane).toHaveTextContent("Becario de Software");
    expect(desktopPane).toHaveTextContent("Startup MX");
  });

  it("navigates vacancies with 'j' and 'k' updating the detail pane", () => {
    render(<App />);

    const desktopPane = screen.getByTestId("desktop-detail-pane");
    expect(desktopPane).toHaveTextContent("Desarrollador Java Junior");

    // Press 'j' to select next vacancy
    fireEvent.keyDown(window, { key: "j" });
    expect(desktopPane).toHaveTextContent("Becario de Software");

    // Press 'k' to select previous vacancy
    fireEvent.keyDown(window, { key: "k" });
    expect(desktopPane).toHaveTextContent("Desarrollador Java Junior");
  });

  it("cycles detail tabs with Space and opens application link with Enter", () => {
    const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<App />);

    const desktopPane = screen.getByTestId("desktop-detail-pane");
    expect(desktopPane).toHaveTextContent("Descripción del Puesto");

    // Press 'Space' to cycle to AI Evaluation tab
    fireEvent.keyDown(window, { key: " " });
    expect(desktopPane).toHaveTextContent("Análisis de Brechas & Afinidad Técnica");

    // Press 'Enter' to open primary application link
    fireEvent.keyDown(window, { key: "Enter" });
    expect(windowOpenSpy).toHaveBeenCalledWith(
      "https://example.com/1",
      "_blank",
      "noopener,noreferrer"
    );

    windowOpenSpy.mockRestore();
  });
});
