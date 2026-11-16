# Bug Verification: Filter Toolbar Horizontal Document Overflow at 1024px Viewport

- **Slug**: filter-bar-bug
- **Tested**: 2026-11-15T19:08:45-06:00
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The document-level horizontal overflow at viewports near 1024px has been fully resolved and verified. Removing `lg:overflow-visible` keeps internal toolbar scrolling active via `overflow-x-auto flex-nowrap` across all viewports, and `overflow-x-clip` on `App.tsx` and `body` guarantees that `document.documentElement.scrollWidth === window.innerWidth` (1024px === 1024px) with zero document-level horizontal scrollbar.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | Live browser check at 1024x947 viewport | pass | `scrollWidth === 1024px === innerWidth` (0px document overflow). Zero page horizontal scrollbar. Header, branding, and search input remain perfectly in view. |
| New / updated tests | `npm test -- tests/components/FilterToolbar.test.tsx tests/App.test.tsx --run` | pass | 28 tests passed. Verified `overflow-x-auto flex-nowrap` without `lg:overflow-visible`. |
| Regression suite (frontend) | `npm test -- --run` | pass | 25 test files, 172 tests passed. |
| Regression suite (backend) | `.venv/bin/pytest backend/tests/ -v` | pass | 56 tests passed (100% offline). |

## Output Excerpts

```text
✓ tests/components/FilterToolbar.test.tsx (12 tests) 283ms
✓ tests/App.test.tsx (16 tests) 636ms

Test Files  25 passed (25)
     Tests  172 passed (172)
  Duration  5.30s
```

```text
Browser Measurements (1024x947):
window.innerWidth: 1024px
document.documentElement.scrollWidth: 1024px
document.body.scrollWidth: 1024px
Horizontal Document Overflow: 0px (scrollWidth > innerWidth === false)
```

## Residual Risks

None identified. Filter popovers use React Portals (`createPortal(..., document.body)`), rendering directly into the viewport with fixed coordinates and automatic dismissal on scroll and resize, so they are not affected by `overflow-x-auto`.

## Recommendation

Close the bug — verified end-to-end via automated test suites and live browser measurements.
