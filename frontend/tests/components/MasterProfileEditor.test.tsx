import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "fake-indexeddb/auto";
import { db } from "../../src/db";
import { MasterProfileEditor } from "../../src/components/MasterProfileEditor";

describe("MasterProfileEditor Component Tests", () => {
  beforeEach(async () => {
    await db.master_profile.clear();
    await db.master_profile_photo.clear();
  });

  it("renders editor with valid starter template and emerald badge", async () => {
    render(<MasterProfileEditor isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId("syntax-valid-badge")).toBeInTheDocument();
    });

    expect(screen.getByText("[ESTRUCTURA VÁLIDA]")).toBeInTheDocument();
    const saveBtn = screen.getByTestId("save-master-profile-btn");
    expect(saveBtn).not.toBeDisabled();
  });

  it("toggles to rose error badge and disables save button on syntax error", async () => {
    render(<MasterProfileEditor isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId("syntax-valid-badge")).toBeInTheDocument();
    });

    const textarea = screen.getByTestId("master-profile-textarea");
    fireEvent.change(textarea, { target: { value: "invalid: [ unclosed" } });

    await waitFor(() => {
      expect(screen.getByTestId("syntax-error-badge")).toBeInTheDocument();
    });

    const saveBtn = screen.getByTestId("save-master-profile-btn");
    expect(saveBtn).toBeDisabled();
  });

  it("opens destructive overwrite confirmation dialog when a file is selected", async () => {
    render(<MasterProfileEditor isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId("syntax-valid-badge")).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText("Subir currículum");
    const fakeFile = new File(["personal_info: test"], "resume.yml", { type: "text/yaml" });

    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    await waitFor(() => {
      expect(screen.getByTestId("overwrite-confirm-modal")).toBeInTheDocument();
    });

    expect(screen.getByText("¿Sobreescribir Perfil Maestro?")).toBeInTheDocument();
  });

  it("saves valid master profile to IndexedDB", async () => {
    const onSaved = vi.fn();
    render(<MasterProfileEditor isOpen={true} onClose={() => {}} onProfileSaved={onSaved} />);

    await waitFor(() => {
      expect(screen.getByTestId("syntax-valid-badge")).toBeInTheDocument();
    });

    const saveBtn = screen.getByTestId("save-master-profile-btn");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
    });

    const record = await db.master_profile.get("current");
    expect(record).toBeDefined();
    expect(record?.raw_yaml).toContain("personal_info:");
  });
});
