import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useApplications } from "../../src/hooks/useApplications";
import { db } from "../../src/db";
import type { JobVacancy } from "../../src/types/job";

describe("useApplications Hook Tests (US5 & FR-014/FR-017)", () => {
  beforeEach(async () => {
    await db.applications.clear();
  });

  const createVacancy = (fingerprint: string, title: string, company: string): JobVacancy => ({
    fingerprint,
    title,
    company_name: company,
    location_state: "CDMX",
    modality: "remoto",
    seniority_level: "junior",
    years_required_min: 1,
    is_real_first_job: false,
    audit_status: "preliminary",
    reasoning: "",
    has_discrepancy: false,
    currency: "MXN",
    description: "Job desc",
    skills: ["React"],
    external_links: [{ portal_name: "computrabajo", direct_url: `https://example.com/${fingerprint}`, is_active: true }],
  });

  it("resolves multi-portal duplicates sharing canonical fingerprint (FR-014)", async () => {
    const { result } = renderHook(() => useApplications());

    // Vacancy from Computrabajo and Vacancy from OCC sharing same canonical fingerprint
    const vacComputrabajo = createVacancy("fp-react-fintech-mx", "Frontend Developer", "Fintech MX");
    const vacOCC = createVacancy("fp-react-fintech-mx", "Frontend Developer", "Fintech MX");

    await act(async () => {
      await result.current.setApplicationStatus(vacComputrabajo, "applied");
    });

    // Both portal listings resolve to 'applied' through their shared fingerprint
    expect(result.current.statusMap[vacComputrabajo.fingerprint]).toBe("applied");
    expect(result.current.statusMap[vacOCC.fingerprint]).toBe("applied");
    expect(result.current.appliedFingerprintSet.has("fp-react-fintech-mx")).toBe(true);
  });

  it("keeps distinct fingerprints for anonymous employers separated without collision (FR-017)", async () => {
    const { result } = renderHook(() => useApplications());

    // Two distinct anonymous postings from "Empresa Confidencial"
    const anonVac1 = createVacancy("fp-confidencial-computrabajo-101", "Desarrollador Java", "Empresa Confidencial");
    const anonVac2 = createVacancy("fp-confidencial-indeed-202", "Desarrollador Java", "Empresa Confidencial");

    await act(async () => {
      await result.current.setApplicationStatus(anonVac1, "applied");
    });

    // Only anonVac1 is applied; anonVac2 remains unaffected
    expect(result.current.appliedFingerprintSet.has(anonVac1.fingerprint)).toBe(true);
    expect(result.current.appliedFingerprintSet.has(anonVac2.fingerprint)).toBe(false);
    expect(result.current.statusMap[anonVac1.fingerprint]).toBe("applied");
    expect(result.current.statusMap[anonVac2.fingerprint]).toBeUndefined();
  });

  it("includes all post-application statuses in appliedFingerprintSet and excludes 'saved'", async () => {
    const { result } = renderHook(() => useApplications());

    const vacSaved = createVacancy("fp-saved", "Saved Role", "Co A");
    const vacApplied = createVacancy("fp-applied", "Applied Role", "Co B");
    const vacInterviewing = createVacancy("fp-interviewing", "Interviewing Role", "Co C");
    const vacRejected = createVacancy("fp-rejected", "Rejected Role", "Co D");
    const vacOffer = createVacancy("fp-offer", "Offer Role", "Co E");

    await act(async () => {
      await result.current.setApplicationStatus(vacSaved, "saved");
      await result.current.setApplicationStatus(vacApplied, "applied");
      await result.current.setApplicationStatus(vacInterviewing, "interviewing");
      await result.current.setApplicationStatus(vacRejected, "rejected");
      await result.current.setApplicationStatus(vacOffer, "offer");
    });

    // Pre-application status 'saved' must NOT be in appliedFingerprintSet
    expect(result.current.appliedFingerprintSet.has(vacSaved.fingerprint)).toBe(false);

    // All post-application statuses MUST be in appliedFingerprintSet
    expect(result.current.appliedFingerprintSet.has(vacApplied.fingerprint)).toBe(true);
    expect(result.current.appliedFingerprintSet.has(vacInterviewing.fingerprint)).toBe(true);
    expect(result.current.appliedFingerprintSet.has(vacRejected.fingerprint)).toBe(true);
    expect(result.current.appliedFingerprintSet.has(vacOffer.fingerprint)).toBe(true);
  });

  it("synchronizes status removal and updates correctly", async () => {
    const { result } = renderHook(() => useApplications());
    const vac = createVacancy("fp-sync-test", "QA Tester", "Tech QA");

    await act(async () => {
      await result.current.setApplicationStatus(vac, "applied");
    });
    expect(result.current.appliedFingerprintSet.has(vac.fingerprint)).toBe(true);

    await act(async () => {
      await result.current.removeApplication(vac.fingerprint);
    });
    expect(result.current.appliedFingerprintSet.has(vac.fingerprint)).toBe(false);
    expect(result.current.statusMap[vac.fingerprint]).toBeUndefined();
  });
});
