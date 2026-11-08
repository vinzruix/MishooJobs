# Bug Assessment: Seniority Filter Selection Triggers Unnecessary Backend Re-Scraping and Wipes Results

- **Slug**: seniority-filter-reloads-query
- **Created**: 2026-11-08T02:04:00Z
- **Source**: pasted text
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

> After I search java junior and then I click on "primer empleo real" (or any other experience level) it deletes all the query and do the query again adding jobs to it again

## Symptom

When a user searches for a role (e.g. `java junior`) and receives live vacancy results, clicking on any experience tier filter (e.g. `[ Primer Empleo Real (0 Exp) ]` or any other level in `FilterDrawer`) immediately clears all in-memory search results (`setVacancies([])`), shows the "Consultando bolsas..." loading spinner, and dispatches a full backend SSE re-scrape request rather than instantly filtering the existing results in memory.

**Expected Behavior**: Selecting an experience level filter must be instantaneous (<100ms) and client-side across the vacancies already discovered in memory (`visibleVacancies`), preserving existing search results and live counters without re-triggering network queries or clearing the feed.

## Reproduction

1. Open the MishooJobs application at `http://localhost:5173`.
2. Enter `java junior` in the search bar and submit (`Buscar en Vivo` or `Enter`).
3. Wait for vacancies to arrive via the live SSE stream from Computrabajo, Indeed, and OCC.
4. Open the filters drawer (`Filtros`) and click on `Primer Empleo Real` (or any other seniority tier).
5. **Observed**: All existing results vanish from the screen, the searching state spinner reactivates, and a new network stream is dispatched to `GET /api/v1/jobs/stream?query=java+junior&seniority=primer_empleo`, re-scraping the job boards from scratch.

## Suspected Code Paths

- `frontend/src/App.tsx:160-176` (`handleFilterChange`) — `backendFilterChanged` evaluates `newFilters.seniority !== filters.seniority` as `true`, erroneously treating client-side experience tier selection as a backend filter trigger and invoking `search()`.
- `frontend/src/App.tsx:178-200` (`handleFilterReset`) — `backendFilterChanged` includes `filters.seniority !== "all"`, unnecessarily triggering a backend re-search when resetting filters.
- `frontend/src/hooks/useJobStream.ts:19-30` (`search`) — `search()` resets `vacancies` to `[]` and sets `isSearching = true`, which is correct for new search submissions, but jarring when invoked on in-memory filter clicks.
- `frontend/src/App.tsx:149-158` (`handleSearch`) — Passes `filters.seniority` to `search()`. If a user initiates a new search while a seniority filter is active, backend stream limits results to that tier, preventing accurate cross-tier count calculation.

## Root Cause Hypothesis

In `frontend/src/App.tsx`, `handleFilterChange` defines `backendFilterChanged` as:
```typescript
const backendFilterChanged =
  newFilters.location !== filters.location ||
  newFilters.modality !== filters.modality ||
  newFilters.seniority !== filters.seniority;
```
While `seniority` was added as an optional query parameter to the backend stream during Feature 003, the core architectural specification for User Story 2 mandates that experience tier filtering is client-side in memory (`seniorityFilteredVacancies` in `App.tsx:234-237`), operating instantaneously (<100ms) over `visibleVacancies` while computing `tierCounts` across all tiers. Treating `seniority` as a backend filter in `handleFilterChange` and `handleFilterReset` causes every tier toggle to clear in-memory state and trigger a slow, concurrent multi-portal re-scrape.

Confidence: **High**.

## Proposed Remediation

**Preferred**:
1. Remove `newFilters.seniority !== filters.seniority` from `backendFilterChanged` in `handleFilterChange` in `frontend/src/App.tsx`.
2. Remove `filters.seniority !== "all"` from `backendFilterChanged` in `handleFilterReset` in `frontend/src/App.tsx`.
3. In `handleSearch`, ensure the initial backend stream requests all seniorities (`seniority: "all"` or omits the parameter) so that the client receives the complete vacancy pool for the search query and can accurately compute live counters (`tierCounts`) across all 5 tiers while `seniorityFilteredVacancies` applies the user's active client-side filter immediately.
4. Ensure `FilterDrawer.test.tsx` and `useJobStream.test.ts` verify that changing seniority updates filter state without calling the `search` function of `useJobStream`.

**Alternatives**:
- *Debounced backend fetch*: Keep backend re-fetching but debounce it. (Rejected: Violates the <100ms instant client-side filtering mandate of User Story 2 and creates redundant network load on external job boards).

**Files likely to change**:
- `frontend/src/App.tsx`
- `frontend/tests/components/FilterDrawer.test.tsx`

**Tests to add or update**:
- Test in `frontend/tests/components/FilterDrawer.test.tsx` or an `App` integration test verifying that toggling a seniority tier in `FilterDrawer` does not trigger a new stream search or clear current vacancies.
- Test in `frontend/tests/components/VacancyList.test.tsx` verifying that quick filter pill selection filters displayed items in memory with zero re-search side effects.

## Risks & Considerations

- **URL Synchronization**: Ensure that `useEffect` updating `?seniority=...` in `window.location` continues to work cleanly with `window.history.replaceState` without triggering popstate loops.
- **Deep-linking**: When a user arrives with `?seniority=primer_empleo` in the URL, initial search should fetch the broad pool while the client view shows only `primer_empleo`, allowing the user to click "Todos" or another tier without needing a re-scrape.

## Open Questions

- None. The client-side filtering logic (`seniorityFilteredVacancies` and `tierCounts`) is already fully implemented in `App.tsx`; removing the erroneous `backendFilterChanged` condition aligns the implementation with the design specification.
