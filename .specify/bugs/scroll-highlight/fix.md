# Bug Fix: Unreadable Dark Text Selection and Page Scroll Freeze on Vacancy Click

- **Slug**: scroll-highlight
- **Fixed**: 2026-11-15T15:42:30-06:00
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Eliminated dark text selection conflicts by purging legacy dark HTML attributes (`class="dark"` and `selection:bg-zinc-800` on body) and enforcing global light color-scheme and accessible `::selection` styles. Resolved desktop page scroll freezing and detail pane scroll clipping by gating Vaul's mobile drawer strictly to mobile viewports (< 1024px) and adding `flex-1 min-h-0` to the scrollable content container in `VacancyDetailPane`.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `frontend/index.html` | modified | Removed `class="dark"` from `<html>` and updated `<body>` from `bg-zinc-950` to `bg-[#F8F9FA] text-slate-800 font-sans selection:bg-slate-200 selection:text-slate-900`. |
| `frontend/src/index.css` | modified | Added `:root { color-scheme: light; }` and global `::selection { background-color: #e2e8f0; color: #0f172a; }` in `@layer base`. |
| `frontend/src/App.tsx` | modified | Added `isMobileViewport` tracking; guarded `isMobileDrawerOpen` and `<Drawer.Root open={...}>` to only engage on mobile screens (< 1024px), preventing Vaul's body scroll-lock on desktop. |
| `frontend/src/components/VacancyDetailPane.tsx` | modified | Added `flex-1 min-h-0` to the scrollable container and `flex-shrink-0` to the sticky bottom action bar to enable smooth internal vertical scrolling. |
| `frontend/tests/components/VacancyDetailPane.test.tsx` | modified | Added test verifying `flex-1 min-h-0 overflow-y-auto` classes on the scroll container. |
| `frontend/tests/App.test.tsx` | modified | Added test verifying selecting vacancies on desktop does not open mobile drawer or lock body scroll. |

## Diff Highlights

```html
<!-- frontend/index.html -->
-<html lang="es" class="dark">
+<html lang="es">
...
-<body class="bg-zinc-950 text-zinc-100 font-mono antialiased min-h-screen selection:bg-zinc-800 selection:text-emerald-400">
+<body class="bg-[#F8F9FA] text-slate-800 font-sans antialiased min-h-screen selection:bg-slate-200 selection:text-slate-900">
```

```css
/* frontend/src/index.css */
 @layer base {
   :root {
+    color-scheme: light;
     --color-canvas: #f8f9fa;
     --color-card: #ffffff;
     --color-border: #e2e8f0;
   }
+  ::selection {
+    background-color: #e2e8f0;
+    color: #0f172a;
+  }
```

```tsx
/* frontend/src/App.tsx */
-<Drawer.Root open={isMobileDrawerOpen && !!selectedVacancy} onOpenChange={setIsMobileDrawerOpen}>
+<Drawer.Root
+  open={isMobileViewport && isMobileDrawerOpen && !!selectedVacancy}
+  onOpenChange={(open) => {
+    if (!isMobileViewport) {
+      setIsMobileDrawerOpen(false);
+      return;
+    }
+    setIsMobileDrawerOpen(open);
+  }}
+>
```

```tsx
/* frontend/src/components/VacancyDetailPane.tsx */
-      <div className="p-6 overflow-y-auto space-y-5">
+      <div className="p-6 overflow-y-auto space-y-5 flex-1 min-h-0">
```

## Tests Added or Updated

- `frontend/tests/components/VacancyDetailPane.test.tsx`: `renders a constrained scrollable container with flex-1 min-h-0 overflow-y-auto for desktop scrolling` pins down the flex shrink constraint.
- `frontend/tests/App.test.tsx`: `does not open mobile drawer or lock body scroll when selecting vacancies on desktop` pins down that card selection on desktop does not mount open mobile drawer or set `document.body.style.overflow = "hidden"`.

## Local Verification

- `npm --prefix frontend test -- --run` → 22 test files, 161 tests passed.
- `.venv/bin/pytest backend/tests/` → 56 tests passed.

## Deviations from Assessment

None. The preferred remediation was applied verbatim.

## Follow-ups

- Run `/speckit-bug-test slug=scroll-highlight` to record the verification report.
