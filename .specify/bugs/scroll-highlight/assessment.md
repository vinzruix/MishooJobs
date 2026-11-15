# Bug Assessment: Unreadable Dark Text Selection and Page Scroll Freeze on Vacancy Click

- **Slug**: scroll-highlight
- **Created**: 2026-11-15T15:38:00-06:00
- **Source**: pasted text
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

> "when I select the text the page highlights it in a dark color and the font is dark so i cannot see the word. Also the scroll when i click a vacancy does not work neither description or vacancies slug=scroll-highlight"

## Symptom

Following the migration to the light theme (`#F8F9FA` canvas with `text-slate-800`/`900` typography) and the master-detail split layout, two severe usability regressions occur:

1. **Unreadable Text Selection (Dark on Dark)**: When a user selects text on the page, the selection highlight background is dark (`#27272a` / `zinc-800` inherited from legacy root markup and dark `color-scheme`), while the typography is dark slate (`text-slate-800` / `text-slate-900`). Consequently, highlighted words become nearly impossible to read.
2. **Scroll Freeze on Vacancy Click**: When a user clicks on any vacancy card in the master list on desktop, both the vacancies list and the vacancy description pane become completely unscrollable. Page scrolling freezes entirely.

## Reproduction

### Issue 1: Text Selection Highlight
1. Open MishooJobs at `http://localhost:5174/` (or `http://localhost:5173/`).
2. Use the cursor to highlight/select any text on the page (job titles, company names, description text, or headers).
3. **Observed**: The text highlight renders with a dark background (`bg-zinc-800`) while the typography is dark slate (`text-slate-800`/`900`), obscuring the words.
4. **Expected**: Text selection should have a light, high-contrast, accessible highlight (e.g., `bg-slate-200` with `text-slate-900`).

### Issue 2: Scroll Freeze on Vacancy Click
1. Open MishooJobs on a desktop viewport (width ≥ 1024px) with multiple vacancies loaded.
2. Click on any vacancy card in the left master list.
3. Attempt to scroll vertically using the mouse wheel, trackpad, or scrollbar (either over the vacancies list, the window, or the detail pane description).
4. **Observed**: The entire page is locked and cannot be scrolled. Neither the vacancies feed nor the detail pane scrolls.
5. **Expected**: On desktop, clicking a vacancy card should select it and display its details in the sticky right pane without opening or triggering the mobile drawer. The page and the vacancy list must remain scrollable, and the detail pane must smoothly scroll its internal description content within its sticky container.

## Suspected Code Paths

- `frontend/index.html`: Lines 2 & 12 — `<html class="dark">` forces dark `color-scheme` in WebKit/Blink, and `<body class="bg-zinc-950 text-zinc-100 font-mono antialiased min-h-screen selection:bg-zinc-800 selection:text-emerald-400">` sets dark selection background on the root document.
- `frontend/src/index.css`: Missing global `:root { color-scheme: light; }` and `::selection` definitions in `@layer base`.
- `frontend/src/App.tsx`: Lines 513-516 & 625-634 — `onInspect` unconditionally invokes `setIsMobileDrawerOpen(true)` on every card click regardless of viewport width. Vaul's `<Drawer.Root>` mounts a modal scroll-lock on `document.body` even when drawer content is hidden on desktop via `lg:hidden`.
- `frontend/src/components/VacancyCard.tsx`: Lines 74-79 — `handleClick` always calls `onInspect(vacancy)` which routes to mobile drawer activation.
- `frontend/src/components/VacancyDetailPane.tsx`: Lines 198-202 — Outer pane has `overflow-hidden max-h-[calc(100vh-6rem)] flex flex-col`, but inner scroll container `<div className="p-6 overflow-y-auto space-y-5">` lacks `flex-1 min-h-0`. Due to CSS flexbox `min-height: auto` default, the inner container does not constrain its height or create a functional independent scroll context.

## Root Cause Hypothesis

1. **Highlight Defect**: During the visual redesign to light theme `#F8F9FA`, `index.html` was not updated and retained `<html class="dark">` and `selection:bg-zinc-800 selection:text-emerald-400` on `<body>`. When child elements specify dark slate font colors (`text-slate-900`), WebKit/Blink inherits the dark selection background from `body` while retaining the child's text color, producing low-contrast dark-on-dark text selection.
2. **Scroll Lock Defect**: `App.tsx` wires `VacancyList`'s `onInspect` directly to `setIsMobileDrawerOpen(true)`. In `VacancyCard.tsx`, clicking the card invokes both `onSelect` and `onInspect`. On desktop (`lg:col-span-5` / `lg:col-span-7`), this inadvertently opens the Vaul `<Drawer.Root>`. Vaul is a modal sheet component that automatically injects a global body scroll-lock (`overflow: hidden; pointer-events: none`). Even though Tailwind hides the drawer visually with `lg:hidden`, Vaul's body scroll-lock remains active, completely freezing the window and vacancies feed scroll. Additionally, `VacancyDetailPane`'s scrollable container lacks `flex-1 min-h-0`, preventing independent internal flex scrolling.

Confidence: High.

## Proposed Remediation

**Preferred**:
1. **Fix Text Selection & HTML Root (`index.html` & `index.css`)**:
   - In `frontend/index.html`: Remove `class="dark"` from `<html>` (`<html lang="es">`).
   - In `frontend/index.html`: Update `<body>` classes from `bg-zinc-950 text-zinc-100 font-mono ... selection:bg-zinc-800 selection:text-emerald-400` to `bg-[#F8F9FA] text-slate-800 font-sans antialiased min-h-screen selection:bg-slate-200 selection:text-slate-900`.
   - In `frontend/src/index.css`: Add in `@layer base`:
     ```css
     :root {
       color-scheme: light;
     }
     ::selection {
       background-color: #e2e8f0; /* slate-200 */
       color: #0f172a; /* slate-900 */
     }
     ```
2. **Fix Desktop Scroll & Mobile Drawer Activation (`App.tsx` & `VacancyCard.tsx`)**:
   - In `App.tsx`: Only set `isMobileDrawerOpen(true)` when viewport is mobile (e.g. `window.innerWidth < 1024` or using an `isMobile` check / media query listener).
   - Ensure `<Drawer.Root>` is conditionally rendered or only opens on mobile viewports so Vaul never applies `overflow: hidden` to `document.body` on desktop.
   - Guard against unmounted/orphaned scroll-locks when viewport changes.
3. **Fix Detail Pane Internal Scroll (`VacancyDetailPane.tsx`)**:
   - In `VacancyDetailPane.tsx`: Update the scrollable content container from `className="p-6 overflow-y-auto space-y-5"` to `className="p-6 overflow-y-auto space-y-5 flex-1 min-h-0"` so it shrinks properly inside the sticky `max-h-[calc(100vh-6rem)] flex flex-col` container and enables smooth internal vertical scrolling.

**Alternatives**:
- *Disable modal on Vaul `<Drawer.Root modal={false}>`*: Would prevent body scroll locking, but might allow touch scrolling behind the drawer on mobile devices. (Better: gate `isMobileDrawerOpen` strictly to mobile viewport `window.innerWidth < 1024`).

**Files likely to change**:
- `frontend/index.html`
- `frontend/src/index.css`
- `frontend/src/App.tsx`
- `frontend/src/components/VacancyDetailPane.tsx`
- `frontend/src/components/VacancyCard.tsx`

**Tests to add or update**:
- Add unit test in `App.test.tsx` verifying that selecting a vacancy on desktop (viewport width >= 1024px) updates `selectedVacancy` without setting mobile drawer open state or locking document body scroll.
- Add test in `VacancyDetailPane.test.tsx` verifying `flex-1 min-h-0 overflow-y-auto` classes on the scrollable container.
- Verify full test suite passing (`npm test -- --run`).

## Risks & Considerations

- **Responsive Resize**: If a user resizes the browser window across the 1024px breakpoint while a card is selected, ensure the drawer state transitions cleanly without leaving body scroll locked.
- **Print Layout**: Ensure removing `class="dark"` from `<html>` and updating `body` preserves clean print styles (`print:bg-white print:text-black`).

## Open Questions

- None. Both symptoms are clearly reproducible and root causes are isolated.
