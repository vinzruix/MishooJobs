# Bug Fix: Publication Timeframe and Seniority Filter Counts Desynchronization

- **Slug**: seniority-publication-count-sync
- **Fixed**: 2026-11-08T02:33:00Z
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Implemented cross-facet contextual count synchronization between the experience level (`seniority`) and publication timeframe (`timeframes`) filters in `FilterDrawer.tsx` and `App.tsx`. Selecting an experience tier now dynamically recalculates the publication timeframe badges to reflect counts within that tier, and selecting a timeframe recalculates the seniority badges and quick filter pills to reflect counts within that timeframe.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `frontend/src/components/FilterDrawer.tsx` | modified | Added `seniorityFilteredVacancies` memo to scope timeframe counts (`getCount`) to active seniority, and `timeframeFilteredVacancies` memo to scope seniority tier counts (`getSeniorityCount`) to active timeframe. |
| `frontend/src/App.tsx` | modified | Updated `tierCounts` memo to use `filterVacanciesByTimeframes(visibleVacancies, filters.timeframes, currentNow)` as the counting base when date timeframe filtering is active. |
| `frontend/tests/components/FilterDrawer.test.tsx` | modified | Added tests verifying that timeframe badges dynamically update when seniority changes and vice versa. |
| `frontend/tests/App.test.tsx` | modified | Added test verifying that quick filter pill counters scope properly to active date filters. |

## Diff Highlights

```typescript
// frontend/src/components/FilterDrawer.tsx
+ // Contextual vacancies for timeframe counts: scoped to active seniority filter
+ const seniorityFilteredVacancies = useMemo(() => {
+   if (!vacancies) return [];
+   if (filters.seniority === "all") return vacancies;
+   return vacancies.filter((v) => v.seniority_level === filters.seniority);
+ }, [vacancies, filters.seniority]);
+
+ const getCount = (tf: TimeframeConfig) => {
+   if (!vacancies) return null;
+   return calculateTimeframeCount(seniorityFilteredVacancies, tf, now);
+ };
```

```typescript
// frontend/src/App.tsx
  const tierCounts = useMemo<SeniorityCounts>(() => {
+   const base =
+     !filters.timeframes.includes("all") && filters.timeframes.length > 0
+       ? filterVacanciesByTimeframes(visibleVacancies, filters.timeframes, currentNow)
+       : visibleVacancies;
+
    const counts: SeniorityCounts = {
-     all: visibleVacancies.length,
+     all: base.length,
...
-   for (const v of visibleVacancies) {
+   for (const v of base) {
```

## Tests Added or Updated

- `frontend/tests/components/FilterDrawer.test.tsx::"contextually computes timeframe counts based on the active seniority filter"` — Asserts that when `primer_empleo` is selected, timeframe badges drop to 0 for timeframes without 0-experience listings.
- `frontend/tests/components/FilterDrawer.test.tsx::"contextually computes seniority counts based on the active timeframe filter"` — Asserts that when `24h` is selected, seniority badges drop to 0 for older tiers.
- `frontend/tests/App.test.tsx::"contextually scopes quick filter pill counters to the active timeframe filter"` — Asserts that quick filter pills in `VacancyList` reflect the active timeframe.

## Local Verification

- Commands run:
  - `cd frontend && npm test -- --run` → 8 test files, 60/60 tests passed in 2.06s.
  - `cd frontend && npm run build` → Production bundle built cleanly with 0 TypeScript errors.
  - `.venv/bin/pytest backend/tests/ -v` → 33/33 tests passed in 6.00s.
- Manual checks:
  - Verified on `http://localhost:5173` that selecting `Primer Empleo Real` immediately updates `Última hora` to `0` when no 0-exp listings were posted in the last hour, preventing 0-result surprises.

## Deviations from Assessment

None. The implementation followed the exact faceted intersection approach outlined in `assessment.md`.

## Follow-ups

- Run `/speckit-bug-test slug=seniority-publication-count-sync` to generate the verification report.
