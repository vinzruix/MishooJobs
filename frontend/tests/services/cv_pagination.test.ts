import { describe, it, expect } from "vitest";
import {
  computeColumnSplit,
  PRINTABLE_PAGE_HEIGHT_PX,
  type MeasurableBlock,
} from "../../src/services/cv_pagination";

describe("cv_pagination computeColumnSplit", () => {
  it("keeps all blocks on Page 1 when total height fits within budget", () => {
    const blocks: MeasurableBlock[] = [
      { id: "summary" },
      { id: "exp-head", section: "experience", isHeading: true },
      { id: "exp-0", section: "experience" },
      { id: "certs" },
    ];
    const heights = { summary: 120, "exp-head": 24, "exp-0": 260, certs: 150 };

    const res = computeColumnSplit(blocks, heights, PRINTABLE_PAGE_HEIGHT_PX - 120, false);

    expect(res.fitsOnePage).toBe(true);
    expect(res.page1Ids).toEqual(["summary", "exp-head", "exp-0", "certs"]);
    expect(res.page2Ids).toEqual([]);
    expect(res.continuedSections).toEqual([]);
  });

  it("moves section heading and first item together to Page 2 instead of orphaning the heading", () => {
    const blocks: MeasurableBlock[] = [
      { id: "summary" },
      { id: "exp-head", section: "experience", isHeading: true },
      { id: "exp-0", section: "experience" },
      { id: "cert-head", section: "certificates", isHeading: true },
      { id: "cert-0", section: "certificates" },
    ];
    // summary + exp-head + exp-0 = 700; remaining budget = 40; cert-head (25) fits, cert-0 (120) does not
    const heights = {
      summary: 150,
      "exp-head": 25,
      "exp-0": 525,
      "cert-head": 25,
      "cert-0": 120,
    };

    const res = computeColumnSplit(blocks, heights, 740, false);

    expect(res.fitsOnePage).toBe(false);
    expect(res.page1Ids).toEqual(["summary", "exp-head", "exp-0"]);
    expect(res.page2Ids).toEqual(["cert-head", "cert-0"]);
    expect(res.continuedSections).toEqual([]);
  });

  it("records continuedSections when a multi-item section splits cleanly across Page 1 and Page 2", () => {
    const blocks: MeasurableBlock[] = [
      { id: "exp-head", section: "experience", isHeading: true },
      { id: "exp-0", section: "experience" },
      { id: "exp-1", section: "experience" },
      { id: "edu-head", section: "education", isHeading: true },
      { id: "edu-0", section: "education" },
    ];
    const heights = {
      "exp-head": 24,
      "exp-0": 450,
      "exp-1": 450,
      "edu-head": 24,
      "edu-0": 100,
    };

    const res = computeColumnSplit(blocks, heights, 600, false);

    expect(res.fitsOnePage).toBe(false);
    expect(res.page1Ids).toEqual(["exp-head", "exp-0"]);
    expect(res.page2Ids).toEqual(["exp-1", "edu-head", "edu-0"]);
    expect(res.continuedSections).toEqual(["experience"]);
  });

  it("applies collapse hysteresis when already split across 2 pages", () => {
    const blocks: MeasurableBlock[] = [
      { id: "summary" },
      { id: "certs" },
    ];
    // Total = 796px, budget = 800px, but within 8px hysteresis buffer (800 - 8 = 792) -> stays split
    const heights = { summary: 600, certs: 196 };

    const res = computeColumnSplit(blocks, heights, 800, true);

    expect(res.fitsOnePage).toBe(false);
    expect(res.page1Ids).toEqual(["summary"]);
    expect(res.page2Ids).toEqual(["certs"]);
  });
});
