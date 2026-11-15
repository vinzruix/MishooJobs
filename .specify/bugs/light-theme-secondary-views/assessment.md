# Bug Assessment: Incomplete Light Theme Design System Migration Across Search, Secondary Views, and Modals

- **Slug**: light-theme-secondary-views
- **Created**: 2026-11-15T01:17:00-06:00
- **Source**: pasted text
- **Verdict**: valid
- **Severity**: medium

## Report (verbatim or summarized)

> "The new design missed to change some details. The serach didnt change the last colors the pipeline, mis cvs, and perfil maestro have the last style the filters seem to have the last style too fix it and turn them give the newest stlye"

## Symptom

Following the implementation of Feature `007-modern-jobs-ui` (which introduced a modern light design system featuring a `#F8F9FA` canvas, clean white container cards, slate-900 accents, and pastel semantic metric blocks), several core secondary views, auxiliary modals, and components remain locked into the legacy Midudev dark theme (`bg-zinc-950`, `bg-zinc-900`, `border-zinc-800`, `text-zinc-100` / `text-zinc-400`, bright emerald highlights).

Specifically:
1. **Search Bar (`SearchBar.tsx`)**: Renders with a pitch-black `bg-zinc-900 border-zinc-800` container, dark input fields, and dark shortcut badges (`kbd`), jarringly contrasting against the `#F8F9FA` canvas.
2. **Filters & Query Area (`FilterDrawer.tsx` & `App.tsx`)**: While `FilterDrawer.tsx` received initial light token updates, the deduplication summary badge beneath it (`summary.duplicates_merged`) remains styled with `bg-zinc-900/60 border-zinc-800 text-zinc-400`. Additionally, `FilterDrawer` contains rigid select inputs, unstyled native select dropdowns, and legacy button borders that feel disconnected from the fluid Emil Kowalski / Apple-inspired design standards.
3. **Pipeline View (`PipelineView.tsx`)**: The entire view retains `bg-zinc-900`, `border-zinc-800`, dark status chips (`bg-amber-950/40`, `bg-emerald-950/40`), dark empty state, and dark `<select>` elements.
4. **Resume Library ("Mis CVs") (`ResumeLibraryView.tsx` & related modals)**: The resume library grid, card headers, empty state, and action buttons remain dark `bg-zinc-900/90 border-zinc-800` with `font-mono`. Furthermore, related generation modals (`RoleArchetypeModal.tsx`, `VacancyTailorModal.tsx`, `SyncImprovementsModal.tsx`) and viewer toolbar in `LiveCVViewer.tsx` are dark-themed.
5. **Master Profile Editor ("Perfil Maestro") (`MasterProfileEditor.tsx` & `AvatarUploader.tsx`)**: The full-screen overlay modal opens a pitch-black `bg-zinc-900 border-zinc-800` modal container, dark code gutter `bg-zinc-900/30`, black editor textarea `bg-zinc-950`, and dark avatar uploader card.

## Reproduction

1. Open MishooJobs at `http://localhost:5174/` (or run `npm run dev` in `frontend/`).
2. Inspect the search bar at the top of the job feed: observe `bg-zinc-900` dark container on the `#F8F9FA` light background.
3. Perform a search that merges duplicate listings: observe the deduplication alert badge rendered with `bg-zinc-900/60 border-zinc-800 text-zinc-400`.
4. Click on the **Pipeline** tab in the navigation header: observe the entire screen switching into a pitch-black container with dark cards and controls.
5. Click on the **Mis CVs** tab: observe dark cards, `font-mono` typography, and dark empty/grid states. Click "Crear CV por Rol" to observe the dark `RoleArchetypeModal`.
6. Click **Perfil Maestro** in the navigation header: observe the dark editor modal with dark textarea, gutters, and avatar uploader.

## Suspected Code Paths

- `frontend/src/components/SearchBar.tsx`: Lines 46-92 — Dark container, input fields, shortcut badge, and submit button.
- `frontend/src/App.tsx`: Lines 472-478 — Deduplication badge using `bg-zinc-900/60 border-zinc-800 text-zinc-400`.
- `frontend/src/components/FilterDrawer.tsx`: Lines 120-298 — Visual refinement to align with Apple/Emil Kowalski light aesthetic and modern inputs.
- `frontend/src/components/PipelineView.tsx`: Lines 18-154 — Dark column badges, cards, empty state, and status dropdowns.
- `frontend/src/components/ResumeLibraryView.tsx`: Lines 42-226 — Monospace font, dark cards, dark empty state, and dark action buttons.
- `frontend/src/components/MasterProfileEditor.tsx`: Lines 140-370 — Dark modal overlay, container, editor gutter, textarea, and sidebar.
- `frontend/src/components/AvatarUploader.tsx`: Lines 176-242 — Dark avatar container, buttons, and warning alerts.
- `frontend/src/components/RoleArchetypeModal.tsx`: Lines 110-280 — Dark modal container, inputs, tags, and action buttons.
- `frontend/src/components/VacancyTailorModal.tsx`: Lines 90-245 — Dark modal container, summary card, language selector, and buttons.
- `frontend/src/components/SyncImprovementsModal.tsx`: Lines 80-200 — Dark diff modal container and comparison panes.
- `frontend/src/components/LiveCVViewer.tsx`: Lines 165-275 — Dark viewer toolbar and control buttons.

## Root Cause Hypothesis

During Feature `007-modern-jobs-ui`, implementation was strictly scoped to the primary job search flow: the master-detail split layout (`App.tsx`), `Header.tsx`, `VacancyList.tsx`, `VacancyCard.tsx`, and `VacancyDetailPane.tsx`. Secondary views (`PipelineView.tsx`, `ResumeLibraryView.tsx`), auxiliary modals (`MasterProfileEditor.tsx`, `RoleArchetypeModal.tsx`, `VacancyTailorModal.tsx`, `SyncImprovementsModal.tsx`), and top controls (`SearchBar.tsx`, deduplication summary banner) were omitted from that pass and therefore retained their legacy Midudev dark mode tokens (`bg-zinc-950`, `bg-zinc-900`, `border-zinc-800`, `text-zinc-100`). With the global canvas set to `#F8F9FA`, these un-migrated components cause high-contrast visual fragmentation.

Confidence: High.

## Proposed Remediation

**Preferred**:
Execute a cohesive design token migration across all secondary views, modals, and auxiliary components following the Emil Kowalski / Apple-inspired light design system established in `007-modern-jobs-ui`:
1. **`SearchBar.tsx`**:
   - Modernize into a clean, floating light search card: `bg-white border border-slate-200/80 shadow-xs rounded-2xl p-2 focus-within:border-slate-400 transition-colors`.
   - Text inputs: `text-slate-900 placeholder:text-slate-400 bg-transparent text-sm`.
   - Shortcut kbd: `bg-slate-100 text-slate-500 border border-slate-200 rounded-md font-mono`.
   - Divider: `border-slate-200`.
   - Button: `bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-xs` (matching primary actions in `VacancyDetailPane`).
2. **`FilterDrawer.tsx` & Deduplication Banner in `App.tsx`**:
   - Replace the dark deduplication badge with a light, subtle pastel alert: `bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-xl`.
   - Refine `FilterDrawer` pills, inputs, and toggles to feel seamless with `PastelMetricGrid` and `VacancyDetailPane`.
3. **`PipelineView.tsx`**:
   - Transform container and cards to `bg-white border border-slate-200/80 rounded-2xl shadow-xs`.
   - Modernize status columns with soft semantic pastel pills (e.g. `saved`: `bg-amber-50 text-amber-800 border-amber-200`, `applied`: `bg-emerald-50 text-emerald-800 border-emerald-200`, `interviewing`: `bg-sky-50 text-sky-800 border-sky-200`, `rejected`: `bg-slate-100 text-slate-600 border-slate-200`).
   - Clean light empty state, refined typography, and custom-styled select dropdowns (`bg-slate-50 border-slate-200 text-slate-800`).
4. **`ResumeLibraryView.tsx` & CV Generation Modals**:
   - Convert library background, cards, and empty state to `bg-white border border-slate-200/80 rounded-2xl shadow-xs`.
   - Replace `font-mono` headers with modern sans typography (`font-sans`), reserving mono strictly for code/technical identifiers.
   - Migrate `RoleArchetypeModal.tsx`, `VacancyTailorModal.tsx`, and `SyncImprovementsModal.tsx` to crisp white modals with light backdrops (`bg-slate-900/40 backdrop-blur-sm`), clean inputs, and slate-900 action buttons.
5. **`MasterProfileEditor.tsx` & `AvatarUploader.tsx`**:
   - Redesign modal container to `bg-white border border-slate-200 rounded-2xl shadow-2xl`.
   - YAML editor: provide an ergonomic code editor surface (clean light background `bg-slate-50/50` or calibrated high-contrast editor with light line gutters `text-slate-400 bg-slate-100/50 border-slate-200`).
   - Side drawer & `AvatarUploader`: convert to `bg-slate-50 border border-slate-200/80 rounded-xl`.

**Alternatives**:
- *Partial Migration*: Only style `SearchBar.tsx` and `FilterDrawer.tsx`. (Rejected: Leaves `PipelineView`, `ResumeLibraryView`, and modals severely mismatched on user navigation).

**Files likely to change**:
- `frontend/src/components/SearchBar.tsx`
- `frontend/src/App.tsx`
- `frontend/src/components/FilterDrawer.tsx`
- `frontend/src/components/PipelineView.tsx`
- `frontend/src/components/ResumeLibraryView.tsx`
- `frontend/src/components/MasterProfileEditor.tsx`
- `frontend/src/components/AvatarUploader.tsx`
- `frontend/src/components/RoleArchetypeModal.tsx`
- `frontend/src/components/VacancyTailorModal.tsx`
- `frontend/src/components/SyncImprovementsModal.tsx`
- `frontend/src/components/LiveCVViewer.tsx`

**Tests to add or update**:
- Update component tests (`ResumeLibraryView.test.tsx`, `MasterProfileEditor.test.tsx`, `RoleArchetypeModal.test.tsx`, `VacancyTailorModal.test.tsx`, `FilterDrawer.test.tsx`) to verify light theme elements and ensure all user flows and modal interactions continue to pass.
- Execute full offline test suites (`npm test -- --run` and `.venv/bin/pytest backend/tests/`).

## Risks & Considerations

- **Contrast & Legibility**: Ensure YAML editor syntax errors, line numbers, and textarea contrast remain accessible (WCAG AA).
- **Test Integrity**: Ensure test selectors (`data-testid`, accessible role labels) remain intact across all refactored modal components.
- **Scope Discipline**: Limit changes strictly to visual token styling and layout consistency without altering data structures or IndexedDB persistence.

## Open Questions

- None. The scope of missing components and the target visual design system (`007-modern-jobs-ui`) are clearly defined.
