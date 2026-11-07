import { JobVacancy, SortOrder, TimeframeId } from "../types/job";

export interface TimeframeConfig {
  id: TimeframeId;
  label: string;
  description: string;
  maxAgeMs?: number;
  minAgeMs?: number;
}

export const TIMEFRAMES: TimeframeConfig[] = [
  { id: "all", label: "Cualquier fecha", description: "Todas las vacantes disponibles" },
  { id: "1h", label: "Última hora", description: "Publicadas en los últimos 60 minutos", maxAgeMs: 3_600_000 },
  { id: "24h", label: "Últimas 24 horas", description: "Publicadas en las últimas 24 horas", maxAgeMs: 86_400_000 },
  { id: "3d", label: "Últimos 3 días", description: "Publicadas en los últimos 3 días", maxAgeMs: 259_200_000 },
  { id: "7d", label: "Última semana", description: "Publicadas en los últimos 7 días", maxAgeMs: 604_800_000 },
  { id: "30d", label: "Último mes", description: "Publicadas en los últimos 30 días", maxAgeMs: 2_592_000_000 },
  { id: "30d_plus", label: "Más de 1 mes", description: "Publicadas hace más de 30 días", minAgeMs: 2_592_000_000 },
];

export const VALID_TIMEFRAME_IDS: TimeframeId[] = [
  "all",
  "1h",
  "24h",
  "3d",
  "7d",
  "30d",
  "30d_plus",
];

/**
 * Filters vacancies based on cumulative timeframes using multi-select inclusive union.
 * Postings with published_at == null are excluded from specific timeframes and only match "all".
 */
export function filterVacanciesByTimeframes(
  vacancies: JobVacancy[],
  timeframes: TimeframeId[],
  now: Date = new Date()
): JobVacancy[] {
  if (timeframes.includes("all") || timeframes.length === 0) {
    return vacancies;
  }

  const activeConfigs = TIMEFRAMES.filter((tf) => timeframes.includes(tf.id) && tf.id !== "all");

  return vacancies.filter((v) => {
    if (!v.published_at) {
      return false;
    }
    const pubTime = new Date(v.published_at).getTime();
    if (isNaN(pubTime)) {
      return false;
    }
    const ageMs = now.getTime() - pubTime;
    if (ageMs < 0) {
      // Future timestamp treated as fresh (0 ms)
      return activeConfigs.some((cfg) => cfg.maxAgeMs !== undefined);
    }

    return activeConfigs.some((cfg) => {
      if (cfg.maxAgeMs !== undefined && ageMs <= cfg.maxAgeMs) {
        return true;
      }
      if (cfg.minAgeMs !== undefined && ageMs > cfg.minAgeMs) {
        return true;
      }
      return false;
    });
  });
}

/**
 * Calculates count of vacancies matching a specific timeframe in the current search context.
 */
export function calculateTimeframeCount(
  vacancies: JobVacancy[],
  timeframe: TimeframeConfig,
  now: Date = new Date()
): number {
  if (timeframe.id === "all") {
    return vacancies.length;
  }
  return filterVacanciesByTimeframes(vacancies, [timeframe.id], now).length;
}

/**
 * Formats publication date into human-readable Mexican Spanish relative time.
 */
export function formatMexicanRelativeTime(
  publishedAt: string | null | undefined,
  now: Date = new Date()
): string {
  if (!publishedAt) {
    return "Fecha no especificada";
  }

  const pubTime = new Date(publishedAt).getTime();
  if (isNaN(pubTime)) {
    return "Fecha no especificada";
  }

  const elapsedMs = now.getTime() - pubTime;
  if (elapsedMs < 0) {
    return "Hace unos momentos";
  }

  const seconds = Math.floor(elapsedMs / 1000);
  if (seconds < 60) {
    return "Hace unos momentos";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return minutes === 1 ? "Hace 1 minuto" : `Hace ${minutes} minutos`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? "Hace 1 hora" : `Hace ${hours} horas`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return days === 1 ? "Hace 1 día" : `Hace ${days} días`;
  }

  const weeks = Math.floor(days / 7);
  if (days < 30) {
    return weeks === 1 ? "Hace 1 semana" : `Hace ${weeks} semanas`;
  }

  return "Hace más de 1 mes";
}

/**
 * Checks whether a vacancy qualifies for the "Nueva" badge (published <= 48 hours).
 */
export function isNewVacancy(
  publishedAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!publishedAt) {
    return false;
  }

  const pubTime = new Date(publishedAt).getTime();
  if (isNaN(pubTime)) {
    return false;
  }

  const elapsedMs = now.getTime() - pubTime;
  return elapsedMs >= 0 && elapsedMs <= 48 * 3600 * 1000;
}

/**
 * Sorts vacancies according to the specified sort order.
 * - recent: published_at descending (nulls last)
 * - compatibility: heuristic_fit_score descending (unscored last)
 * - relevance: original arrival order
 */
export function sortVacancies(vacancies: JobVacancy[], sortOrder: SortOrder): JobVacancy[] {
  if (sortOrder === "relevance") {
    return [...vacancies];
  }

  if (sortOrder === "recent") {
    return [...vacancies].sort((a, b) => {
      const timeA = a.published_at ? new Date(a.published_at).getTime() : -Infinity;
      const timeB = b.published_at ? new Date(b.published_at).getTime() : -Infinity;
      const validA = !isNaN(timeA) && a.published_at !== null && a.published_at !== undefined;
      const validB = !isNaN(timeB) && b.published_at !== null && b.published_at !== undefined;

      if (validA && validB) {
        return timeB - timeA;
      }
      if (validA && !validB) {
        return -1;
      }
      if (!validA && validB) {
        return 1;
      }
      return 0;
    });
  }

  if (sortOrder === "compatibility") {
    return [...vacancies].sort((a, b) => {
      const scoreA = a.heuristic_fit_score;
      const scoreB = b.heuristic_fit_score;
      const validA = scoreA !== null && scoreA !== undefined;
      const validB = scoreB !== null && scoreB !== undefined;

      if (validA && validB) {
        return (scoreB as number) - (scoreA as number);
      }
      if (validA && !validB) {
        return -1;
      }
      if (!validA && validB) {
        return 1;
      }
      return 0;
    });
  }

  return [...vacancies];
}

/**
 * Parses URL published_within parameter into an array of TimeframeId tokens.
 * Falls back to ["all"] if param is missing, empty, or contains invalid tokens.
 */
export function parseTimeframesFromQuery(queryValue: string | null): TimeframeId[] {
  if (!queryValue || !queryValue.trim()) {
    return ["all"];
  }

  const tokens = queryValue
    .split(",")
    .map((t) => t.trim())
    .filter((t) => VALID_TIMEFRAME_IDS.includes(t as TimeframeId)) as TimeframeId[];

  if (tokens.length === 0 || tokens.includes("all")) {
    return ["all"];
  }

  return tokens;
}

/**
 * Serializes timeframe selections into URL parameter string, or null if "all" / empty.
 */
export function serializeTimeframesToQuery(timeframes: TimeframeId[]): string | null {
  if (timeframes.includes("all") || timeframes.length === 0) {
    return null;
  }

  const nonAll = timeframes.filter((t) => t !== "all");
  return nonAll.length > 0 ? nonAll.join(",") : null;
}
