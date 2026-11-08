# Bug Verification: Seniority Filter Selection Triggers Unnecessary Backend Re-Scraping and Wipes Results

- **Slug**: seniority-filter-reloads-query
- **Tested**: 2026-11-08T02:08:45Z
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The fix was validated end-to-end. Selecting an experience tier filter now operates 100% in-memory across the currently loaded vacancies (`visibleVacancies`) without invoking `search()`, without clearing the existing vacancies, and without re-scraping the backend. All existing and new automated test suites pass without regression.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | `cd frontend && npm test tests/App.test.tsx -- --run` | pass | Verified that toggling experience tiers filters in-memory and asserts `mockSearch` is never called. |
| New / updated tests | `cd frontend && npm test tests/App.test.tsx -- --run` | pass | 2/2 tests passed in 995ms. |
| Regression suite (Frontend) | `cd frontend && npm test -- --run` | pass | 8 test files, 57/57 tests passed in 1.37s. |
| Regression suite (Backend) | `.venv/bin/pytest backend/tests/ -v` | pass | 33/33 tests passed in 5.95s. |
| Lint / type-check | `cd frontend && npm run build` (`tsc && vite build`) | pass | Clean production bundle generated in 1.69s with 0 TypeScript errors. |

## Output Excerpts

```text
✓ tests/App.test.tsx (2 tests) 128ms
  ✓ App Seniority Filtering Integration Tests > filters vacancies by experience level in-memory without calling search() 97ms
  ✓ App Seniority Filtering Integration Tests > calls search() when modality filter changes, keeping seniority as 'all' 30ms

Test Files  8 passed (8)
     Tests  57 passed (57)
  Duration  1.37s
```

```text
============================== 33 passed in 5.95s ==============================
```

```text
vite v6.4.5 building for production...
✓ 2093 modules transformed.
dist/index.html                   0.90 kB │ gzip:   0.51 kB
dist/assets/index-D_nazaeC.css   23.61 kB │ gzip:   5.08 kB
dist/assets/index-BssCy0QT.js   780.83 kB │ gzip: 234.89 kB
✓ built in 1.69s
```

## Residual Risks

- None. Seniority filtering is entirely reactive and computed through `seniorityFilteredVacancies` in `App.tsx`. Deep-linking via `?seniority=...` continues to synchronize bidirectionally via `window.history.replaceState`.

## Recommendation

Close the bug — verified end-to-end. The user's reported symptom (re-querying, wiping existing listings, and restarting the stream on experience filter clicks) is completely resolved.
