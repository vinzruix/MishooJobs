# Bug Assessment: Publication Timeframe and Seniority Filter Counts Desynchronization

- **Slug**: seniority-publication-count-sync
- **Created**: 2026-11-08T02:30:00Z
- **Source**: pasted text & user-uploaded screenshot (`media_1794104885994_a40e9672.png`)
- **Verdict**: valid
- **Severity**: medium

## Report (verbatim or summarized)

> When I click on a filter of experience level in the publication does not change how many are, i want to if i click on a level experience the number in each publication changes based on how many vacancies are. In this image it says that there are 10 first real jobs, and the date filter says that theres one, but when i mix them I shows nothing.
> Attached screenshot shows `Primer Empleo Real (0 Exp)` indicating 10 vacancies and `Última hora` indicating 1 vacancy out of 45 total. When both filters are active simultaneously, 0 results are rendered because the publication counter was computed over the global pool (45) rather than the active seniority subset (10).

## Symptom

When a user selects an experience level filter (e.g., `Primer Empleo Real`), the publication timeframe counters in `FilterDrawer` remain static, reflecting the global vacancy count rather than the vacancies available within the selected seniority level. As a result, users see positive counter badges on timeframes (e.g., `Última hora 1`) that actually contain 0 vacancies for the selected seniority, leading to an empty feed when combined.

**Expected Behavior**: Faceted filter counters must be dynamically contextualized: selecting an experience level should update publication timeframe badges to show the exact count of vacancies available for that seniority. Conversely, selecting a publication timeframe should update seniority badges to reflect counts within that timeframe.

## Reproduction

1. Open MishooJobs at `http://localhost:5173`.
2. Search for any term that returns diverse listings (e.g., `Python` or `Junior`).
3. Open `Filtros` (`FilterDrawer`).
4. Select `Primer Empleo Real (0 Exp)` (e.g., displaying `10`).
5. Observe the `Publicación` timeframe badges: `Última hora` displays `1` (which belongs to a different seniority tier).
6. Click `Última hora`.
7. **Observed**: The feed renders 0 vacancies ("No se encontraron vacantes para el nivel seleccionado en esta búsqueda") despite the filter pill advertising `1`.

## Suspected Code Paths

- `frontend/src/components/FilterDrawer.tsx:73-77` (`getSeniorityCount`) — Counts vacancies matching each seniority tier across the unfiltered `vacancies` prop without considering active `filters.timeframes`.
- `frontend/src/components/FilterDrawer.tsx:93-96` (`getCount`) — Calls `calculateTimeframeCount(vacancies, tf, now)` across the unfiltered `vacancies` prop without filtering by active `filters.seniority`.
- `frontend/src/App.tsx:216-231` (`tierCounts`) — Computes `tierCounts` strictly across `visibleVacancies` without filtering by active `filters.timeframes` when passed to `VacancyList` quick filter pills.

## Root Cause Hypothesis

In `FilterDrawer.tsx`, both `getSeniorityCount` and `getCount` operate directly on the raw, unfiltered `vacancies` array passed down from `App.tsx`:
```typescript
const getSeniorityCount = (tierId: SeniorityFilter): number => {
  if (!vacancies) return 0;
  if (tierId === "all") return vacancies.length;
  return vacancies.filter((v) => v.seniority_level === tierId).length;
};

const getCount = (tf: TimeframeConfig) => {
  if (!vacancies) return null;
  return calculateTimeframeCount(vacancies, tf, now);
};
```
Because neither calculation scopes its input to the other active facet, the counts represent global totals rather than intersectional faceted counts. When a candidate selects `Primer Empleo Real` (10 vacancies) and `Última hora` (1 vacancy belonging to `junior`), the counters indicate positive availability in both facets, even though their intersection is empty.

Confidence: **High**.

## Proposed Remediation

**Preferred**:
1. **Contextual Timeframe Counts in `FilterDrawer.tsx`**:
   - Compute `seniorityFilteredVacancies = useMemo(() => filters.seniority === "all" ? vacancies : vacancies.filter(v => v.seniority_level === filters.seniority), [vacancies, filters.seniority])`.
   - Update `getCount(tf)` to execute `calculateTimeframeCount(seniorityFilteredVacancies, tf, now)`.
2. **Contextual Seniority Counts in `FilterDrawer.tsx`**:
   - Compute `timeframeFilteredVacancies = useMemo(() => filters.timeframes.includes("all") ? vacancies : filterVacanciesByTimeframes(vacancies, filters.timeframes, now), [vacancies, filters.timeframes, now])`.
   - Update `getSeniorityCount(tierId)` to count occurrences in `timeframeFilteredVacancies`.
3. **Contextual Quick Pill Counts in `App.tsx`**:
   - Update `tierCounts` memo to use `filterVacanciesByTimeframes(visibleVacancies, filters.timeframes, currentNow)` as the counting base when timeframes are active (`!filters.timeframes.includes("all")`).
4. **Automated Verification Tests**:
   - Add unit tests in `FilterDrawer.test.tsx` verifying that:
     - Selecting `primer_empleo` updates `getCount` values to only reflect `primer_empleo` vacancies.
     - Selecting a timeframe updates `getSeniorityCount` values to only reflect vacancies within that timeframe.

**Alternatives**:
- *Disable empty filter combinations*: Show a disabled or greyed-out button when count is 0. (Can be paired with count updates for additional clarity).

**Files likely to change**:
- `frontend/src/components/FilterDrawer.tsx`
- `frontend/src/App.tsx`
- `frontend/tests/components/FilterDrawer.test.tsx`
- `frontend/tests/App.test.tsx`

**Tests to add or update**:
- Test in `FilterDrawer.test.tsx`: "updates timeframe counts dynamically when seniority filter is active".
- Test in `FilterDrawer.test.tsx`: "updates seniority counts dynamically when timeframe filter is active".
- Test in `App.test.tsx`: "updates quick filter pill seniority counts when timeframe filter is active".

## Risks & Considerations

- **Performance**: Filter operations run entirely in-memory over client arrays (typically 30–150 items) using `useMemo`, with latency <1ms.
- **Edge cases**: When resetting filters (`handleFilterReset` or clicking "Todos los niveles" / "Cualquier fecha"), counts instantly return to global totals.

## Open Questions

- None. The issue and mathematical relationship of faceted navigation is well-defined.
