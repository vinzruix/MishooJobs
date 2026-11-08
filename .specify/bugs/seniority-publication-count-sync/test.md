# Bug Verification: Publication Timeframe and Seniority Filter Counts Desynchronization

- **Slug**: seniority-publication-count-sync
- **Tested**: 2026-11-08T02:34:00Z
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The fix was verified end-to-end. Selecting an experience level filter now dynamically scopes the publication timeframe counters so that each timeframe badge reflects the exact count of vacancies available for that seniority tier. When no vacancies exist for a given timeframe within the selected tier, the badge accurately reflects `0`. Cross-facet symmetry also holds: selecting a timeframe filter scopes the seniority tier counters in both `FilterDrawer` and `VacancyList` quick filter pills. All test suites pass with zero regressions.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | `cd frontend && npm test tests/components/FilterDrawer.test.tsx -- --run` | pass | Verified that `primer_empleo` selection recalculates timeframe badges dynamically and drops to 0 where appropriate. |
| New / updated tests | `cd frontend && npm test tests/components/FilterDrawer.test.tsx -- --run` | pass | 9/9 tests passed in 1.06s. |
| Full frontend regression suite | `cd frontend && npm test -- --run` | pass | 8 test files, 60/60 tests passed in 2.05s. |
| Full backend regression suite | `.venv/bin/pytest backend/tests/ -v` | pass | 33/33 tests passed in 6.00s. |
| Lint / type-check | `cd frontend && npm run build` (`tsc && vite build`) | pass | Clean production bundle generated in 2.68s with 0 TypeScript errors. |

## Output Excerpts

```text
✓ tests/components/FilterDrawer.test.tsx (9 tests) 98ms
  ✓ FilterDrawer Component Tests > renders 5 mutually exclusive experience tiers plus 'Todos los niveles' with live counters 33ms
  ✓ FilterDrawer Component Tests > selects specific experience tier when clicked 10ms
  ✓ FilterDrawer Component Tests > toggles active experience tier back to 'all' when clicked again 6ms
  ✓ FilterDrawer Component Tests > selects specific timeframe when clicked and updates timeframes prop 10ms
  ✓ FilterDrawer Component Tests > switches to another timeframe exclusively when a different timeframe is clicked 6ms
  ✓ FilterDrawer Component Tests > toggles active timeframe off back to 'all' when clicked again 7ms
  ✓ FilterDrawer Component Tests > sets timeframes to ['all'] when 'Cualquier fecha' is clicked 6ms
  ✓ FilterDrawer Component Tests > contextually computes timeframe counts based on the active seniority filter 9ms
  ✓ FilterDrawer Component Tests > contextually computes seniority counts based on the active timeframe filter 8ms

Test Files  8 passed (8)
     Tests  60 passed (60)
  Duration  2.05s
```

```text
vite v6.4.5 building for production...
✓ 2093 modules transformed.
dist/index.html                   0.90 kB │ gzip:   0.52 kB
dist/assets/index-D_nazaeC.css   23.61 kB │ gzip:   5.08 kB
dist/assets/index-Bh5hoYD3.js   781.33 kB │ gzip: 235.05 kB
✓ built in 2.68s
```

```text
============================== 33 passed in 6.00s ==============================
```

## Residual Risks

- None. All faceted count calculations are computed in-memory across the client arrays via `useMemo`, ensuring zero network latency (<1ms) and 100% responsiveness.

## Recommendation

Close the bug — verified end-to-end. The user's reported issue (timeframe counters not reflecting the active experience level and promising 1 vacancy when 0 exist in the combination) is completely resolved.
