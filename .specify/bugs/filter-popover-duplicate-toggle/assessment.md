# Bug Assessment: Filter Toolbar Popover Misplacement & Duplicate Hide Applied Toggle

- **Slug**: filter-popover-duplicate-toggle
- **Created**: 2026-11-15T18:00:00-06:00
- **Source**: pasted text & user screenshots
- **Verdict**: valid
- **Severity**: medium

## Report (verbatim or summarized)

The user reported three related UI bugs after Feature 008 rollout:
1. **Popover position too far**: "theres a visual bug when i click in the filter like date. The filtesrs is too FAR." (Observed in screenshot `media_1794787106710_cc197d05.png`, where clicking "Fecha: Cualquier fecha" renders the dropdown floating ~150px down and right, over the vacancy detail pane instead of directly anchored beneath the trigger button).
2. **Hide applied state anomaly**: "Second theres a big with oucltado posutladas" (Observed in screenshot `media_1794787153726_6d307513.png` showing active green badge "Ocultando postuladas 0" when 0 applied vacancies exist).
3. **Duplicate toggle button**: "third ocultando posutlatadas is TWICE DELETE THE ONE ABOVE THE ORDER BY" (The "Ocultar postuladas" toggle appears both in `FilterToolbar.tsx` and directly above the "Ordenar por:" sorting dropdown in `VacancyList.tsx`).

## Symptom

1. Clicking any dropdown filter in `FilterToolbar` (`Fecha`, `Modalidad`, `Ubicación`) causes the menu to render detached far below and to the right of the trigger button. Expected: The dropdown popover appears directly underneath the button with 6px margin.
2. The "Ocultar postuladas" toggle appears twice on the search view: once in the horizontal `FilterToolbar` and a second time inside `VacancyList` above the sorting dropdown. Expected: Exactly one canonical toggle in `FilterToolbar`, with zero duplicate controls in `VacancyList`.
3. When `hiddenAppliedCount` is 0, the toggle can remain styled as active emerald ("Ocultando postuladas 0"). Expected: Active styling and "Ocultando" state should only apply when `hideApplied` is true AND `hiddenAppliedCount > 0` (or neutral when 0).

## Reproduction

1. Open `http://localhost:5173/`.
2. Click on "Fecha: Cualquier fecha" in `FilterToolbar`.
3. Notice that the popover menu opens detached ~150px below the button, floating over the vacancy title in the detail pane.
4. Search for a query and observe the vacancy feed.
5. Notice that "Ocultando postuladas" appears both in the top horizontal `FilterToolbar` and directly above the "Ordenar por:" select dropdown in `VacancyList`.

## Suspected Code Paths

- `frontend/src/components/FilterToolbar.tsx:50-70` — `togglePopover` calculates viewport coordinates (`rect.bottom + 6`, `rect.left`) and applies `fixed` positioning, but its ancestor has `backdrop-blur-md`, which creates a CSS containing block and doubles the coordinate offset.
- `frontend/src/components/FilterToolbar.tsx:180-320` — Popovers for Date, Modality, and Location use `fixed` with manual coordinates instead of relative parent positioning.
- `frontend/src/components/VacancyList.tsx:189-223` — Obsolete duplicate `onToggleHideApplied` button container rendered next to vacancy count above the sort dropdown.
- `frontend/src/components/VacancyList.tsx:21` — `onToggleHideApplied?: () => void` prop retained in `VacancyListProps`.
- `frontend/src/App.tsx:540` — `onToggleHideApplied={handleToggleHideApplied}` passed to `VacancyList`.

## Root Cause Hypothesis

1. **Popover Misplacement**: Under the CSS Transforms & Filter Effects specifications, an ancestor with `backdrop-filter` (`backdrop-blur-md` on `FilterToolbar`'s container) acts as the containing block for all descendant elements with `position: fixed`. When setting `top: rect.bottom + 6` (where `rect` is viewport-relative), the browser applies this offset relative to the toolbar itself, displacing the popover downwards by the toolbar's top offset (~140px). Reverting to standard CSS dropdown positioning (`relative` button container with `absolute left-0 top-full mt-1.5`) naturally anchors the popover directly beneath the button.
2. **Duplicate Toggle**: During Feature 008, the "Ocultar postuladas" button was integrated into `FilterToolbar`, but the legacy toggle inside `VacancyList.tsx` (lines 189-223) was not removed, violating the single canonical filter control requirement.

## Proposed Remediation

**Preferred**:
1. In `FilterToolbar.tsx`:
   - Remove `popoverCoords` state and `togglePopover` viewport math.
   - Use standard `onClick={() => setOpenPopover(openPopover === type ? null : type)}`.
   - Restore standard CSS dropdown positioning on all three popovers: `absolute left-0 top-full mt-1.5 z-30 shadow-xl rounded-xl`.
   - Ensure the toolbar container has `overflow-x-auto lg:overflow-visible` and `z-30` so popovers float cleanly over feed items without clipping.
   - In the "Ocultar postuladas" button in `FilterToolbar`, only show active emerald badge and "Ocultando postuladas" when `hideApplied && hiddenAppliedCount > 0`.
2. In `VacancyList.tsx`:
   - Remove the `onToggleHideApplied` button block (lines 189-223) above the sorting dropdown.
   - Remove `onToggleHideApplied` from `VacancyListProps` and parameter list.
   - Keep the passive text indicator (`({hiddenCount} postuladas ocultas)`) when `hideApplied && hiddenCount > 0`.
3. In `App.tsx`:
   - Remove `onToggleHideApplied` prop from `<VacancyList ... />`.
4. Update tests:
   - Update `VacancyList.test.tsx` to assert that no interactive toggle exists above the sort select.
   - Update `FilterToolbar.test.tsx` to verify standard dropdown positioning and active state conditional on count.

**Files likely to change**:
- `frontend/src/components/FilterToolbar.tsx`
- `frontend/src/components/VacancyList.tsx`
- `frontend/src/App.tsx`
- `frontend/tests/components/VacancyList.test.tsx`
- `frontend/tests/components/FilterToolbar.test.tsx`

**Tests to add or update**:
- `frontend/tests/components/VacancyList.test.tsx`: Verify vacancy list renders count and sorting dropdown without duplicate toggle button.
- `frontend/tests/components/FilterToolbar.test.tsx`: Verify popover rendered with `absolute left-0 top-full mt-1.5` classes anchored to trigger.

## Risks & Considerations

- **Low risk**: Pure presentation refactoring. Eliminates duplicate DOM nodes and fixes CSS containing-block misplacement without touching state management or backend contracts.

## Open Questions

- None. The issue is fully reproducible and visually confirmed via user screenshots.
