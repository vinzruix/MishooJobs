import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { JobDescriptionViewer } from "../../src/components/JobDescriptionViewer";
import type { StructuredJobDescription } from "../../src/types/job";

describe("JobDescriptionViewer Component Tests", () => {
  const structuredData: StructuredJobDescription = {
    hasStructuredSections: true,
    rawText: "raw description text",
    sections: [
      {
        id: "overview",
        title: "Resumen del Puesto",
        iconName: "Briefcase",
        items: ["Líder en e-commerce busca talento inicial."],
      },
      {
        id: "responsibilities",
        title: "Responsabilidades y Funciones",
        iconName: "ListChecks",
        items: ["Desarrollar componentes con React.", "Escribir pruebas unitarias."],
      },
      {
        id: "requirements",
        title: "Requisitos y Conocimientos",
        iconName: "CheckCircle2",
        items: ["TypeScript básico", "Conocimientos de Git"],
      },
      {
        id: "benefits",
        title: "Beneficios y Prestaciones",
        iconName: "Gift",
        items: ["Seguro médico mayor", "Home office 100%"],
      },
      {
        id: "conditions",
        title: "Condiciones y Modalidad",
        iconName: "MapPin",
        items: ["Tiempo completo", "Contrato indeterminado"],
      },
    ],
  };

  it("renders all structured sections inside styled white cards with headers and icons", () => {
    const { container } = render(<JobDescriptionViewer structured={structuredData} />);

    expect(screen.getByText("Resumen del Puesto")).toBeInTheDocument();
    expect(screen.getByText("Responsabilidades y Funciones")).toBeInTheDocument();
    expect(screen.getByText("Requisitos y Conocimientos")).toBeInTheDocument();
    expect(screen.getByText("Beneficios y Prestaciones")).toBeInTheDocument();
    expect(screen.getByText("Condiciones y Modalidad")).toBeInTheDocument();

    expect(screen.getByText("Desarrollar componentes con React.")).toBeInTheDocument();
    expect(screen.getByText("TypeScript básico")).toBeInTheDocument();
    expect(screen.getByText("Seguro médico mayor")).toBeInTheDocument();

    // Verify card classes
    const cards = container.querySelectorAll(".bg-white");
    expect(cards.length).toBe(5);
    cards.forEach((card) => {
      expect(card.className).toContain("rounded-xl");
      expect(card.className).toContain("border");
    });
  });

  it("sanitizes potential XSS injection vectors through DOMPurify", () => {
    const maliciousData: StructuredJobDescription = {
      hasStructuredSections: false,
      rawText: "evil",
      sections: [
        {
          id: "overview",
          title: "Resumen del Puesto",
          iconName: "Briefcase",
          items: [
            'Texto seguro <script>alert("xss")</script><img src="x" onerror="alert(1)" />',
          ],
        },
      ],
    };

    const { container } = render(<JobDescriptionViewer structured={maliciousData} />);

    expect(container.innerHTML).not.toContain("<script>");
    expect(container.innerHTML).not.toContain('onerror="alert(1)"');
    expect(screen.getByText(/Texto seguro/)).toBeInTheDocument();
  });

  it("renders single-card fallback layout gracefully when hasStructuredSections is false", () => {
    const fallbackData: StructuredJobDescription = {
      hasStructuredSections: false,
      rawText: "Plain text description with two paragraphs.",
      sections: [
        {
          id: "overview",
          title: "Resumen del Puesto",
          iconName: "Briefcase",
          items: ["Párrafo único de descripción."],
        },
      ],
    };

    const { container } = render(<JobDescriptionViewer structured={fallbackData} />);
    const cards = container.querySelectorAll(".bg-white");
    expect(cards.length).toBe(1);
    expect(screen.getByText("Resumen del Puesto")).toBeInTheDocument();
    expect(screen.getByText("Párrafo único de descripción.")).toBeInTheDocument();
  });
});
