import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "../src/App";
import type { JobVacancy } from "../src/types/job";

const mockSearch = vi.fn();

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
    summary: null,
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
    setApplicationStatus: vi.fn(),
    removeApplication: vi.fn(),
  }),
}));

describe("App Seniority Filtering Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters vacancies by experience level in-memory without calling search()", () => {
    render(<App />);

    // Both vacancies should initially be visible
    expect(screen.getByText("Desarrollador Java Junior")).toBeInTheDocument();
    expect(screen.getByText("Becario de Software")).toBeInTheDocument();

    // Click on "Primer Empleo Real" in the filter drawer or quick filter pill
    const firstJobButtons = screen.getAllByRole("button", { name: /Primer Empleo Real/i });
    expect(firstJobButtons.length).toBeGreaterThan(0);
    fireEvent.click(firstJobButtons[0]);

    // Crucial assertion: search() MUST NOT be called when changing seniority
    expect(mockSearch).not.toHaveBeenCalled();

    // Only the primer_empleo vacancy should remain visible
    expect(screen.getByText("Becario de Software")).toBeInTheDocument();
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
});
