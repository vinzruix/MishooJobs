import { describe, expect, it } from "vitest";
import {
  calculateTimeframeCount,
  filterVacanciesByTimeframes,
  formatMexicanRelativeTime,
  isNewVacancy,
  parseTimeframesFromQuery,
  serializeTimeframesToQuery,
  sortVacancies,
  TIMEFRAMES,
} from "../../src/services/date_utils";
import { JobVacancy } from "../../src/types/job";

const mockVacancy = (overrides: Partial<JobVacancy>): JobVacancy => ({
  fingerprint: "test-fingerprint-" + Math.random(),
  title: "Desarrollador Junior",
  company_name: "Empresa Test",
  location_state: "CDMX",
  modality: "remoto",
  category: "junior",
  currency: "MXN",
  description: "Descripción de prueba",
  skills: ["React"],
  external_links: [],
  ...overrides,
});

describe("date_utils", () => {
  const refTime = new Date("2026-11-06T12:00:00Z");

  describe("User Story 1: filterVacanciesByTimeframes", () => {
    const v30m = mockVacancy({
      fingerprint: "v30m",
      published_at: new Date(refTime.getTime() - 30 * 60 * 1000).toISOString(),
    }); // 30 minutes ago
    const v5h = mockVacancy({
      fingerprint: "v5h",
      published_at: new Date(refTime.getTime() - 5 * 3600 * 1000).toISOString(),
    }); // 5 hours ago
    const v2d = mockVacancy({
      fingerprint: "v2d",
      published_at: new Date(refTime.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
    }); // 2 days ago
    const v5d = mockVacancy({
      fingerprint: "v5d",
      published_at: new Date(refTime.getTime() - 5 * 24 * 3600 * 1000).toISOString(),
    }); // 5 days ago
    const v20d = mockVacancy({
      fingerprint: "v20d",
      published_at: new Date(refTime.getTime() - 20 * 24 * 3600 * 1000).toISOString(),
    }); // 20 days ago
    const v40d = mockVacancy({
      fingerprint: "v40d",
      published_at: new Date(refTime.getTime() - 40 * 24 * 3600 * 1000).toISOString(),
    }); // 40 days ago
    const vNull = mockVacancy({ fingerprint: "vNull", published_at: null });

    const allVacancies = [v30m, v5h, v2d, v5d, v20d, v40d, vNull];

    it("returns all vacancies when timeframe includes 'all'", () => {
      expect(filterVacanciesByTimeframes(allVacancies, ["all"], refTime)).toHaveLength(7);
      expect(filterVacanciesByTimeframes(allVacancies, [], refTime)).toHaveLength(7);
    });

    it("filters for '1h' (<= 1 hour)", () => {
      const res = filterVacanciesByTimeframes(allVacancies, ["1h"], refTime);
      expect(res.map((v) => v.fingerprint)).toEqual(["v30m"]);
    });

    it("filters for '24h' cumulative (<= 24 hours, includes <= 1h)", () => {
      const res = filterVacanciesByTimeframes(allVacancies, ["24h"], refTime);
      expect(res.map((v) => v.fingerprint)).toEqual(["v30m", "v5h"]);
    });

    it("filters for '3d' cumulative (<= 3 days)", () => {
      const res = filterVacanciesByTimeframes(allVacancies, ["3d"], refTime);
      expect(res.map((v) => v.fingerprint)).toEqual(["v30m", "v5h", "v2d"]);
    });

    it("filters for '7d' cumulative (<= 7 days)", () => {
      const res = filterVacanciesByTimeframes(allVacancies, ["7d"], refTime);
      expect(res.map((v) => v.fingerprint)).toEqual(["v30m", "v5h", "v2d", "v5d"]);
    });

    it("filters for '30d' cumulative (<= 30 days)", () => {
      const res = filterVacanciesByTimeframes(allVacancies, ["30d"], refTime);
      expect(res.map((v) => v.fingerprint)).toEqual(["v30m", "v5h", "v2d", "v5d", "v20d"]);
    });

    it("filters for '30d_plus' (> 30 days)", () => {
      const res = filterVacanciesByTimeframes(allVacancies, ["30d_plus"], refTime);
      expect(res.map((v) => v.fingerprint)).toEqual(["v40d"]);
    });

    it("strictly excludes published_at == null from all specific timeframes", () => {
      const timeframes = ["1h", "24h", "3d", "7d", "30d", "30d_plus"] as const;
      for (const tf of timeframes) {
        const res = filterVacanciesByTimeframes([vNull], [tf], refTime);
        expect(res).toHaveLength(0);
      }
    });

    it("supports multi-select inclusive union (e.g. 1h and 30d_plus)", () => {
      const res = filterVacanciesByTimeframes(allVacancies, ["1h", "30d_plus"], refTime);
      expect(res.map((v) => v.fingerprint)).toEqual(["v30m", "v40d"]);
    });
  });

  describe("User Story 2: formatMexicanRelativeTime and isNewVacancy", () => {
    it("formats relative timestamps in Mexican Spanish correctly", () => {
      expect(formatMexicanRelativeTime(null, refTime)).toBe("Fecha no especificada");
      expect(formatMexicanRelativeTime(undefined, refTime)).toBe("Fecha no especificada");
      expect(formatMexicanRelativeTime("invalid-date", refTime)).toBe("Fecha no especificada");

      // < 60s
      const t30s = new Date(refTime.getTime() - 30 * 1000).toISOString();
      expect(formatMexicanRelativeTime(t30s, refTime)).toBe("Hace unos momentos");

      // minutes
      const t1m = new Date(refTime.getTime() - 60 * 1000).toISOString();
      expect(formatMexicanRelativeTime(t1m, refTime)).toBe("Hace 1 minuto");
      const t15m = new Date(refTime.getTime() - 15 * 60 * 1000).toISOString();
      expect(formatMexicanRelativeTime(t15m, refTime)).toBe("Hace 15 minutos");

      // hours
      const t1h = new Date(refTime.getTime() - 3600 * 1000).toISOString();
      expect(formatMexicanRelativeTime(t1h, refTime)).toBe("Hace 1 hora");
      const t4h = new Date(refTime.getTime() - 4 * 3600 * 1000).toISOString();
      expect(formatMexicanRelativeTime(t4h, refTime)).toBe("Hace 4 horas");

      // days
      const t1d = new Date(refTime.getTime() - 24 * 3600 * 1000).toISOString();
      expect(formatMexicanRelativeTime(t1d, refTime)).toBe("Hace 1 día");
      const t3d = new Date(refTime.getTime() - 3 * 24 * 3600 * 1000).toISOString();
      expect(formatMexicanRelativeTime(t3d, refTime)).toBe("Hace 3 días");

      // weeks
      const t1w = new Date(refTime.getTime() - 7 * 24 * 3600 * 1000).toISOString();
      expect(formatMexicanRelativeTime(t1w, refTime)).toBe("Hace 1 semana");
      const t2w = new Date(refTime.getTime() - 14 * 24 * 3600 * 1000).toISOString();
      expect(formatMexicanRelativeTime(t2w, refTime)).toBe("Hace 2 semanas");

      // > 30 days
      const t35d = new Date(refTime.getTime() - 35 * 24 * 3600 * 1000).toISOString();
      expect(formatMexicanRelativeTime(t35d, refTime)).toBe("Hace más de 1 mes");
    });

    it("evaluates isNewVacancy with exact 48-hour boundary", () => {
      expect(isNewVacancy(null, refTime)).toBe(false);
      expect(isNewVacancy(undefined, refTime)).toBe(false);

      const within48h = new Date(refTime.getTime() - 47 * 3600 * 1000).toISOString();
      expect(isNewVacancy(within48h, refTime)).toBe(true);

      const exact48h = new Date(refTime.getTime() - 48 * 3600 * 1000).toISOString();
      expect(isNewVacancy(exact48h, refTime)).toBe(true);

      const past48h = new Date(refTime.getTime() - 49 * 3600 * 1000).toISOString();
      expect(isNewVacancy(past48h, refTime)).toBe(false);
    });
  });

  describe("User Story 3: calculateTimeframeCount & sortVacancies", () => {
    const vRecent = mockVacancy({
      fingerprint: "recent",
      published_at: new Date(refTime.getTime() - 1 * 3600 * 1000).toISOString(),
      heuristic_fit_score: 50,
    });
    const vOlder = mockVacancy({
      fingerprint: "older",
      published_at: new Date(refTime.getTime() - 48 * 3600 * 1000).toISOString(),
      heuristic_fit_score: 95,
    });
    const vNullDate = mockVacancy({
      fingerprint: "nullDate",
      published_at: null,
      heuristic_fit_score: 80,
    });

    it("calculates cumulative counts for each timeframe", () => {
      const vacancies = [vRecent, vOlder, vNullDate];
      const allCfg = TIMEFRAMES.find((t) => t.id === "all")!;
      const h1Cfg = TIMEFRAMES.find((t) => t.id === "1h")!;
      const d3Cfg = TIMEFRAMES.find((t) => t.id === "3d")!;

      expect(calculateTimeframeCount(vacancies, allCfg, refTime)).toBe(3);
      expect(calculateTimeframeCount(vacancies, h1Cfg, refTime)).toBe(1);
      expect(calculateTimeframeCount(vacancies, d3Cfg, refTime)).toBe(2);
    });

    it("sorts by 'recent' (descending published_at, nulls last)", () => {
      const sorted = sortVacancies([vNullDate, vOlder, vRecent], "recent");
      expect(sorted.map((v) => v.fingerprint)).toEqual(["recent", "older", "nullDate"]);
    });

    it("sorts by 'compatibility' (descending fitScore, unscored last)", () => {
      const vUnscored = mockVacancy({ fingerprint: "unscored", heuristic_fit_score: null });
      const sorted = sortVacancies([vRecent, vOlder, vUnscored], "compatibility");
      expect(sorted.map((v) => v.fingerprint)).toEqual(["older", "recent", "unscored"]);
    });

    it("preserves order when sorting by 'relevance'", () => {
      const initial = [vOlder, vNullDate, vRecent];
      const sorted = sortVacancies(initial, "relevance");
      expect(sorted.map((v) => v.fingerprint)).toEqual(["older", "nullDate", "recent"]);
    });
  });

  describe("User Story 4: URL serialization and parsing", () => {
    it("parses single token from query parameter", () => {
      expect(parseTimeframesFromQuery("24h")).toEqual(["24h"]);
    });

    it("parses comma-separated tokens from query parameter", () => {
      expect(parseTimeframesFromQuery("1h,3d")).toEqual(["1h", "3d"]);
    });

    it("falls back to ['all'] for invalid or unrecognized tokens", () => {
      expect(parseTimeframesFromQuery("invalid_token")).toEqual(["all"]);
      expect(parseTimeframesFromQuery("")).toEqual(["all"]);
      expect(parseTimeframesFromQuery(null)).toEqual(["all"]);
    });

    it("falls back to ['all'] if 'all' is explicitly included among tokens", () => {
      expect(parseTimeframesFromQuery("1h,all,3d")).toEqual(["all"]);
    });

    it("serializes timeframes into URL parameter", () => {
      expect(serializeTimeframesToQuery(["24h"])).toBe("24h");
      expect(serializeTimeframesToQuery(["1h", "7d"])).toBe("1h,7d");
    });

    it("omits parameter (returns null) when 'all' is active or empty", () => {
      expect(serializeTimeframesToQuery(["all"])).toBeNull();
      expect(serializeTimeframesToQuery([])).toBeNull();
    });
  });
});
