import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchBar } from "../../src/components/SearchBar";

describe("SearchBar Light Theme & Functionality Tests", () => {
  it("renders with light design tokens and elements", () => {
    const onSearch = vi.fn();
    const { container } = render(
      <SearchBar onSearch={onSearch} isSearching={false} initialQuery="Python" initialLocation="CDMX" />
    );

    const formContainer = container.querySelector("form > div");
    expect(formContainer).toHaveClass("bg-white");
    expect(formContainer).toHaveClass("border-slate-200/80");

    const submitBtn = screen.getByRole("button", { name: /Buscar en Vivo/i });
    expect(submitBtn).toHaveClass("bg-slate-900");
    expect(submitBtn).toHaveClass("text-white");

    const queryInput = screen.getByPlaceholderText(/Rol o tecnología/i);
    expect(queryInput).toHaveClass("text-slate-900");
  });

  it("submits query and location when clicking search", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} isSearching={false} initialQuery="React" initialLocation="Remoto" />);

    const submitBtn = screen.getByRole("button", { name: /Buscar en Vivo/i });
    fireEvent.click(submitBtn);

    expect(onSearch).toHaveBeenCalledWith("React", "Remoto");
  });
});
