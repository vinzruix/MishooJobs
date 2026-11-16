# Bug Fix: Hide Visible Horizontal Scrollbar in FilterToolbar

- **Slug**: filter-bar
- **Fixed**: 2026-11-16T01:15:15Z
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Defined a cross-browser `.no-scrollbar` utility class in `frontend/src/index.css` under `@layer utilities` to suppress the visible 6px gray horizontal scrollbar on the `FilterToolbar` container while preserving smooth horizontal scrolling and touch gestures.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `frontend/src/index.css` | modified | Added `.no-scrollbar` utility with `::-webkit-scrollbar { display: none; }`, `scrollbar-width: none;`, and `-ms-overflow-style: none;` |
| `frontend/src/components/FilterToolbar.tsx` | verified | Verified `.no-scrollbar` presence on overflowing horizontal container (`className="flex items-center gap-2 overflow-x-auto flex-nowrap no-scrollbar py-0.5 text-xs"`) |

## Diff Highlights

```css
@layer utilities {
  /* Hide scrollbar for Chrome, Safari, and Opera */
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  /* Hide scrollbar for IE, Edge, and Firefox */
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}
```

## Tests Added or Updated

- Verified existing unit and integration test suite: 25 test files (172 tests) passing without regressions.

## Local Verification

- Commands run: `npm --prefix frontend test -- --run` → 25 test files passed (172 tests passed in 6.27s).
- Visual verification scheduled via browser subagent under `/speckit-bug-test slug=filter-bar`.

## Deviations from Assessment

None.

## Follow-ups

- Verify in browser at 1024px viewport width via `/speckit-bug-test slug=filter-bar`.
