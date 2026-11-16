# Bug Verification: Filter Toolbar Popover Misplacement & Duplicate Hide Applied Toggle

- **Slug**: filter-popover-duplicate-toggle
- **Tested**: 2026-11-15T18:18:00-06:00
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The filter toolbar popovers and layout issues have been fully resolved and verified. Popovers anchor directly 6px beneath their respective buttons via viewport React Portals without CSS containing-block displacement or clipping, the toolbar fits cleanly across standard viewports (1024px, 1280px, 1440px) without cutting off "Ocultar postuladas", and the duplicate toggle button above "Ordenar por:" in `VacancyList` has been completely eliminated.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | Browser UI test at 1280x800 & 1440x900 viewport | pass | Popover aligns at `x: 624.23px`, `y: 185.00px` (6px gap below button bottom). Toolbar elements fit on one row with 0 horizontal scroll. Duplicate button absent above sort select. |
| New / updated tests | `npm test -- tests/components/FilterToolbar.test.tsx tests/components/VacancyList.test.tsx --run` | pass | 24 tests passed across both components. |
| Regression suite (frontend) | `npm test -- --run` | pass | 25 test files, 172 tests passed. |
| Regression suite (backend) | `.venv/bin/pytest backend/tests/ -v` | pass | 56 tests passed (100% offline, zero live network dependencies). |

## Output Excerpts

```text
✓ tests/components/FilterToolbar.test.tsx (12 tests) 160ms
✓ tests/components/VacancyList.test.tsx (12 tests) 141ms
✓ tests/App.test.tsx (16 tests) 447ms

Test Files  25 passed (25)
     Tests  172 passed (172)
  Duration  2.74s
```

```text
======================== 56 passed, 1 warning in 8.42s =========================
```

## Residual Risks

None identified. Popover positioning uses `createPortal` with dynamic screen bounding rect calculations, clamping, and automatic dismissal on scroll and resize, preserving accessibility and keyboard navigation.

## Recommendation

Close the bug — verified end-to-end with automated test suites and live browser verification.
