import { describe, it, expect } from "vitest";
import { parseJobDescription } from "../../src/services/job_description_parser";

describe("Job Description Parser Unit Tests", () => {
  it("parses structured job descriptions with distinct Spanish section headers", () => {
    const raw = `
Buscamos un Desarrollador Python Trainee para integrarse al equipo core.

Responsabilidades:
- Diseñar y desarrollar APIs REST con FastAPI.
- Colaborar en la optimización de consultas SQL.
- Participar en revisiones de código semanales.

Requisitos:
* Licenciatura o ingeniería en computación (o afín).
* Conocimiento básico de Git y Python 3.
* Habilidades de comunicación y trabajo en equipo.

Beneficios:
• Sueldo competitivo 100% nómina.
• Vales de despensa y seguro de gastos médicos mayores.
• Fondo de ahorro y 30 días de aguinaldo.

Condiciones:
1. Horario: Lunes a Viernes de 9:00 a 18:00 hrs.
2. Modalidad: Híbrido en CDMX (2 días en oficina).
    `;

    const result = parseJobDescription(raw);

    expect(result.hasStructuredSections).toBe(true);
    expect(result.sections.length).toBe(5);

    // Overview
    expect(result.sections[0].id).toBe("overview");
    expect(result.sections[0].title).toBe("Resumen del Puesto");
    expect(result.sections[0].iconName).toBe("Briefcase");
    expect(result.sections[0].items[0]).toContain("Buscamos un Desarrollador Python Trainee");

    // Responsibilities
    expect(result.sections[1].id).toBe("responsibilities");
    expect(result.sections[1].iconName).toBe("ListChecks");
    expect(result.sections[1].items.length).toBe(3);
    expect(result.sections[1].items[0]).toBe("Diseñar y desarrollar APIs REST con FastAPI.");

    // Requirements
    expect(result.sections[2].id).toBe("requirements");
    expect(result.sections[2].iconName).toBe("CheckCircle2");
    expect(result.sections[2].items.length).toBe(3);
    expect(result.sections[2].items[1]).toBe("Conocimiento básico de Git y Python 3.");

    // Benefits
    expect(result.sections[3].id).toBe("benefits");
    expect(result.sections[3].iconName).toBe("Gift");
    expect(result.sections[3].items.length).toBe(3);
    expect(result.sections[3].items[0]).toBe("Sueldo competitivo 100% nómina.");

    // Conditions
    expect(result.sections[4].id).toBe("conditions");
    expect(result.sections[4].iconName).toBe("MapPin");
    expect(result.sections[4].items.length).toBe(2);
    expect(result.sections[4].items[0]).toContain("Horario: Lunes a Viernes");
  });

  it("handles bullet tokens of various formats (- , * , • , 1. , etc.)", () => {
    const raw = `
Requisitos:
- Guion
* Asterisco
• Viñeta clásica
▪ Cuadrado
1) Número con paréntesis
2. Número con punto
    `;

    const result = parseJobDescription(raw);
    expect(result.hasStructuredSections).toBe(true);
    const reqSection = result.sections.find((s) => s.id === "requirements");
    expect(reqSection).toBeDefined();
    expect(reqSection?.items).toEqual([
      "Guion",
      "Asterisco",
      "Viñeta clásica",
      "Cuadrado",
      "Número con paréntesis",
      "Número con punto",
    ]);
  });

  it("falls back gracefully to a single overview section when no headers match", () => {
    const raw = `
Empresa líder en tecnología busca talento joven.
Se requiere disponibilidad inmediata para proyecto temporal.
Interesados enviar CV por correo electrónico.
    `;

    const result = parseJobDescription(raw);
    expect(result.hasStructuredSections).toBe(false);
    expect(result.sections.length).toBe(1);
    expect(result.sections[0].id).toBe("overview");
    expect(result.sections[0].title).toBe("Resumen del Puesto");
    expect(result.sections[0].items.length).toBe(3);
  });

  it("omits empty sections if a header has no following items", () => {
    const raw = `
Responsabilidades:
- Programar

Beneficios:

Condiciones:
- Remoto
    `;

    const result = parseJobDescription(raw);
    expect(result.sections.some((s) => s.id === "benefits")).toBe(false);
    expect(result.sections.some((s) => s.id === "responsibilities")).toBe(true);
    expect(result.sections.some((s) => s.id === "conditions")).toBe(true);
  });

  it("handles HTML tags, brs, and entities gracefully", () => {
    const raw = `<p>Vacante junior.</p><br/><h3>Requisitos</h3><ul><li>Python</li><li>SQL &amp; Git</li></ul>`;
    const result = parseJobDescription(raw);

    const reqSection = result.sections.find((s) => s.id === "requirements");
    expect(reqSection).toBeDefined();
    expect(reqSection?.items).toContain("Python");
    expect(reqSection?.items.some((i) => i.includes("SQL"))).toBe(true);
  });
});
