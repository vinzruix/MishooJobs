import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchBar } from "../../src/components/SearchBar";

describe("SearchBar Streamlined Keyword-Only Tests", () => {
  it("renders with light design tokens, query input, and shortcut indicator", () => {
    const onSearch = vi.fn();
    const { container } = render(
      <SearchBar onSearch={onSearch} isSearching={false} initialQuery="Python" />
    );

    const formContainer = container.querySelector("form > div");
    expect(formContainer).toHaveClass("bg-white");
    expect(formContainer).toHaveClass("border-slate-200/80");

    const submitBtn = screen.getByRole("button", { name: /Buscar en Vivo/i });
    expect(submitBtn).toHaveClass("bg-slate-900");
    expect(submitBtn).toHaveClass("text-white");

    const queryInput = screen.getByPlaceholderText(/Rol o tecnología/i);
    expect(queryInput).toHaveClass("text-slate-900");
    expect(queryInput).toHaveValue("Python");

    // Location input must NOT exist
    expect(screen.queryByPlaceholderText(/Estado o ciudad/i)).not.toBeInTheDocument();
  });

  it("submits keyword query without location input", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} isSearching={false} initialQuery="React" />);

    const submitBtn = screen.getByRole("button", { name: /Buscar en Vivo/i });
    fireEvent.click(submitBtn);

    expect(onSearch).toHaveBeenCalledWith("React");
  });

  it("focuses query input when pressing '/' shortcut outside input", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} isSearching={false} initialQuery="" />);

    const queryInput = screen.getByPlaceholderText(/Rol o tecnología/i);
    expect(document.activeElement).not.toBe(queryInput);

    fireEvent.keyDown(document, { key: "/" });
    expect(document.activeElement).toBe(queryInput);
  });
});
