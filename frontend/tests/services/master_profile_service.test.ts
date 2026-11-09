import { describe, it, expect, beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { db } from "../../src/db";
import {
  parseAndValidateYAML,
  getMasterProfileStarterTemplate,
  saveMasterProfile,
  loadMasterProfile,
  exportMasterProfileYAML,
} from "../../src/services/master_profile_service";

describe("master_profile_service", () => {
  beforeEach(async () => {
    await db.master_profile.clear();
  });

  it("generates a valid starter template conforming to canonical structure", () => {
    const starterYaml = getMasterProfileStarterTemplate();
    expect(starterYaml).toContain("personal_info:");
    expect(starterYaml).toContain("tech:");
    expect(starterYaml).toContain("backend:");

    const result = parseAndValidateYAML(starterYaml);
    expect(result.valid).toBe(true);
    expect(result.parsed).toBeDefined();
    expect(result.parsed?.personal_info.full_name).toBeTruthy();
    expect(result.parsed?.tech.backend.length).toBeGreaterThan(0);
  });

  it("detects syntax errors with line numbers on invalid YAML", () => {
    const invalidYaml = `
personal_info:
  full_name: "Test User"
  broken: [ unclosed array
`;
    const result = parseAndValidateYAML(invalidYaml);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.line).toBeGreaterThan(0);
  });

  it("detects missing critical root keys", () => {
    const missingKeysYaml = `
personal_info:
  full_name: "Incomplete User"
about_me: "Short bio"
`;
    const result = parseAndValidateYAML(missingKeysYaml);
    expect(result.valid).toBe(false);
    expect(result.error?.message).toContain("tech");
  });

  it("saves and loads master profile from Dexie", async () => {
    const starterYaml = getMasterProfileStarterTemplate();
    const { parsed } = parseAndValidateYAML(starterYaml);
    expect(parsed).toBeDefined();

    await saveMasterProfile(starterYaml, parsed!);

    const record = await loadMasterProfile();
    expect(record).toBeDefined();
    expect(record?.raw_yaml).toBe(starterYaml);
    expect(record?.parsed.personal_info.full_name).toBe(parsed?.personal_info.full_name);
  });

  it("creates starter template if loading from empty Dexie database", async () => {
    const record = await loadMasterProfile();
    expect(record).toBeDefined();
    expect(record?.id).toBe("current");
    expect(record?.parsed.personal_info).toBeDefined();
  });

  it("exports master profile YAML via blob download link", () => {
    const createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url");
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;
    const clickMock = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    exportMasterProfileYAML("test_yaml: true", "custom_profile.yml");
    expect(createObjectURLMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-url");
    expect(clickMock).toHaveBeenCalled();
    clickMock.mockRestore();
  });
});
