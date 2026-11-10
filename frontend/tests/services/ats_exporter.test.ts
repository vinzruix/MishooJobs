import { describe, it, expect } from "vitest";
import type { GeneratedCVContent } from "../../src/types/resume";
import { exportToPlainATS, exportToMarkdown } from "../../src/services/ats_exporter";

const sampleCV: GeneratedCVContent = {
  header: {
    full_name: "Santiago Mendoza Ruiz",
    headline: "Desarrollador Backend Junior",
    email: "santiago@ejemplo.com",
    phone: "+52 55 1234 5678",
    location: "Ciudad de México, México",
    links: [
      { label: "GitHub", url: "https://github.com/smendoza" },
      { label: "LinkedIn", url: "https://linkedin.com/in/smendoza-dev" },
    ],
    about_me: "Desarrollador enfocado en Python, FastAPI y PostgreSQL.",
  },
  skills_categorized: {
    "Backend": ["Python", "FastAPI"],
    "Bases de Datos": ["PostgreSQL", "Redis"],
  },
  languages: [
    { language: "Español", level: "Nativo" },
    { language: "Inglés", level: "B2" },
  ],
  experience: [
    {
      company: "FinTech MX",
      role: "Becario Backend",
      location: "CDMX",
      period: "Ene 2024 - Presente",
      highlights: [
        "Diseñé 6 endpoints REST reduciendo latencia en 25%.",
        "Optimicé consultas SQL en PostgreSQL.",
      ],
    },
  ],
  projects: [
    {
      name: "MishooJobs Core",
      description: "Agregador de empleos en tiempo real.",
      technologies: ["FastAPI", "React"],
      link: "https://github.com/smendoza/mishoojobs",
      highlights: ["Scraping asíncrono de 500 ofertas/min."],
    },
  ],
  education: [
    {
      institution: "UNAM",
      degree: "Ingeniería en Computación",
      period: "2021 - 2025",
      details: "Promedio: 9.2",
    },
  ],
  certificates: [
    {
      name: "AWS Certified Cloud Practitioner",
      issuer: "Amazon Web Services",
      date: "Mar 2024",
    },
  ],
  logros_academicos: [
    {
      title: "1er Lugar Hackathon HackMTY",
      organization: "Tec de Monterrey",
      date: "Oct 2023",
      description: "Prototipo fintech estudiantil.",
    },
  ],
};

describe("ats_exporter", () => {
  it("formats plain ATS text with uppercase headers, pipe separators and unicode dashes without markdown characters", () => {
    const plainText = exportToPlainATS(sampleCV);

    // Uppercase headings
    expect(plainText).toContain("INFORMACIÓN DE CONTACTO");
    expect(plainText).toContain("RESUMEN PROFESIONAL");
    expect(plainText).toContain("EXPERIENCIA LABORAL");
    expect(plainText).toContain("PROYECTOS TÉCNICOS");
    expect(plainText).toContain("HABILIDADES TÉCNICAS");
    expect(plainText).toContain("EDUCACIÓN");

    // Contact info
    expect(plainText).toContain("santiago@ejemplo.com | +52 55 1234 5678 | Ciudad de México, México");

    // Bullet points with dash
    expect(plainText).toContain("- Diseñé 6 endpoints REST reduciendo latencia en 25%.");

    // Zero markdown syntax
    expect(plainText).not.toContain("**");
    expect(plainText).not.toContain("##");
    expect(plainText).not.toContain("[GitHub](");
  });

  it("formats GitHub Flavored Markdown with markdown headings and links", () => {
    const mdText = exportToMarkdown(sampleCV);

    expect(mdText).toContain("# Santiago Mendoza Ruiz");
    expect(mdText).toContain("**Desarrollador Backend Junior**");
    expect(mdText).toContain("## Resumen Profesional");
    expect(mdText).toContain("## Experiencia Laboral");
    expect(mdText).toContain("[GitHub](https://github.com/smendoza)");
  });
});
