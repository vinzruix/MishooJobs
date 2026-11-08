# Bug Verification: Vacancy Card Header Badge Overflow & Awkward Wrapping

- **Slug**: vacancy-card-badge-overflow
- **Tested**: 2026-11-08T02:18:00Z
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The fix was verified end-to-end. Card header badges now fit cleanly on a single row without awkward wrapping or multi-line breaks. Shortened badge strings (`[ 0 EXP ]`, `[ ✓ 0 EXP ]`, `[ REQ. DISCREPANTES ]`), the streamlined single-line Fit Score pill (`{fitScore}% Match`), and tightened padding prevent tag collisions. All unit and regression suites pass with zero regressions.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | `cd frontend && npm test tests/components/VacancyCard.test.tsx -- --run` | pass | Verified that card renders compact badges without line breaks. |
| New / updated tests | `cd frontend && npm test tests/components/VacancyCard.test.tsx -- --run` | pass | 8/8 tests passed in 964ms. |
| Regression suite (Frontend) | `cd frontend && npm test -- --run` | pass | 8 test files, 57/57 tests passed in 1.81s. |
| Regression suite (Backend) | `.venv/bin/pytest backend/tests/ -v` | pass | 33/33 tests passed in 5.71s. |
| Lint / type-check | `cd frontend && npm run build` (`tsc && vite build`) | pass | Clean production bundle built in 1.99s with 0 TypeScript errors. |

## Output Excerpts

```text
✓ tests/components/VacancyCard.test.tsx (8 tests) 53ms
  ✓ Frontend Component Tests > renders VacancyCard correctly with MXN salary and direct links 31ms
  ✓ Frontend Component Tests > renders only one platform button on the card even if vacancy has multiple merged links 3ms
  ✓ Frontend Component Tests > renders ScamBadge with critical risk warning 1ms
  ✓ Frontend Component Tests > renders FitScoreBadge with color tier 1ms
  ✓ Frontend Component Tests > renders 'Nueva' badge and relative time for fresh vacancy (<= 48h) 3ms
  ✓ Frontend Component Tests > does not render 'Nueva' badge for older vacancy (> 48h) or null date 5ms
  ✓ Frontend Component Tests > renders amber discrepancy warning tag [ REQUISITOS DISCREPANTES ] when has_discrepancy is true 5ms
  ✓ Frontend Component Tests > renders emerald primer empleo real badge with verified indicator 3ms

Test Files  8 passed (8)
     Tests  57 passed (57)
  Duration  1.81s
```

```text
vite v6.4.5 building for production...
✓ 2093 modules transformed.
dist/index.html                   0.90 kB │ gzip:   0.52 kB
dist/assets/index-D_nazaeC.css   23.61 kB │ gzip:   5.08 kB
dist/assets/index-BEPWDW46.js   781.01 kB │ gzip: 234.96 kB
✓ built in 1.99s
```

```text
============================== 33 passed in 5.71s ==============================
```

## Residual Risks

- None. On ultra-narrow viewports (<320px), the `items-start` layout ensures that any necessary line-wrap breaks naturally without distorting the top-right alignment of the Fit Score pill.

## Recommendation

Close the bug — verified end-to-end. The visual overflow and awkward wrapping on vacancy cards have been completely eliminated.
