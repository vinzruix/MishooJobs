import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PastelMetricGrid, buildPastelMetrics } from "../../src/components/PastelMetricGrid";
import type { JobVacancy } from "../../src/types/job";

const baseVacancy: JobVacancy = {
  fingerprint: "test-vac-pastel",
  title: "Desarrollador Full Stack Jr",
  company_name: "Startup Mexico",
  location_state: "CDMX",
  modality: "remoto",
  seniority_level: "primer_empleo",
  years_required_min: 0,
  is_real_first_job: true,
  audit_status: "verified",
  reasoning: "Sin experiencia requerida",
  has_discrepancy: false,
  salary_min: 18000,
  salary_max: 22000,
  currency: "MXN",
  description: "Full stack developer role",
  skills: ["React", "Node.js"],
  external_links: [],
};

describe("PastelMetricGrid Component & Helper Tests", () => {
  it("builds all 4 semantic pastel metric cards with correct themes and values", () => {
    const metrics = buildPastelMetrics(baseVacancy);

    expect(metrics).toHaveLength(4);

    // 1. Salary (emerald)
    const salary = metrics.find((m) => m.id === "salary");
    expect(salary).toBeDefined();
    expect(salary?.theme).toBe("emerald");
    expect(salary?.value).toContain("$18,000 - $22,000 MXN/mes");
    expect(salary?.badgeStyle.bgClass).toBe("bg-emerald-50");

    // 2. Modality (sky)
    const modality = metrics.find((m) => m.id === "modality");
    expect(modality).toBeDefined();
    expect(modality?.theme).toBe("sky");
    expect(modality?.value).toBe("Remoto");
    expect(modality?.badgeStyle.bgClass).toBe("bg-sky-50");

    // 3. Experience (amber)
    const experience = metrics.find((m) => m.id === "experience");
    expect(experience).toBeDefined();
    expect(experience?.theme).toBe("amber");
    expect(experience?.value).toBe("0 años");
    expect(experience?.badgeStyle.bgClass).toBe("bg-amber-50");

    // 4. Seniority (purple)
    const seniority = metrics.find((m) => m.id === "seniority");
    expect(seniority).toBeDefined();
    expect(seniority?.theme).toBe("purple");
    expect(seniority?.value).toBe("Primer Empleo Real");
    expect(seniority?.badgeStyle.bgClass).toBe("bg-purple-50");
  });

  it("formats fallback salary when salary is undisclosed", () => {
    const noSalaryVacancy: JobVacancy = {
      ...baseVacancy,
      salary_min: null,
      salary_max: null,
    };
    const metrics = buildPastelMetrics(noSalaryVacancy);
    const salary = metrics.find((m) => m.id === "salary");
    expect(salary?.value).toBe("A convenir");
    expect(salary?.subtext).toBe("Sueldo no publicado");
  });

  it("displays candidate fitScore percentage when provided", () => {
    const metrics = buildPastelMetrics(baseVacancy, 88);
    const exp = metrics.find((m) => m.id === "experience");
    expect(exp?.label).toBe("Afinidad");
    expect(exp?.value).toBe("88% Match");
    expect(exp?.subtext).toBe("Compatibilidad");
  });

  it("displays 'Sin especificar' and 'No detallada en vacante' when experience requirement is omitted or null", () => {
    const unstatedExpVacancy: JobVacancy = {
      ...baseVacancy,
      seniority_level: "junior",
      years_required_min: null,
      is_real_first_job: false,
      reasoning: "Posición con requisitos abiertos sin años especificados; asignada preliminarmente a Junior.",
    };
    const metrics = buildPastelMetrics(unstatedExpVacancy);
    const exp = metrics.find((m) => m.id === "experience");
    expect(exp?.value).toBe("Sin especificar");
    expect(exp?.subtext).toBe("No detallada en vacante");

    const seniority = metrics.find((m) => m.id === "seniority");
    expect(seniority?.subtext).toBe("Requisitos abiertos");
  });

  it("renders 4 pastel cards with icons in the DOM", () => {
    render(<PastelMetricGrid vacancy={baseVacancy} fitScore={75} />);

    expect(screen.getByText("Salario")).toBeInTheDocument();
    expect(screen.getByText("Modalidad")).toBeInTheDocument();
    expect(screen.getByText("Afinidad")).toBeInTheDocument();
    expect(screen.getByText("Nivel")).toBeInTheDocument();

    expect(screen.getByText("75% Match")).toBeInTheDocument();
    expect(screen.getByText("Primer Empleo Real")).toBeInTheDocument();
  });
});
