# Research: Date-Relevant Vacancy Filters (MishooJobs)

**Feature**: `002-date-vacancy-filters`  
**Date**: 2026-11-06  
**Status**: Complete  

---

## 1. Publication Date Ingestion & Mexican Relative Date Parsing

### Context & Problem
External Mexican job portals (Computrabajo, Indeed México, OCC Mundial) frequently display publication dates as localized relative phrases (e.g., *"Hace 2 horas"*, *"Publicada hoy"*, *"Ayer"*, *"Hace 3 días"*, *"Hace 1 semana"*) or localized date strings rather than standardized ISO 8601 timestamps. To enable filtering and recency sorting, these strings must be transformed into standardized UTC `datetime` objects during ingestion. Furthermore, per user clarification (FR-006), if an external portal listing lacks a publication date or the date cannot be parsed, the system must set `published_at` to `None`/`null` and gracefully handle it.

### Decision
Implement a deterministic, regex-based parsing utility in `backend/src/mishoojobs/services/scrapers/base.py`:
`AbstractBaseScraper.parse_mexican_relative_date(raw_text: Optional[str], reference_dt: Optional[datetime] = None) -> Optional[datetime]`.

Supported Mexican expressions:
1. **Minutes / Moments**:
   - `r"hace\s+(\d+)\s+minuto"` -> `reference_dt - timedelta(minutes=N)`
   - `r"hace\s+un\s+momento"`, `r"recien"`, `r"hace\s+instantes"` -> `reference_dt`
2. **Hours**:
   - `r"hace\s+(\d+)\s+hora"` -> `reference_dt - timedelta(hours=N)`
   - `r"hace\s+(?:una|1)\s+hora"` -> `reference_dt - timedelta(hours=1)`
3. **Days**:
   - `r"hace\s+(\d+)\s+d[ií]a"` -> `reference_dt - timedelta(days=N)`
   - `r"hace\s+(?:un|1)\s+d[ií]a"` -> `reference_dt - timedelta(days=1)`
   - `r"\bhoy\b"`, `r"publicad[oa]\s+hoy"` -> `reference_dt`
   - `r"\bayer\b"` -> `reference_dt - timedelta(days=1)`
4. **Weeks**:
   - `r"hace\s+(\d+)\s+semana"` -> `reference_dt - timedelta(days=N * 7)`
   - `r"hace\s+(?:una|1)\s+semana"` -> `reference_dt - timedelta(days=7)`
5. **Months**:
   - `r"hace\s+(\d+)\s+mes(?:es)?"` -> `reference_dt - timedelta(days=N * 30)`
   - `r"hace\s+(?:un|1)\s+mes"` -> `reference_dt - timedelta(days=30)`
   - `r"m[aá]s\s+de\s+(?:un|1)\s+mes"` -> `reference_dt - timedelta(days=35)`
6. **Fallback & Failure**:
   - If `raw_text` is empty, unparseable, or contains no date indicators, return `None`.

### Rationale
- Pure regex with standard library `datetime` avoids heavyweight external dependencies (such as `dateparser` or `arrow`) which introduce non-deterministic locale files and large overhead.
- All operations are evaluated against a mockable `reference_dt` (defaulting to `datetime.now(timezone.utc)`), allowing 100% deterministic offline unit testing.
- Follows the Mexican Spanish localization rules specified in Constitution Principle II.

### Alternatives Considered
- **External library `dateparser`**: Rejected due to 40MB+ dependencies (regex, tzlocal, dateutil) and potential nondeterminism in production builds.
- **Client-side only date parsing from raw strings**: Rejected because backend sorting, PostgreSQL recency indexing, and database upsert require structured timestamps in `vacancies` table.

---

## 2. Cumulative Timeframe Filtering & Multi-Select Inclusive Union

### Context & Problem
Candidates need to filter vacancies by how recently they were posted. The filter options are:
- "Cualquier fecha" (`all`)
- "Última hora" (`1h`)
- "Últimas 24 horas" (`24h`)
- "Últimos 3 días" (`3d`)
- "Última semana" (`7d`)
- "Último mes" (`30d`)
- "Más de 1 mes" (`30d_plus`)

Per user clarifications:
1. Options represent **cumulative thresholds** (e.g. `≤ 24h` includes `≤ 1h`; `≤ 7d` includes `≤ 3d`).
2. When multiple timeframes are selected, the evaluation must be an **inclusive union** (e.g. selecting `1h` and `3d` encompasses all jobs posted within the last 3 days).
3. "Cualquier fecha" acts as a master reset: selecting it unchecks specific timeframes; selecting any specific timeframe unchecks "Cualquier fecha".
4. Vacancies with missing/unparseable dates (`published_at == null`) MUST ONLY appear under "Cualquier fecha" and be excluded from all specific time-window filters and the "Nueva" badge.

### Decision
Define a unified filter predicate on the client in `frontend/src/services/date_utils.ts`:

```typescript
export type TimeframeId = "all" | "1h" | "24h" | "3d" | "7d" | "30d" | "30d_plus";

export interface TimeframeConfig {
  id: TimeframeId;
  label: string;
  maxAgeMs?: number; // cumulative ceiling
  minAgeMs?: number; // floor for '30d_plus'
}

export const TIMEFRAMES: TimeframeConfig[] = [
  { id: "all", label: "Cualquier fecha" },
  { id: "1h", label: "Última hora", maxAgeMs: 60 * 60 * 1000 },
  { id: "24h", label: "Últimas 24 horas", maxAgeMs: 24 * 60 * 60 * 1000 },
  { id: "3d", label: "Últimos 3 días", maxAgeMs: 3 * 24 * 60 * 60 * 1000 },
  { id: "7d", label: "Última semana", maxAgeMs: 7 * 24 * 60 * 60 * 1000 },
  { id: "30d", label: "Último mes", maxAgeMs: 30 * 24 * 60 * 60 * 1000 },
  { id: "30d_plus", label: "Más de 1 mes", minAgeMs: 30 * 24 * 60 * 60 * 1000 },
];
```

Evaluation rules:
- If `timeframes.includes("all")` or `timeframes.length === 0`: return `true`.
- If `published_at == null`: return `false` for any specific timeframe.
- Calculate `ageMs = now.getTime() - new Date(published_at).getTime()`.
- Return `true` if `ageMs` satisfies ANY selected timeframe's `(maxAgeMs ? ageMs <= maxAgeMs : true) && (minAgeMs ? ageMs > minAgeMs : true)`.

### Rationale
- Cumulative evaluation aligns directly with candidate mental models ("show me everything posted in the last 24 hours").
- Multi-select union provides full flexibility without creating contradictory empty sets.
- Strict exclusion of null dates from specific timeframes protects users from outdated listings masquerading as fresh posts.

### Alternatives Considered
- **Mutually exclusive discrete slices** (e.g. 1h-24h, 24h-3d): Rejected because it forces candidates to manually select multiple boxes to see everything posted this week, complicating UI counts.

---

## 3. Real-Time 60-Second Auto-Ticker & Client-Side Freshness

### Context & Problem
FR-006 and FR-007 mandate:
- Relative timestamps in Mexican Spanish (e.g., *"Hace unos momentos"*, *"Hace 2 horas"*, *"Hace 1 día"*).
- A high-contrast "Nueva" visual badge on listings published within the last 48 hours.
- Automatic updates every 60 seconds without network requests or disrupting user interaction / pagination.

### Decision
1. Implement a shared ticker hook `useDateTicker(intervalMs = 60_000)`:
   - Emits a new timestamp every 60 seconds.
   - Used at the page level or injected via React context / prop to trigger freshness recalculation.
2. Relative time string formatter `formatMexicanRelativeTime(publishedAt: string | null | undefined, now: Date)`:
   - `publishedAt == null` -> `"Fecha no especificada"`
   - `elapsed < 60s` -> `"Hace unos momentos"`
   - `elapsed < 3600s` -> `Hace ${Math.floor(elapsed / 60)} minuto(s)`
   - `elapsed < 86400s` -> `Hace ${Math.floor(elapsed / 3600)} hora(s)`
   - `elapsed < 604800s` (7d) -> `Hace ${Math.floor(elapsed / 86400)} día(s)`
   - `elapsed < 2592000s` (30d) -> `Hace ${Math.floor(elapsed / 604800)} semana(s)`
   - `elapsed >= 2592000s` -> `"Hace más de 1 mes"`
3. "Nueva" Badge Eligibility:
   - `isNewVacancy(publishedAt, now)` returns `true` if `publishedAt != null` and `(now - publishedAt) <= 48 * 3600 * 1000`.

### Rationale
- Single 60-second timer eliminates CPU spinning and memory leaks associated with per-card timers.
- Localized phrasing adheres to Mexican Spanish conventions (*"Hace unos momentos"*, *"Hace 1 día"*).
- Instant UI responsiveness (< 1ms per batch recalculation).

### Alternatives Considered
- **Using `date-fns` or `dayjs`**: Rejected to avoid adding third-party dependencies when native JS date math handles these intervals cleanly in under 40 lines of code.

---

## 4. Smart Recency Ordering & Sorting Control

### Context & Problem
FR-009 requires:
- A visible sorting control in the results toolbar with options:
  1. "Más recientes primero" (`recent`)
  2. "Mayor compatibilidad (Fit Score)" (`compatibility`)
  3. "Relevancia por defecto" (`relevance`)
- When a candidate selects a timeframe of 3 days or less (`1h`, `24h`, or `3d`), the system must automatically set the sort order to "Más recientes primero", unless the user has already explicitly chosen an alternate sort option in that session.

### Decision
1. State management in `App.tsx`:
   - `sortOrder: SortOrder` (default: `"relevance"`).
   - `isSortUserOverridden: boolean` (default: `false`).
2. Interaction behavior:
   - When the user selects a timeframe containing `1h`, `24h`, or `3d`:
     ```typescript
     if (!isSortUserOverridden) {
       setSortOrder("recent");
     }
     ```
   - When the user explicitly interacts with the sorting dropdown:
     ```typescript
     setSortOrder(newSort);
     setIsSortUserOverridden(true);
     ```
3. Sorting logic:
   - `recent`: Order by `published_at` descending (nulls last).
   - `compatibility`: Order by `fitScore` descending (unscored last).
   - `relevance`: Maintain original stream / deduplicated arrival order.

### Rationale
- Anticipates candidate intent when searching for very recent vacancies while respecting explicit user autonomy if they prioritize skill match.

### Alternatives Considered
- **Forced sort override on every date filter change**: Rejected because it frustrates users who deliberately want to view high-fit vacancies within the last 24 hours.

---

## 5. URL Query Synchronization & History Navigation

### Context & Problem
FR-005 and SC-004 require syncing the date filter with the browser URL query parameter `?published_within=...` (e.g. `?published_within=24h` or comma-separated `?published_within=24h,3d`), ensuring shareable links and proper browser Back/Forward navigation.

### Decision
1. In `App.tsx` / `useJobStream` or dedicated hook `useDateFilterUrlSync`:
   - On initial mount: parse `window.location.search` for `published_within`. Validate tokens against valid `TimeframeId` values. Fall back to `["all"]` if empty or invalid.
   - On filter state change: update `window.history.replaceState` (or `pushState`) without triggering full-page reload, retaining other parameters (`query`, `location`, `modality`, `category`).
   - Listen to `popstate` event to synchronize React state when user navigates with browser Back/Forward buttons.
2. Clean reset: When `Limpiar filtro` is clicked or `all` is selected, remove `published_within` from the URL string.

### Rationale
- Adheres to zero-account, frictionless sharing principles (Constitution Principle I).
- Enables sending filtered links directly to classmates, students, or mentors.

### Alternatives Considered
- **React Router**: MishooJobs v0 uses a lightweight single-page layout without a heavy router dependency. Native `window.location` + `window.history` is lean, robust, and zero-dependency.

---

## 6. Summary of Decisions

| Item | Decision | Key Rationale |
|------|----------|---------------|
| **Backend Storage** | Add `published_at TIMESTAMPTZ NULL` to `JobVacancy` & `VacancyDTO` | Standardized UTC timestamps, indexed for fast recency queries. |
| **Date Parsing** | Regex-based `parse_mexican_relative_date` in base scraper | Pure stdlib, offline testable, calibrated for Computrabajo, Indeed, OCC. |
| **Timeframe Filter** | Cumulative thresholds with inclusive union multi-select | Aligns with candidate mental model; resolves Session 2026-11-06 clarification. |
| **Auto-Ticker** | Single top-level 60s ticker hook updating relative strings | High performance, no timer leaks, zero list re-rendering lag. |
| **Recency Ordering** | Default to `recent` when timeframe ≤ 3d unless user overrode | Optimizes freshness discovery while preserving user preference. |
| **URL State** | Native `URLSearchParams` + `history.pushState` / `popstate` | Bookmarkable, zero candidate PII, no router bloat. |
