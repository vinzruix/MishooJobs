# Bug Fix: Seniority Filter Selection Triggers Unnecessary Backend Re-Scraping and Wipes Results

- **Slug**: seniority-filter-reloads-query
- **Fixed**: 2026-11-08T02:07:00Z
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Decoupled experience tier (`seniority`) filtering from `backendFilterChanged` in `frontend/src/App.tsx`. Seniority filter changes are now handled 100% in-memory across `visibleVacancies`, preventing search result wipes, unnecessary loading spinners, and redundant multi-portal re-scraping.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `frontend/src/App.tsx` | modified | Removed `seniority` from `backendFilterChanged` in `handleFilterChange` and `handleFilterReset`; set `seniority: "all"` in `search()` calls to preserve broad vacancy pool for client-side live counts. |
| `frontend/tests/App.test.tsx` | added test | Created integration tests asserting that changing seniority filters in-memory without calling `search()`, while modality changes correctly invoke `search()`. |

## Diff Highlights

```typescript
// frontend/src/App.tsx
  const handleFilterChange = (newFilters: FilterState) => {
    const backendFilterChanged =
      newFilters.location !== filters.location ||
-     newFilters.modality !== filters.modality ||
-     newFilters.seniority !== filters.seniority;
+     newFilters.modality !== filters.modality;

    setFilters(newFilters);

    if (backendFilterChanged) {
      search({
        query: currentQuery,
        location: newFilters.location,
        modality: newFilters.modality,
-       seniority: newFilters.seniority,
+       seniority: "all",
      });
    }
  };
```

## Tests Added or Updated

- `frontend/tests/App.test.tsx::"filters vacancies by experience level in-memory without calling search()"` — Verifies that clicking an experience tier filter (e.g. "Primer Empleo Real") narrows the visible vacancy list in-memory while guaranteeing `mockSearch` is never called.
- `frontend/tests/App.test.tsx::"calls search() when modality filter changes, keeping seniority as 'all'"` — Verifies that genuine backend filters (modality) still invoke `mockSearch` with `seniority: "all"`.

## Local Verification

- Commands run:
  - `cd frontend && npm test -- --run` → 8 test files passed (57/57 tests passed in 1.62s).
  - `.venv/bin/pytest backend/tests/ -v` → 33/33 tests passed in 5.91s.
- Manual checks:
  - Verified with running Vite frontend and FastAPI backend that selecting "Primer Empleo Real" immediately filters the card feed without wiping results or restarting the SSE stream.

## Deviations from Assessment

None. The remediation strictly followed the preferred approach outlined in `assessment.md`.

## Follow-ups

- Run `/speckit-bug-test slug=seniority-filter-reloads-query` to execute the formal verification protocol.
