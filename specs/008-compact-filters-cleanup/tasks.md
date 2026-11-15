---
description: "Task list for Compact Filter Toolbar, Redundancy Elimination, Content De-Cluttering & Structured Job Descriptions"
---

# Tasks: Compact Filter Toolbar, Redundancy Elimination, Content De-Cluttering & Structured Job Descriptions

**Input**: Design documents from `/specs/008-compact-filters-cleanup/`
**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Test tasks are included per the implementation plan and TDD guidelines across all user stories.
**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type definitions, data models, and shared contract interfaces.

- [ ] T001 Define filter state, job description, and UI de-cluttering interfaces in `frontend/src/types/job.ts`: `FilterState` (`seniority: SeniorityFilter`, `timeframes: TimeframeId[]`, `modality: string`, `location: string`), `MexicanStateOption` (`code: string`, `label: string`, `fullName: string`), `SeniorityOption` (`id: SeniorityFilter`, `label: string`, `shortLabel?: string`, `isHighlight?: boolean`), `FilterToolbarProps` (`filters: FilterState`, `seniorityCounts: Record<SeniorityFilter, number>`, `timeframeCounts?: Record<TimeframeId, number>`, `hideApplied: boolean`, `hiddenAppliedCount: number`, `totalResultsCount: number`, `duplicatesMergedCount?: number`, `onFilterChange: (filters: FilterState) => void`, `onToggleHideApplied: () => void`, `onResetFilters: () => void`), `StructuredJobSectionId` (`"overview" | "responsibilities" | "requirements" | "benefits" | "conditions"`), `ParsedJobSection` (`id: StructuredJobSectionId`, `title: string`, `iconName: "Briefcase" | "ListChecks" | "CheckCircle2" | "Gift" | "MapPin"`, `items: string[]`), `StructuredJobDescription` (`hasStructuredSections: boolean`, `sections: ParsedJobSection[]`, `rawText: string`), `NavigationTab` (`"search" | "pipeline" | "resumes"`), `NavigationTabItem` (`id: NavigationTab`, `label: string`, `icon: string`, `badgeCount?: number`), and `ResumeBadgeInfo` (`label: string`, `type: "vacancy" | "role"`, `colorClass: string`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core state helpers and Mexican regional data required across user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 [P] Implement Mexican regional states catalog and helper in `frontend/src/services/mexican_states.ts` providing `MEXICAN_STATES: MexicanStateOption[]` (`"México"`, `"CDMX"`, `"JAL"`, `"NL"`, `"QRO"`, `"PUE"`, `"GTO"`, `"YUC"`, `"BC"`, `"REMOTO"`) with `code`, `label`, and `fullName` properties

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Compact Horizontal Filter Toolbar (Priority: P1) 🎯 MVP

**Goal**: Consolidate the oversized filter drawer into a sleek, unified, single-row horizontal toolbar (~44px) featuring a contiguous seniority segmented control with live counters, Date dropdown popover with timeframe counts, Modality dropdown, Mexican States dropdown, Hide Applied toggle, and conditional Reset button, adapting to a single-row scrollable container on mobile (<768px).

**Independent Test**: Navigate to the main vacancies feed, observe the compact single-row toolbar, toggle timeframe, seniority, and modality options from their respective controls to verify that listings and counters update immediately (<50ms) without layout jumps.

### Tests for User Story 1 ⚠️

- [ ] T003 [P] [US1] Component tests for `FilterToolbar.tsx` in `frontend/tests/components/FilterToolbar.test.tsx` verifying contiguous seniority segmented control rendering, popover toggling (Date, Modality, State) on click/outside/Escape, active option badge updates, reset button appearance on non-default state, and mobile single-row scroll classes (`overflow-x-auto flex-nowrap`)

### Implementation for User Story 1

- [ ] T004 [US1] Implement `FilterToolbar.tsx` in `frontend/src/components/FilterToolbar.tsx` conforming to `FilterToolbarProps`, containing: contiguous segmented seniority control with live counts and emerald highlight for `primer_empleo`; Date dropdown popover with timeframe counts (`Hoy`, `3 días`, `7 días`, `14 días`, `30 días`, `Todas`); Modality dropdown popover (`Todas`, `Remoto`, `Híbrido`, `Presencial`); Mexican States dropdown popover using `MEXICAN_STATES`; Hide Applied toggle button with active count; conditional "Restablecer" button (active when any filter is non-default); tactile press states (`active:scale-[0.98]`); and mobile single-row horizontal scroll container with edge fade masks
- [ ] T005 [US1] Wire `FilterToolbar.tsx` in `frontend/src/App.tsx`, replacing `FilterDrawer` usage in the search view with `FilterToolbar`, binding `filters`, `seniorityCounts`, `timeframeCounts`, `hideApplied`, `hiddenAppliedCount`, `duplicatesMergedCount`, `onFilterChange`, `onToggleHideApplied`, and `onResetFilters` (restoring toolbar filters to defaults while preserving active search bar query)

**Checkpoint**: User Story 1 is functional and testable independently. The compact toolbar controls all vacancy filters.

---

## Phase 4: User Story 2 - Elimination of Redundant Filters & Region Input Removal (Priority: P1)

**Goal**: Streamline `SearchBar.tsx` to query-only without free-text location input, remove duplicate `quickSeniorityOptions` pill row from `VacancyList.tsx`, and ensure exactly one interactive control exists per filter criterion.

**Independent Test**: Audit the entire search interface to confirm that seniority, timeframe, modality, and hide-applied appear only once in the toolbar, and that the search bar contains solely the keyword input and submit action without any region text input.

### Tests for User Story 2 ⚠️

- [ ] T006 [P] [US2] Unit and component tests for streamlined `SearchBar.tsx` in `frontend/tests/components/SearchBar.test.tsx` verifying single keyword query input, keyboard shortcut `/` focus, submission without location input, and removal of `initialLocation` prop
- [ ] T007 [P] [US2] Update component tests in `frontend/tests/components/VacancyList.test.tsx` verifying that vacancy list renders cleanly without duplicate seniority pills or redundant quick filters

### Implementation for User Story 2

- [ ] T008 [US2] Refactor `SearchBar.tsx` in `frontend/src/components/SearchBar.tsx` to remove the free-text location input container and MapPin icon per `contracts/filter-toolbar-contract.md`, updating `SearchBarProps` to `onSearch: (query: string) => void`, `isSearching: boolean`, `initialQuery?: string`
- [ ] T009 [US2] Refactor `VacancyList.tsx` in `frontend/src/components/VacancyList.tsx` to remove `quickSeniorityOptions` horizontal pill row, removing unused `onSelectSeniority` and `onClearSeniorityFilter` props so the toolbar is the sole seniority selector
- [ ] T010 [US2] Update `frontend/src/App.tsx` search handlers and `VacancyList` props, eliminating `initialLocation` from `SearchBar` and removing secondary seniority callbacks from `VacancyList`

**Checkpoint**: User Stories 1 AND 2 are functional together. Zero redundant filters or duplicate inputs remain on the search view.

---

## Phase 5: User Story 3 - Structured Visual Hierarchy for Job Descriptions (Priority: P2)

**Goal**: Parse unstructured job descriptions into semantic sections (`overview`, `responsibilities`, `requirements`, `benefits`, `conditions`) with bullet detection and render scannable white card containers with Lucide icons and DOMPurify sanitization.

**Independent Test**: Open any job listing in the detail panel or mobile sheet and verify that plain-text descriptions are automatically parsed and displayed with distinct section headings, bulleted lists, and requirement badges without monolithic text blocks or empty cards.

### Tests for User Story 3 ⚠️

- [ ] T011 [P] [US3] Unit tests for `job_description_parser.ts` in `frontend/tests/services/job_description_parser.test.ts` covering Spanish section headers detection (`responsabilidades`, `requisitos`, `beneficios`, `condiciones`), bullet list tokenization (`-`, `*`, `•`, numbered lists), paragraph grouping, and graceful fallback to a single overview card when no section headers are present
- [ ] T012 [P] [US3] Component tests for `JobDescriptionViewer.tsx` in `frontend/tests/components/JobDescriptionViewer.test.tsx` covering section cards rendering (`bg-white border border-slate-200/80 rounded-xl p-4`), semantic icon headers, bullet styling, DOMPurify XSS sanitization, and single-card fallback layout

### Implementation for User Story 3

- [ ] T013 [US3] Implement client-side deterministic parser in `frontend/src/services/job_description_parser.ts` implementing `parseJobDescription(rawText: string): StructuredJobDescription` using regex dictionary for Spanish job headers (`responsibilities`, `requirements`, `benefits`, `conditions`), bullet list tokenization (`^(\s*[-*•▪▫–—]|\s*\d+[\.\)])\s*(.*)$`), paragraph grouping, and fallback to single `overview` card
- [ ] T014 [US3] Implement `JobDescriptionViewer.tsx` in `frontend/src/components/JobDescriptionViewer.tsx` rendering `StructuredJobDescription` sections in white card containers (`bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs`) with Lucide icons (`Briefcase`, `ListChecks`, `CheckCircle2`, `Gift`, `MapPin`), styled bullet items, and DOMPurify sanitization
- [ ] T015 [US3] Integrate `JobDescriptionViewer.tsx` into `VacancyDetailPane.tsx` in `frontend/src/components/VacancyDetailPane.tsx` to replace raw pre-line HTML rendering on the description tab, keeping skills pills and scam/audit badges intact

**Checkpoint**: User Stories 1, 2, and 3 are functional. Job descriptions render with clean visual hierarchy.

---

## Phase 6: User Story 4 - Purge of Low-Value Text & Technical Boilerplate Across All Views (Priority: P2)

**Goal**: Purge technical build badges, promotional boilerplate, bracketed tags, and prominent extraction banners across Header, PipelineView, ResumeLibraryView, MasterProfileEditor, and App.

**Independent Test**: Review all views to confirm that technical implementation jargon ("IndexedDB", "v0.1.0"), verbose marketing copy, and bracket prefixes (`[VACANTE: ...]`, `[ROL: ...]`) are replaced with concise, human-centered labels.

### Tests for User Story 4 ⚠️

- [ ] T016 [P] [US4] Component tests in `frontend/tests/components/DeCluttering.test.tsx` asserting: Header navigation labels are concise ("Vacantes", "Postulaciones", "CVs", "Perfil") and version badge is removed; PipelineView header lacks "IndexedDB" badge; ResumeLibraryView cards render clean bracket-free badges; and MasterProfileEditor renders clean syntax status without bracket wrappers

### Implementation for User Story 4

- [ ] T017 [P] [US4] Update `Header.tsx` in `frontend/src/components/Header.tsx` to remove the `v0.1.0 • MX Jr Live` badge and shorten navigation tab labels to `"Vacantes"`, `"Postulaciones"`, `"CVs"`, and `"Perfil"`
- [ ] T018 [P] [US4] Update `PipelineView.tsx` in `frontend/src/components/PipelineView.tsx` to remove the `"Almacenamiento Local (IndexedDB)"` badge and simplify header title to `Postulaciones ({count})`
- [ ] T019 [P] [US4] Update `ResumeLibraryView.tsx` in `frontend/src/components/ResumeLibraryView.tsx` to remove promotional paragraph `"Currículums adaptados a vacantes..."` and replace bracketed badge strings (`[VACANTE: ...]` and `[ROL: ...]`) with clean styled badges
- [ ] T020 [P] [US4] Update `MasterProfileEditor.tsx` in `frontend/src/components/MasterProfileEditor.tsx` to remove `(Master Career Knowledge Base)` subtitle and replace bracketed validation badges (`[ESTRUCTURA VÁLIDA]` → `Estructura válida`, `[ERROR EN LÍNEA ...]` → `Error en línea ...`) with clean text labels
- [ ] T021 [US4] Update `frontend/src/App.tsx` and `frontend/src/components/VacancyList.tsx` to replace the prominent deduplication alert banner (`⚡ Se combinaron N vacantes duplicadas...`) with a subtle inline text counter next to the results count (`42 vacantes • 12 combinadas`), and safely delete legacy `frontend/src/components/FilterDrawer.tsx` and its test `frontend/tests/components/FilterDrawer.test.tsx`

**Checkpoint**: All user stories are complete. UI is completely purged of technical boilerplate and promotional noise.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verification, responsiveness auditing, and documentation update.

- [ ] T022 [P] Run full frontend test suite (`npm --prefix frontend test -- --run`) and backend test suite (`.venv/bin/pytest backend/tests/ -v`) to confirm 100% test passing and zero regressions
- [ ] T023 [P] Validate responsive layout across mobile (<768px single-row horizontal scroll) and desktop viewports per `quickstart.md`
- [ ] T024 Update `GEMINI.md` Architectural Decisions & Conventions Log with Feature 008 architectural standards (compact filter toolbar, redundancy elimination, structured job description cards, and UI de-cluttering)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 (types) - BLOCKS User Story 1.
- **User Story 1 (Phase 3)**: Depends on Phase 2 - delivers core MVP filter toolbar.
- **User Story 2 (Phase 4)**: Depends on Phase 3 - streamlines search bar and vacancy list.
- **User Story 3 (Phase 5)**: Depends on Phase 1 - parser and viewer can be built in parallel with US1/US2.
- **User Story 4 (Phase 6)**: Depends on Phase 3 & 4 (since legacy `FilterDrawer` is deleted here).
- **Polish (Phase 7)**: Depends on all user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Independent of US2, US3, US4.
- **User Story 2 (P1)**: Integrates after US1 to ensure toolbar is active before removing duplicate search/list controls.
- **User Story 3 (P2)**: Independent of US1, US2, US4 (operates on detail pane).
- **User Story 4 (P2)**: Best executed after US1/US2 to finalize App.tsx cleanup and delete legacy FilterDrawer.

### Within Each User Story

- Tests written first, verified to fail or compile cleanly before implementation.
- Types & utilities before components.
- Components before page integration.
- Story complete and verified before moving to next priority.

### Parallel Opportunities

- T003 (US1 test) and T002 (Foundational states) can be authored in parallel.
- T006, T007 (US2 tests) can run in parallel.
- T011, T012 (US3 tests) can run in parallel with US1/US2 implementation.
- T017, T018, T019, T020 (US4 view cleanups) can be worked on in parallel across different files.
- T022, T023 (Polish verification) can run in parallel.

---

## Parallel Example: User Story 3

```bash
# Launch test and implementation tasks in parallel across separate files:
Task T011: "frontend/tests/services/job_description_parser.test.ts"
Task T012: "frontend/tests/components/JobDescriptionViewer.test.tsx"
Task T013: "frontend/src/services/job_description_parser.ts"
Task T014: "frontend/src/components/JobDescriptionViewer.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup types).
2. Complete Phase 2 (Foundational Mexican states catalog).
3. Complete Phase 3 (User Story 1: `FilterToolbar.tsx`, tests, and `App.tsx` wiring).
4. **STOP and VALIDATE**: Verify that the horizontal toolbar refines listings, opens popovers, and resets cleanly.

### Incremental Delivery

1. Setup + Foundational → Core types and state options ready.
2. User Story 1 → Compact toolbar functional (MVP!).
3. User Story 2 → Duplicate location input and quick seniority pills eliminated.
4. User Story 3 → Job descriptions structured into scannable white cards.
5. User Story 4 → Technical noise, version badges, and boilerplate purged across all views.
6. Phase 7 (Polish) → Test suites verified, responsive audit, and `GEMINI.md` updated.
