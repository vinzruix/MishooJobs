# Bug Fix: Filter Toolbar Horizontal Document Overflow at 1024px Viewport

- **Slug**: filter-bar-bug
- **Fixed**: 2026-11-15T19:07:00-06:00
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Removed `lg:overflow-visible` from `FilterToolbar.tsx` to retain internal `overflow-x-auto` scrolling across all viewports without blowing out document width, and added `overflow-x-clip` to `App.tsx` and `body` in `index.css` as defense-in-depth against window-level horizontal scrollbars.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `frontend/src/components/FilterToolbar.tsx` | modified | Removed `lg:overflow-visible` from the inner scroll container; kept `overflow-x-auto flex-nowrap no-scrollbar`. |
| `frontend/src/App.tsx` | modified | Added `max-w-full overflow-x-clip` to outer page container wrapper. |
| `frontend/src/index.css` | modified | Added `overflow-x: clip;` to global `body` layer. |
| `frontend/tests/components/FilterToolbar.test.tsx` | modified | Updated test to assert `overflow-x-auto flex-nowrap` without `lg:overflow-visible`. |

## Diff Highlights

```tsx
// frontend/src/components/FilterToolbar.tsx
<div
  onScroll={handleDismiss}
  className="flex items-center gap-2 overflow-x-auto flex-nowrap no-scrollbar py-0.5 text-xs"
>
```

```tsx
// frontend/src/App.tsx
<div className="min-h-screen max-w-full overflow-x-clip bg-[#F8F9FA] text-slate-800 font-sans flex flex-col ...">
```

```css
/* frontend/src/index.css */
body {
  ...
  overflow-x: clip;
}
```

## Tests Added or Updated

- `frontend/tests/components/FilterToolbar.test.tsx::contains single-row scroll classes (overflow-x-auto flex-nowrap) without lg:overflow-visible blowout` — guarantees internal scrolling without viewport blowouts.

## Local Verification

- `npm --prefix frontend test -- tests/components/FilterToolbar.test.tsx tests/App.test.tsx --run` → 2 passed (28 tests)
- `npm --prefix frontend test -- --run` → 25 passed (172 tests)
- Browser subagent at 1024x947 viewport: verified `document.documentElement.scrollWidth <= window.innerWidth` with zero page-level horizontal scrollbar.

## Deviations from Assessment

None. The remediation directly implemented the proposed fix from `assessment.md`.

## Follow-ups

- Run `/speckit-bug-test slug=filter-bar-bug` for formal verification recording.
