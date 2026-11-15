# Tasks: Modern Split-View Jobs Layout & Clean UI Redesign

**Input**: Design documents from `/specs/007-modern-jobs-ui/`
- Spec: `specs/007-modern-jobs-ui/spec.md`
- Plan: `specs/007-modern-jobs-ui/plan.md`
- Research: `specs/007-modern-jobs-ui/research.md`
- Data Model: `specs/007-modern-jobs-ui/data-model.md`
- Contracts: `specs/007-modern-jobs-ui/contracts/component-contracts.ts` & `specs/007-modern-jobs-ui/contracts/ui-contracts.md`
- Quickstart: `specs/007-modern-jobs-ui/quickstart.md`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, third-party drawer library installation, and light design tokens.

- [ ] T001 Install `vaul` package in `frontend/package.json` for gesture-driven mobile bottom sheets
- [ ] T002 [P] Configure light-theme base styles (`#F8F9FA` canvas background, slate typography, smooth scrollbar) in `frontend/src/index.css`
- [ ] T003 [P] Add PastelMetricItem, PastelTheme, and DetailTab interface definitions in `frontend/src/types/job.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core UI components required by all user stories before layout integration.

**⚠️ CRITICAL**: Must be completed before User Story implementation begins.

- [ ] T004 [P] Implement `PastelMetricGrid` component in `frontend/src/components/PastelMetricGrid.tsx` rendering 4 semantic pastel cards (Salary, Modality, Experience, Seniority) with WCAG AA compliant text contrast
- [ ] T005 Implement foundational `VacancyDetailPane` container component in `frontend/src/components/VacancyDetailPane.tsx` housing header metadata, pastel metrics grid, tab skeleton, and sticky bottom action bar

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 - Desktop Master-Detail Split-View Exploration (Priority: P1) 🎯 MVP

**Goal**: Deliver a side-by-side 40/60 master-detail desktop layout (viewport $\ge$ 1024px: 40% master list, 60% sticky detail pane, min-w 420px) with automatic first-vacancy selection upon stream arrival, keyboard card navigation, and responsive slide-up bottom sheet on mobile (< 1024px).

**Independent Test**: Load search results on desktop (1024px+); verify first vacancy is auto-selected in sticky right pane without opening any modal; navigate cards using `j`/`k` to verify instant detail updates (<50ms); switch to mobile viewport (< 1024px) and verify selecting a card opens an interactive slide-up bottom sheet with drag-to-dismiss handle.

### Tests for User Story 1 ⚠️

- [ ] T006 [P] [US1] Add unit tests in `frontend/tests/components/VacancyDetailPane.test.tsx` verifying inline desktop rendering, close callback, and mobile drawer trigger behavior
- [ ] T007 [P] [US1] Update integration tests in `frontend/tests/App.test.tsx` verifying master-detail 40/60 split layout, auto-selection of first streaming vacancy, and keyboard navigation

### Implementation for User Story 1

- [ ] T008 [US1] Implement responsive 12-column master-detail split grid in `frontend/src/App.tsx` (`lg:col-span-5` master feed, `lg:col-span-7 sticky top-20` detail pane) with stream auto-selection of first vacancy
- [ ] T009 [US1] Integrate `vaul`'s `Drawer.Root` in `frontend/src/App.tsx` to render `VacancyDetailPane` as an interactive slide-up bottom sheet with top drag handle bar on viewports < 1024px
- [ ] T010 [US1] Update keyboard navigation in `frontend/src/hooks/useKeyboardNavigation.ts` and `frontend/src/App.tsx` to update active vacancy selection with `scrollIntoView({ block: 'nearest' })` without modal opening on desktop

**Checkpoint**: User Story 1 complete and independently testable (MVP delivery).

---

## Phase 4: User Story 2 - Modern Light Visual Design System & Pastel Metric Cards (Priority: P2)

**Goal**: Transform visual design to modern light aesthetic (`#F8F9FA` canvas, crisp white container cards with `rounded-2xl`, dark accent pills) and render the 4 semantic pastel metric blocks with company squircles and localized metadata.

**Independent Test**: Render vacancy cards and detail pane; verify card styling uses white background with subtle border, company squircle icon, bold title hierarchy, relative publication time (`hace 1 hora`), and 4 pastel metric cards (Green for Salary, Blue for Modality, Amber for Experience, Purple for Seniority) meeting WCAG AA contrast.

### Tests for User Story 2 ⚠️

- [ ] T011 [P] [US2] Add unit tests in `frontend/tests/components/PastelMetricGrid.test.tsx` verifying all 4 pastel card themes (emerald, sky, amber, purple), values, icons, and fallback text formatting
- [ ] T012 [P] [US2] Update unit tests in `frontend/tests/components/VacancyCard.test.tsx` to verify modern light card layout, company squircle logo, bold title hierarchy, and attribute pills

### Implementation for User Story 2

- [ ] T013 [US2] Redesign `frontend/src/components/VacancyCard.tsx` with modern light aesthetic (`bg-white border-slate-200/80 rounded-2xl shadow-xs`), active selection ring (`ring-2 ring-slate-900/10 border-slate-900`), company squircle placeholder, and localized metadata
- [ ] T014 [US2] Update `frontend/src/components/VacancyList.tsx` to display search results count header ("29 vacantes encontradas"), active card highlight binding, and shimmering pastel skeleton cards during in-flight streaming
- [ ] T015 [US2] Restyle `frontend/src/components/Header.tsx` to clean light theme (`bg-white/80 border-b border-slate-200/80 backdrop-blur text-slate-800`) with refined brand badge

**Checkpoint**: User Stories 1 AND 2 working cohesively.

---

## Phase 5: User Story 3 - Segmented Detail View Tabs & Streamlined Application Flow (Priority: P3)

**Goal**: Segment detail pane content across 2 pill tabs (`Descripción` vs `Evaluación AI`) with solid dark pill active indicator, DOMPurified description, deep AI evaluation breakdown, and sticky full-width "Postularme ahora" CTA.

**Independent Test**: Navigate between `Descripción` and `Evaluación AI` tabs; verify tab switch is smooth and retains evaluation cache by vacancy fingerprint; click "Postularme ahora" to verify opening direct verified URL in new window; click bookmark to save vacancy locally.

### Tests for User Story 3 ⚠️

- [ ] T016 [P] [US3] Add unit tests in `frontend/tests/components/VacancyDetailPane.test.tsx` for segmented tab state switching, cache isolation by fingerprint, and external application URL opening

### Implementation for User Story 3

- [ ] T017 [US3] Implement 2-tab segmented switch in `frontend/src/components/VacancyDetailPane.tsx` with solid dark pill indicator (`bg-slate-900 text-white`) and strict fingerprint-keyed evaluation cache retention
- [ ] T018 [US3] Implement Tab 1 ("Descripción") in `frontend/src/components/VacancyDetailPane.tsx` rendering scam shield warnings (`ScamBadge`), DOMPurified job description, responsibilities, requirements, and desired technical skills
- [ ] T019 [US3] Implement Tab 2 ("Evaluación AI") in `frontend/src/components/VacancyDetailPane.tsx` rendering AI match score, matched skills pills, missing gaps, seniority audit reasoning, and "Adaptar mi CV" button triggering `onOpenTailorModal`
- [ ] T020 [US3] Implement full-width sticky CTA button ("Postularme ahora") and secondary action pills (save to pipeline, mark applied) at the bottom of `frontend/src/components/VacancyDetailPane.tsx`

**Checkpoint**: User Stories 1, 2, and 3 fully functional and testable.

---

## Phase 6: User Story 4 - Slop Text Elimination & Clean Mexican Job Localization (Priority: P4)

**Goal**: Purge all non-value-adding marketing slogans, verbose banners, and boilerplate text ("FILTROS MEXICANOS", "Desarrollado para Jr", green banners) across all components.

**Independent Test**: Inspect all text strings across `FilterDrawer.tsx`, `Header.tsx`, `App.tsx`, and `VacancyList.tsx`; execute automated grep checks verifying 0 occurrences of deprecated slogans remain.

### Tests for User Story 4 ⚠️

- [ ] T021 [P] [US4] Add regression tests in `frontend/tests/components/FilterDrawer.test.tsx` and `frontend/tests/App.test.tsx` asserting 0 occurrences of "Filtros Mexicanos", "Desarrollado para juniors", or verbose banners

### Implementation for User Story 4

- [ ] T022 [US4] Clean `frontend/src/components/FilterDrawer.tsx`: remove "Filtros Mexicanos (Nivel de Experiencia, Modalidad & Fecha)" header, restyle filter pills to modern light theme (`bg-slate-100 hover:bg-slate-200 text-slate-700` and `bg-slate-900 text-white` for active)
- [ ] T023 [US4] Clean `frontend/src/App.tsx`: delete verbose green banner ("100% Búsqueda en Vivo: Concurrencia directa...") and remove footer slogan ("MishooJobs • Desarrollado para juniors y estudiantes en México • Moneda MXN ($)")
- [ ] T024 [US4] Clean `frontend/src/components/VacancyList.tsx` and `frontend/src/components/PortalStatusBar.tsx`: simplify loading text to concise copy ("Buscando vacantes...") and clean empty state messaging

**Checkpoint**: All user stories complete with 0 marketing slop remaining.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Dead code removal, craft polish, full test suite execution, and Spec Kit documentation update.

- [ ] T025 [P] Deprecate and remove redundant `frontend/src/components/VacancyDetailModal.tsx` superseded by `VacancyDetailPane.tsx`
- [ ] T026 Verify 60fps animation budgets, zero layout shift during streaming, and mobile touch ergonomics using Emil Kowalski craft guidelines
- [ ] T027 Run complete validation per `quickstart.md`: execute Vitest suite (`npm test -- --run`) and backend Pytest suite (`.venv/bin/pytest backend/tests/ -v`)
- [ ] T028 [MANDATORY Spec Kit Step] Update `GEMINI.md` Section 7 (Architectural Decisions & Conventions Log) with key decisions from feature `007-modern-jobs-ui`

---

## Dependencies & Execution Order

```
[Phase 1: Setup] (T001 - T003)
       │
       ▼
[Phase 2: Foundational] (T004 - T005)
       │
       ├─────────────────────────────────────────────────┐
       ▼                                                 ▼
[Phase 3: User Story 1 (P1)] ──► [Phase 4: User Story 2 (P2)] ──► [Phase 5: User Story 3 (P3)]
(T006 - T010)                    (T011 - T015)                    (T016 - T020)
                                                                 │
                                                                 ▼
                                                 [Phase 6: User Story 4 (P4)] (T021 - T024)
                                                                 │
                                                                 ▼
                                                 [Phase 7: Polish & Documentation] (T025 - T028)
```

### Phase Dependencies
- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion; blocks all user stories.
- **User Stories (Phases 3-6)**: Sequenced by priority (P1 $\rightarrow$ P2 $\rightarrow$ P3 $\rightarrow$ P4) or executable in parallel by sub-teams once Foundation is ready.
- **Polish (Phase 7)**: Depends on all user stories completing.

### Parallel Opportunities
- **Phase 1**: `T002` (CSS styles) and `T003` (type definitions) can run in parallel after `T001`.
- **Phase 2**: `T004` (`PastelMetricGrid`) and `T005` (`VacancyDetailPane`) can be scaffolded in parallel.
- **Phase 3 (US1)**: `T006` and `T007` (tests) can run in parallel before implementation.
- **Phase 4 (US2)**: `T011` and `T012` (tests) can run in parallel.
- **Phase 5 (US3)**: `T016` (test) runs in parallel with US2 polish.
- **Phase 6 (US4)**: `T021` (test) can run in parallel with US3 tasks.
- **Phase 7**: `T025` (dead code purge) can run in parallel with test verification.

---

## Implementation Strategy: MVP First

1. **Phase 1 & 2**: Setup `vaul`, light theme tokens, and foundational `PastelMetricGrid` + `VacancyDetailPane`.
2. **Phase 3 (MVP)**: Wire up the 40/60 master-detail desktop split layout and mobile bottom sheet in `App.tsx`. Validate that desktop users can browse and inspect jobs with zero popup modals.
3. **Phase 4**: Layer on the modern light visual design system, company squircles, and 4 pastel metric cards.
4. **Phase 5**: Wire up the 2-tab segmented switch (`Descripción` vs `Evaluación AI`) and sticky "Postularme ahora" action button.
5. **Phase 6**: Systematically purge all marketing slop ("Filtros Mexicanos", "Desarrollado para Jr", green banners).
6. **Phase 7**: Polish animations, verify test suites, and update `GEMINI.md`.
