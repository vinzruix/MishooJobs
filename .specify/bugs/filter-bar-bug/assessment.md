# Bug Assessment: Filter Toolbar Horizontal Document Overflow at 1024px Viewport

- **Slug**: filter-bar-bug
- **Created**: 2026-11-15T19:04:00-06:00
- **Source**: pasted text & user screenshot (`media_1794790901390_408b3275.png`)
- **Verdict**: valid
- **Severity**: medium

## Report (verbatim or summarized)

The user reported:
> "okay when the page is of this size the filter options loses his consistensy and does the page more bigger than the window. slug=filter-bar-bug"

Attached image `media_1794790901390_408b3275.png` displays an active browser window sized at 1024x947. In the screenshot, the entire page has overflowed horizontally, spawning a window-level scrollbar at the bottom. The user has scrolled the window to the right, causing the "MishooJobs" header, the search bar input ("n Junior"), and the left side of the seniority segmented control ("Todos 0") to slide off-screen to the left, breaking UI alignment and visual consistency.

## Symptom

When viewing the application at viewports near 1024px (e.g. 1024x947 in tablet landscape, small laptops, or split-screen windows):
- `window.innerWidth` is 1024px, but `document.documentElement.scrollWidth` and `document.body.scrollWidth` expand to 1280px (an uncontained document overflow of 256px).
- A page-level horizontal scrollbar appears on the browser window (`html`/`body`).
- Scrolling horizontally shifts the entire page layout, pushing the application header, branding, and search input out of view.

## Reproduction

1. Open `http://localhost:5173/` in a browser.
2. Set viewport dimensions to 1024px width by 947px height (or resize browser window to ~1024px).
3. Observe the bottom of the window: a page-level horizontal scrollbar appears.
4. Run in console: `document.documentElement.scrollWidth > window.innerWidth` → returns `true` (`1280px > 1024px`).
5. Scroll horizontally to the right: observe header and search input sliding off the left edge.

## Suspected Code Paths

- `frontend/src/components/FilterToolbar.tsx:170` — `<div onScroll={handleDismiss} className="flex items-center gap-2 overflow-x-auto lg:overflow-visible flex-nowrap no-scrollbar py-0.5 text-xs">` applies `lg:overflow-visible`.
- `frontend/src/App.tsx:458` — Outer root wrapper `<div className="min-h-screen bg-[#F8F9FA] ...">` lacks `overflow-x-clip` / `overflow-x-hidden`.
- `frontend/index.html:12` / `frontend/src/index.css:18` — `body` lacks horizontal overflow clipping.

## Root Cause Hypothesis

Tailwind's `lg` breakpoint triggers at exactly `@media (min-width: 1024px)`. In `FilterToolbar.tsx`, `lg:overflow-visible` was previously introduced to prevent popover clipping. However, all popovers are now mounted via React Portals (`createPortal(..., document.body)`), making `lg:overflow-visible` obsolete.

At `1024px`, `lg:overflow-visible` overrides `overflow-x-auto` to `overflow: visible`. The toolbar's `flex-nowrap` contents (Seniority segmented control ~538px, Fecha ~97px, Modalidad ~122px, Ubicación ~120px, Ocultar postuladas ~151px, Restablecer ~107px, plus gaps and dividers) require **1216px** of intrinsic width. Because available container width at 1024px is only **986px** (accounting for padding), forcing `overflow: visible` causes the toolbar content to spill 230px out of `FilterToolbar`, expanding `<main>` and `document.body` to 1280px (`max-w-7xl`) and spawning a 256px window-level horizontal scrollbar.

## Proposed Remediation

**Preferred**:
1. In `FilterToolbar.tsx`:
   - Remove `lg:overflow-visible` from the toolbar inner scroll container, retaining `overflow-x-auto no-scrollbar` across all screen sizes.
   - Because popovers mount into `document.body` via `createPortal`, they will not be clipped by `overflow-x-auto`.
   - If toolbar contents ever exceed available container width on any viewport (such as 1024px with all filter buttons active), the toolbar will scroll internally without spilling outward or triggering page-level document overflow.
2. In `App.tsx` and `index.css`:
   - Add `overflow-x-clip` (or `overflow-x-hidden`) to the outer page container in `App.tsx` (`min-h-screen max-w-full overflow-x-clip ...`) and `body` in `index.css` as defense-in-depth against unexpected document-level horizontal scrollbars.
3. In `FilterToolbar.test.tsx`:
   - Update tests to verify that `FilterToolbar` retains `overflow-x-auto flex-nowrap` and does NOT contain `lg:overflow-visible`.
   - Verify that all popovers still portal and display without clipping.

**Files likely to change**:
- `frontend/src/components/FilterToolbar.tsx`
- `frontend/src/App.tsx`
- `frontend/src/index.css`
- `frontend/tests/components/FilterToolbar.test.tsx`

**Tests to add or update**:
- `frontend/tests/components/FilterToolbar.test.tsx`: assert container has `overflow-x-auto` and lacks `lg:overflow-visible`.
- `frontend/tests/App.test.tsx`: assert root wrapper enforces `overflow-x-clip` / `max-w-full`.

## Risks & Considerations

- **Low risk**: Popovers already render in `document.body` via `createPortal` with fixed viewport coordinates and automatic dismissal on scroll and resize. Removing `lg:overflow-visible` eliminates root document horizontal blowout without altering popover functionality.

## Open Questions

- None. The issue was reproduced and confirmed via exact measurements in the live browser subagent.
