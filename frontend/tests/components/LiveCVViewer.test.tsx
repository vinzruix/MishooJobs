import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "fake-indexeddb/auto";
import { db } from "../../src/db";
import { LiveCVViewer } from "../../src/components/LiveCVViewer";
import type { GeneratedResumeRecord } from "../../src/types/resume";
import { parseAndValidateYAML, STARTER_MASTER_PROFILE_YAML } from "../../src/services/master_profile_service";

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
    await db.master_profile.clear();
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

  it("renders certificates, logros_academicos, languages, and header links in Modern Executive (3rd template)", async () => {
    const richResume: GeneratedResumeRecord = {
      ...mockResume,
      id: "rich-resume-uuid",
      template_id: "modern_executive",
      content: {
        ...mockResume.content,
        header: {
          ...mockResume.content.header,
          links: [{ label: "GitHub", url: "https://github.com/smendoza" }],
        },
        certificates: [
          {
            name: "Java Spring Boot Microservices eCommerce Project Masterclass",
            issuer: "Udemy",
            date: "2026",
          },
          {
            name: "Curso Completo de Spec Driven Development (SDD) y Agentes IA",
            issuer: "Udemy",
            date: "2026",
          },
        ],
        logros_academicos: [
          {
            title: "1er Lugar HackMTY",
            organization: "Tec de Monterrey",
            date: "2024",
            description: "Sistema fintech en 36h.",
          },
        ],
        languages: [{ language: "Inglés", level: "B2" }],
      },
    };
    await db.resumes.put(richResume);

    render(<LiveCVViewer resumeId={richResume.id} onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId("modern-executive-template")).toBeInTheDocument();
    });

    expect(screen.getByText("Certificaciones")).toBeInTheDocument();
    expect(
      screen.getByText("Java Spring Boot Microservices eCommerce Project Masterclass"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Curso Completo de Spec Driven Development (SDD) y Agentes IA"),
    ).toBeInTheDocument();
    expect(screen.getByText("Logros Académicos")).toBeInTheDocument();
    expect(screen.getByText("1er Lugar HackMTY")).toBeInTheDocument();
    expect(screen.getByText("Idiomas")).toBeInTheDocument();
    expect(screen.getByText(/B2/)).toBeInTheDocument();
    expect(screen.getByText(/github\.com\/smendoza/)).toBeInTheDocument();
  });

  it("hides footer in @media print CSS and prevents min-h-[11in] print overflow", async () => {
    const { container } = render(<LiveCVViewer resumeId={mockResume.id} onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId("technical-high-density-template")).toBeInTheDocument();
    });

    const styleEl = container.querySelector("style");
    expect(styleEl?.textContent).toContain("header, nav, footer, .no-print");
    expect(styleEl?.textContent).toContain("break-after: page");

    const sheet = container.querySelector("[data-cv-page='1']");
    expect(sheet).toHaveClass("print:min-h-0");
    expect(sheet).toHaveClass("print:p-0");
  });

  it("splits overflowing CV cleanly onto 2 pages with repeated candidate header on both pages", async () => {
    const denseWithCerts: GeneratedResumeRecord = {
      ...mockResume,
      id: "two-page-uuid",
      template_id: "technical_high_density",
      content: {
        ...mockResume.content,
        projects: [
          {
            name: "Proyecto Alpha",
            description: "API REST distribuida",
            technologies: ["Python", "FastAPI"],
            highlights: ["Procesé 500 req/s."],
          },
        ],
        certificates: [
          { name: "Certificado Microservicios", issuer: "Udemy", date: "2026" },
          { name: "Certificado SDD Agentes", issuer: "Udemy", date: "2026" },
        ],
      },
    };
    await db.resumes.put(denseWithCerts);

    // Mock block heights via offsetHeight so right column overflows single Letter page (> 976px)
    const offsetSpy = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
      if (this.dataset?.cvHeader === "p1") return 110;
      if (this.dataset?.cvHeader === "p2") return 75;
      const blockId = this.dataset?.cvBlockId;
      if (!blockId) return 0;
      if (blockId === "exp-0") return 380;
      if (blockId === "proj-0") return 340;
      if (blockId === "edu-0") return 120;
      if (blockId === "cert-row-0") return 180;
      if (blockId.endsWith("-head")) return 24;
      return 60;
    });

    try {
      const { container } = render(<LiveCVViewer resumeId={denseWithCerts.id} onBack={() => {}} />);

      await waitFor(() => {
        expect(screen.getByTestId("two-page-info-badge")).toBeInTheDocument();
      });

      expect(screen.queryByTestId("overflow-warning-badge")).not.toBeInTheDocument();

      const page1 = container.querySelector("[data-cv-page='1']");
      const page2 = container.querySelector("[data-cv-page='2']");
      expect(page1).toBeInTheDocument();
      expect(page1).toHaveClass("cv-page-break");
      expect(page2).toBeInTheDocument();

      // Header repeated on BOTH page 1 and page 2
      const p1Header = page1?.querySelector("[data-cv-header='p1']");
      const p2Header = page2?.querySelector("[data-cv-header='p2']");
      expect(p1Header).toHaveTextContent("Santiago Mendoza Ruiz");
      expect(p2Header).toHaveTextContent("Santiago Mendoza Ruiz");
      expect(p2Header).toHaveTextContent("Desarrollador Backend Junior");

      // Overflowed certificates moved cleanly to Page 2 with their heading, and no empty col-span-4 border-r on Page 2
      expect(page2).toHaveTextContent("Certificaciones");
      expect(page2).toHaveTextContent("Certificado Microservicios");
      expect(page2?.querySelector("[data-cv-col='left']")).toBeNull();

      // Toggle to forced 1-page mode shows warning badge, and re-enabling restores 2 pages
      fireEvent.click(screen.getByTestId("toggle-single-page-btn"));
      await waitFor(() => {
        expect(screen.getByTestId("overflow-warning-badge")).toBeInTheDocument();
      });
      expect(container.querySelector("[data-cv-page='2']")).toBeNull();

      fireEvent.click(screen.getByTestId("enable-two-pages-btn"));
      await waitFor(() => {
        expect(container.querySelector("[data-cv-page='2']")).toBeInTheDocument();
      });

      // Verify repeated header works on ClassicATS and ModernExecutive when overflowing too
      fireEvent.click(screen.getByTestId("template-classic-btn"));
      await waitFor(() => {
        expect(screen.getByTestId("classic-ats-template")).toBeInTheDocument();
        expect(container.querySelector("[data-cv-page='2']")).toBeInTheDocument();
      });
      expect(container.querySelector("[data-cv-page='2'] [data-cv-header='p2']")).toHaveTextContent(
        "Santiago Mendoza Ruiz",
      );

      fireEvent.click(screen.getByTestId("template-modern-btn"));
      await waitFor(() => {
        expect(screen.getByTestId("modern-executive-template")).toBeInTheDocument();
        expect(container.querySelector("[data-cv-page='2']")).toBeInTheDocument();
      });
      expect(container.querySelector("[data-cv-page='2'] [data-cv-header='p2']")).toHaveTextContent(
        "Santiago Mendoza Ruiz",
      );
    } finally {
      offsetSpy.mockRestore();
    }
  });

  it("enforces print-safe TrueType font stacks and vector-friendly print CSS rules", async () => {
    const { container } = render(
      <LiveCVViewer
        resumeId={mockResume.id}
        onBack={() => {}}
        photoUrl="data:image/png;base64,iVBORw0KGgo="
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("technical-high-density-template")).toBeInTheDocument();
    });

    const styleEl = container.querySelector("style");
    const css = styleEl?.textContent || "";

    expect(css).toContain(".cv-page.font-sans");
    expect(css).toContain("Helvetica, Arial, sans-serif");
    expect(css).toContain(".cv-page.font-serif");
    expect(css).toContain('Georgia, "Times New Roman", Times, serif');
    expect(css).toContain(".cv-page.font-mono");
    expect(css).toContain('"Courier New", Courier, monospace');

    expect(css).toContain("box-shadow: none !important");
    expect(css).toContain("text-shadow: none !important");
    expect(css).toContain("filter: none !important");
    expect(css).toContain("backdrop-filter: none !important");
    expect(css).toContain("transform: none !important");
    expect(css).toContain("user-select: text !important");

    const avatarImg = screen.getByAltText("Avatar");
    expect(avatarImg.parentElement).not.toHaveClass("shadow-xs");
  });

  it("disables contentEditable synchronously during window.print and toggles via beforeprint/afterprint", async () => {
    let editableDuringPrint: string | null = null;
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {
      const h1 = screen.getByText("Santiago Mendoza Ruiz");
      editableDuringPrint = h1.getAttribute("contenteditable");
    });

    render(<LiveCVViewer resumeId={mockResume.id} onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId("technical-high-density-template")).toBeInTheDocument();
    });

    const nameEl = screen.getByText("Santiago Mendoza Ruiz");
    expect(nameEl).toHaveAttribute("contenteditable", "true");

    fireEvent.click(screen.getByTestId("print-pdf-btn"));
    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(editableDuringPrint).toBe("false");

    act(() => {
      window.dispatchEvent(new Event("afterprint"));
    });
    expect(screen.getByText("Santiago Mendoza Ruiz")).toHaveAttribute("contenteditable", "true");

    act(() => {
      window.dispatchEvent(new Event("beforeprint"));
    });
    expect(screen.getByText("Santiago Mendoza Ruiz")).toHaveAttribute("contenteditable", "false");

    act(() => {
      window.dispatchEvent(new Event("afterprint"));
    });
    expect(screen.getByText("Santiago Mendoza Ruiz")).toHaveAttribute("contenteditable", "true");
  });

  it("renders certificate names as clickable https links across all 3 templates and omits unsafe URLs", async () => {
    const linkedResume: GeneratedResumeRecord = {
      ...mockResume,
      id: "linked-certs-uuid",
      template_id: "technical_high_density",
      content: {
        ...mockResume.content,
        certificates: [
          {
            name: "AWS Certified Cloud Practitioner",
            issuer: "Amazon Web Services",
            date: "Mar 2024",
            url: "https://aws.amazon.com/verification",
          },
          {
            name: "Certificado Sin URL",
            issuer: "Coursera",
            date: "2025",
          },
          {
            name: "Certificado Inseguro",
            issuer: "Test",
            date: "2025",
            url: "javascript:alert(1)",
          },
        ],
        logros_academicos: [],
      },
    };
    await db.resumes.put(linkedResume);

    const firstRender = render(<LiveCVViewer resumeId={linkedResume.id} onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId("technical-high-density-template")).toBeInTheDocument();
    });

    const verifyCertLinks = () => {
      const awsLink = screen.getByRole("link", { name: "AWS Certified Cloud Practitioner" });
      expect(awsLink).toHaveAttribute("href", "https://aws.amazon.com/verification");
      expect(awsLink).toHaveAttribute("target", "_blank");
      expect(awsLink).toHaveAttribute("rel", "noreferrer");

      const plainCert = screen.getByText("Certificado Sin URL");
      expect(plainCert.closest("a")).toBeNull();

      const unsafeCert = screen.getByText("Certificado Inseguro");
      expect(unsafeCert.closest("a")).toBeNull();
    };

    // 1. Technical High Density (standalone cert-row)
    verifyCertLinks();

    // 2. Classic ATS (standalone cert-*)
    fireEvent.click(screen.getByTestId("template-classic-btn"));
    await waitFor(() => {
      expect(screen.getByTestId("classic-ats-template")).toBeInTheDocument();
    });
    verifyCertLinks();

    // 3. Modern Executive (standalone cert-row)
    fireEvent.click(screen.getByTestId("template-modern-btn"));
    await waitFor(() => {
      expect(screen.getByTestId("modern-executive-template")).toBeInTheDocument();
    });
    verifyCertLinks();

    firstRender.unmount();

    // Also verify combined certs-logros layout across all 3 templates
    const combinedResume: GeneratedResumeRecord = {
      ...linkedResume,
      id: "linked-certs-logros-uuid",
      content: {
        ...linkedResume.content,
        logros_academicos: [
          {
            title: "1er Lugar HackMTY",
            organization: "Tec de Monterrey",
            date: "2024",
            description: "Fintech.",
          },
        ],
      },
    };
    await db.resumes.put(combinedResume);

    render(<LiveCVViewer resumeId={combinedResume.id} onBack={() => {}} />);
    await waitFor(() => {
      expect(screen.getByTestId("technical-high-density-template")).toBeInTheDocument();
    });
    verifyCertLinks();

    fireEvent.click(screen.getByTestId("template-classic-btn"));
    await waitFor(() => {
      expect(screen.getByTestId("classic-ats-template")).toBeInTheDocument();
    });
    verifyCertLinks();

    fireEvent.click(screen.getByTestId("template-modern-btn"));
    await waitFor(() => {
      expect(screen.getByTestId("modern-executive-template")).toBeInTheDocument();
    });
    verifyCertLinks();
  });

  it("hydrates missing certificate URLs from Master Profile in Dexie for previously saved resumes", async () => {
    const parsedStarter = parseAndValidateYAML(STARTER_MASTER_PROFILE_YAML);
    expect(parsedStarter.valid).toBe(true);

    await db.master_profile.put({
      id: "current",
      raw_yaml: STARTER_MASTER_PROFILE_YAML,
      parsed: parsedStarter.parsed!,
      updated_at: new Date().toISOString(),
    });

    const legacyResumeWithoutUrl: GeneratedResumeRecord = {
      ...mockResume,
      id: "legacy-no-cert-url-uuid",
      template_id: "classic_ats",
      content: {
        ...mockResume.content,
        certificates: [
          {
            name: "AWS Certified Cloud Practitioner",
            issuer: "Amazon Web Services",
            date: "Mar 2024",
          },
        ],
        logros_academicos: [
          {
            title: "1er Lugar HackMTY 2023",
            organization: "Tec de Monterrey",
            date: "Oct 2023",
            description: "Fintech",
          },
        ],
      },
    };
    await db.resumes.put(legacyResumeWithoutUrl);

    render(<LiveCVViewer resumeId={legacyResumeWithoutUrl.id} onBack={() => {}} />);

    await waitFor(() => {
      const link = screen.getByRole("link", { name: "AWS Certified Cloud Practitioner" });
      expect(link).toHaveAttribute("href", "https://aws.amazon.com/verification");
    });
  });
});
