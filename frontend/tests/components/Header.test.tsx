import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Header } from "../../src/components/Header";

describe("Header Component Tests", () => {
  it("renders the custom suited cat mascot inside a light rounded-square badge and removes legacy Briefcase icon", () => {
    const { container } = render(
      <Header
        activeTab="search"
        setActiveTab={vi.fn()}
        onOpenMasterProfile={vi.fn()}
      />
    );

    const brandBtn = screen.getByTestId("brand-home-btn");
    expect(brandBtn).toBeInTheDocument();
    expect(brandBtn).toHaveClass("shrink-0");
    expect(brandBtn).toHaveAttribute("type", "button");
    expect(brandBtn).toHaveAttribute("aria-label", "MishooJobs - Ir a Vacantes");

    const mascotImg = screen.getByAltText("Logo de MishooJobs");
    expect(mascotImg).toBeInTheDocument();
    expect(mascotImg.tagName).toBe("IMG");
    expect(mascotImg).toHaveClass("w-full", "h-full", "object-contain");

    // Ensure legacy Lucide Briefcase SVG is no longer inside the brand button
    expect(brandBtn.querySelector("svg.lucide-briefcase")).not.toBeInTheDocument();
    expect(container.querySelector(".lucide-briefcase")).not.toBeInTheDocument();
    expect(screen.getByText("MishooJobs")).toBeInTheDocument();
  });

  it("navigates back to 'search' (Vacantes) when brand button is clicked from 'pipeline' or 'resumes'", () => {
    const setActiveTab = vi.fn();
    const { rerender } = render(
      <Header
        activeTab="pipeline"
        setActiveTab={setActiveTab}
        onOpenMasterProfile={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("brand-home-btn"));
    expect(setActiveTab).toHaveBeenCalledWith("search");

    setActiveTab.mockClear();

    rerender(
      <Header
        activeTab="resumes"
        setActiveTab={setActiveTab}
        onOpenMasterProfile={vi.fn()}
        resumesCount={3}
      />
    );

    fireEvent.click(screen.getByTestId("brand-home-btn"));
    expect(setActiveTab).toHaveBeenCalledWith("search");
  });
});
