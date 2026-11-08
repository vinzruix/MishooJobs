import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useJobStream } from "../../src/hooks/useJobStream";
import * as sseModule from "../../src/services/sse";
import type { JobVacancy } from "../../src/types/job";

describe("useJobStream hook", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("deduplicates vacancies with the same fingerprint within a batch and merges fields", () => {
    let capturedCallbacks: sseModule.StreamCallbacks | null = null;

    vi.spyOn(sseModule, "startJobStream").mockImplementation((_params, callbacks) => {
      capturedCallbacks = callbacks;
      return () => {};
    });

    const { result } = renderHook(() => useJobStream());

    act(() => {
      result.current.search({ query: "Java Junior", seniority: "junior" });
    });

    expect(capturedCallbacks).not.toBeNull();

    const olderVacancy: JobVacancy = {
      fingerprint: "fp123",
      title: "Desarrollador Java Jr",
      company_name: "IDS Comercial",
      location_state: "CDMX",
      modality: "remoto",
      seniority_level: "junior",
      years_required_min: 1,
      is_real_first_job: false,
      audit_status: "preliminary",
      reasoning: "Posición junior",
      has_discrepancy: false,
      currency: "MXN",
      description: "Short desc",
      skills: ["Java"],
      published_at: "2026-11-04T07:00:00Z",
      external_links: [{ portal_name: "computrabajo", direct_url: "https://link1.com", is_active: true }],
    };

    const newerVacancy: JobVacancy = {
      fingerprint: "fp123",
      title: "Desarrollador Java Jr",
      company_name: "IDS Comercial",
      location_state: "CDMX",
      modality: "remoto",
      seniority_level: "junior",
      years_required_min: 1,
      is_real_first_job: false,
      audit_status: "verified",
      reasoning: "Posición junior verificada",
      has_discrepancy: false,
      currency: "MXN",
      description: "Longer description with more details",
      skills: ["Java", "Spring Boot"],
      published_at: "2026-11-06T15:00:00Z",
      external_links: [{ portal_name: "computrabajo", direct_url: "https://link2.com", is_active: true }],
    };

    // Emit batch containing both duplicates
    act(() => {
      capturedCallbacks?.onVacancyBatch?.([olderVacancy, newerVacancy]);
    });

    // Should only have 1 vacancy, merged with newer date, longer desc, verified status, and deduplicated 1 link per portal
    expect(result.current.vacancies).toHaveLength(1);
    const merged = result.current.vacancies[0];
    expect(merged.fingerprint).toBe("fp123");
    expect(merged.published_at).toBe("2026-11-06T15:00:00Z");
    expect(merged.description).toBe("Longer description with more details");
    expect(merged.skills).toEqual(expect.arrayContaining(["Java", "Spring Boot"]));
    expect(merged.audit_status).toBe("verified");
    expect(merged.external_links).toHaveLength(1);
    expect(merged.external_links[0].portal_name).toBe("computrabajo");
  });

  it("retains accumulated vacancies when deduplication summary arrives without overwriting or clearing state", () => {
    let capturedCallbacks: sseModule.StreamCallbacks | null = null;

    vi.spyOn(sseModule, "startJobStream").mockImplementation((_params, callbacks) => {
      capturedCallbacks = callbacks;
      return () => {};
    });

    const { result } = renderHook(() => useJobStream());

    act(() => {
      result.current.search({ query: "Python Junior" });
    });

    const vacancy: JobVacancy = {
      fingerprint: "fp-persist-1",
      title: "Desarrollador Python Jr",
      company_name: "Empresa Ejemplo",
      location_state: "CDMX",
      modality: "remoto",
      seniority_level: "junior",
      years_required_min: 1,
      is_real_first_job: false,
      audit_status: "preliminary",
      reasoning: "Junior",
      has_discrepancy: false,
      currency: "MXN",
      description: "Python junior job description",
      skills: ["Python", "Django"],
      published_at: "2026-11-07T10:00:00Z",
      external_links: [{ portal_name: "computrabajo", direct_url: "https://link1.com", is_active: true }],
    };

    act(() => {
      capturedCallbacks?.onVacancyBatch?.([vacancy]);
    });

    expect(result.current.vacancies).toHaveLength(1);

    // Emit deduplication summary event
    act(() => {
      capturedCallbacks?.onDeduplicationSummary?.({
        total_extracted: 1,
        unique_vacancies: 1,
        duplicates_merged: 0,
      });
    });

    // Vacancies state must not be reset
    expect(result.current.vacancies).toHaveLength(1);
    expect(result.current.vacancies[0].fingerprint).toBe("fp-persist-1");
  });

  it("passes seniority parameter correctly to startJobStream", () => {
    let capturedParams: sseModule.StreamFilterParams | null = null;

    vi.spyOn(sseModule, "startJobStream").mockImplementation((params) => {
      capturedParams = params;
      return () => {};
    });

    const { result } = renderHook(() => useJobStream());

    act(() => {
      result.current.search({ query: "React", seniority: "primer_empleo" });
    });

    expect(capturedParams).not.toBeNull();
    expect(capturedParams?.seniority).toBe("primer_empleo");
  });
});
