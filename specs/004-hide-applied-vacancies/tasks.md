---
description: "Task list for Hide Applied Vacancies & Search Feed Clean-Up"
---

# Tasks: Hide Applied Vacancies & Search Feed Clean-Up

**Input**: Design documents from `/specs/004-hide-applied-vacancies/`  
**Prerequisites**: [plan.md](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/specs/004-hide-applied-vacancies/plan.md), [spec.md](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/specs/004-hide-applied-vacancies/spec.md), [data-model.md](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/specs/004-hide-applied-vacancies/data-model.md), [contracts/ui-contracts.md](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/specs/004-hide-applied-vacancies/contracts/ui-contracts.md), [research.md](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/specs/004-hide-applied-vacancies/research.md), [quickstart.md](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/specs/004-hide-applied-vacancies/quickstart.md)

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], [US3]...)
- File paths are exact repository relative paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Test environment verification and tooling readiness

- [ ] T001 Verify frontend test harness and dependencies for offline Vitest execution in frontend/package.json and frontend/vite.config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, status sets, and memoized application sets that MUST be in place before any user story can execute

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete

- [ ] T002 Extend ApplicationStatus union in frontend/src/types/application.ts with enum values `"new" | "saved" | "applied" | "interviewing" | "rejected" | "offer" | "ignored"`, export constant `APPLIED_STATUSES = new Set<ApplicationStatus>(["applied", "interviewing", "rejected", "offer"])`, and define `AppliedFilterPreference` with key `"mishoojobs_hide_applied"` and value `boolean`
- [ ] T003 [P] Compute and export memoized `appliedFingerprintSet: Set<string>` containing fingerprints with status in `APPLIED_STATUSES` in frontend/src/hooks/useApplications.ts
- [ ] T004 Implement foundational filtering pipeline in frontend/src/App.tsx: derive `unignoredVacancies` (excluding `ignoredSet`), calculate `baseActiveVacancies` (excluding `appliedFingerprintSet` when `hideApplied` is true), calculate `hiddenAppliedCount`, compute dynamic net `tierCounts` against `baseActiveVacancies`, and ensure FilterDrawer receives `baseActiveVacancies` as its `vacancies` prop to guarantee net visible timeframe counts (FR-018)

**Checkpoint**: Core types, applied set, and foundational filtering pipeline ready; user story implementation can now begin.

---

## Phase 3: User Story 1 - Instant Hiding of Applied Vacancies via Toolbar Toggle (Priority: P1) 🎯 MVP

**Goal**: Provide a quick, one-click toolbar toggle pill in the search header and a synchronized switch in FilterDrawer to exclude post-application vacancies (`applied`, `interviewing`, `rejected`, `offer`) while keeping `saved` and untracked vacancies visible, with dynamic net counter synchronization.

**Independent Test**: Conduct a search containing a mix of new, saved, and applied vacancies. Click the "Ocultar postuladas" toolbar pill. Verify that all post-application vacancies vanish from the feed, the hidden counter displays the exact count of hidden listings, and vacancies with status `saved` or untracked remain visible.

### Tests for User Story 1

- [ ] T005 [P] [US1] Create component tests for toolbar toggle pill states (`Ocultar postuladas` vs `Ocultando postuladas`), hidden count badge rendering, and net counter synchronization in frontend/tests/components/VacancyList.test.tsx
- [ ] T006 [P] [US1] Create component tests for FilterDrawer toggle switch synchronization and dynamic net facet counts in frontend/tests/components/FilterDrawer.test.tsx

### Implementation for User Story 1

- [ ] T007 [US1] Implement toolbar toggle pill in frontend/src/components/VacancyList.tsx with inactive state (`Ocultar postuladas`, `bg-zinc-900 border-zinc-800 text-zinc-400`), active state (`Ocultando postuladas`, `bg-emerald-950 border-emerald-600 text-emerald-300`), tooltip `"Ocultar vacantes con postulación enviada (Atajo: H)"`, and live hidden count badge `(N)`
- [ ] T008 [US1] Update results summary text in frontend/src/components/VacancyList.tsx to display `Mostrando X vacantes verificadas en vivo (Y postuladas ocultas)` when `hideApplied` is active and `hiddenCount > 0`
- [ ] T009 [US1] Implement dedicated "Ocultar postuladas" switch in frontend/src/components/FilterDrawer.tsx with role `switch`, `aria-checked`, emerald toggle track, and live `(N)` hidden count badge
- [ ] T010 [US1] Wire `hideApplied`, `hiddenCount`, and `onToggleHideApplied` props between frontend/src/App.tsx, frontend/src/components/VacancyList.tsx, and frontend/src/components/FilterDrawer.tsx, passing `baseActiveVacancies` to FilterDrawer for net facet calculation

**Checkpoint**: User Story 1 is functional and independently testable as an MVP increment.

---

## Phase 4: User Story 2 - Real-Time Feed Clean-Up on In-Flight Application (Priority: P1)

**Goal**: Automatically collapse and remove a vacancy card from the search feed within 1 animation frame (< 16ms) when marked as applied while the filter is active, decrementing the visible counter, incrementing the hidden counter, and clamping keyboard focus to the next card.

**Independent Test**: With "Ocultar postuladas" active, navigate to a visible vacancy card and mark it as applied (via the card action button or keyboard shortcut `a`). Verify that the card immediately disappears from the feed, the total visible count decrements by 1, and the hidden count badge increments by 1.

### Tests for User Story 2

- [ ] T011 [P] [US2] Create unit tests for in-flight removal reactivity and keyboard focus index clamping upon application marking in frontend/tests/hooks/useKeyboardNavigation.test.ts

### Implementation for User Story 2

- [ ] T012 [US2] Update frontend/src/hooks/useKeyboardNavigation.ts to clamp `selectedIndex` when visible `vacancies` shrink (`vacancies.length === 0 ? -1 : Math.max(0, Math.min(prev, vacancies.length - 1))`), preventing focus orphan or negative out-of-bounds states on card disappearance
- [ ] T013 [US2] Optimize application state updates in frontend/src/hooks/useApplications.ts to ensure instantaneous (<16ms) local state updates upon calling `setApplicationStatus(vacancy, "applied")`

**Checkpoint**: User Story 2 is functional; marking vacancies as applied removes them in real time without feed desynchronization.

---

## Phase 5: User Story 3 - Keyboard-First Toggle Navigation (Priority: P2)

**Goal**: Provide a dedicated keyboard shortcut (`h` / `H`) to toggle the hide-applied filter on and off when focus is outside editable input elements and modal dialogs are closed.

**Independent Test**: Press `h` while viewing search results to toggle the filter on and off. Focus the search input field or notes textarea and press `h` to confirm the character types normally and does not trigger the toggle.

### Tests for User Story 3

- [ ] T014 [P] [US3] Create unit tests for `h`/`H` keyboard shortcut handling, input/textarea exclusion, and modal dialog suppression in frontend/tests/hooks/useKeyboardNavigation.test.ts

### Implementation for User Story 3

- [ ] T015 [US3] Add `onToggleHideApplied` prop to `KeyboardNavigationProps` in frontend/src/hooks/useKeyboardNavigation.ts and handle `e.key === "h" || e.key === "H"` before zero-vacancies checks, ignoring if `isModalOpen` is true or target element is `INPUT`, `TEXTAREA`, `SELECT`, or `isContentEditable`
- [ ] T016 [US3] Pass `onToggleHideApplied` callback to `useKeyboardNavigation` hook invocation in frontend/src/App.tsx

**Checkpoint**: User Story 3 is functional; candidates can toggle the filter rapidly via keyboard without interfering with form inputs.

---

## Phase 6: User Story 4 - Persistent Filter Preference Across Sessions (Priority: P2)

**Goal**: Persist the candidate's chosen toggle state in `window.localStorage` under key `mishoojobs_hide_applied` across page reloads and browser sessions without layout shift, defaulting to `false`, and strictly preventing URL query string leakage.

**Independent Test**: Activate "Ocultar postuladas", refresh the browser tab or open the application in a new tab, and verify that the filter remains active and applied vacancies remain hidden.

### Tests for User Story 4

- [ ] T017 [P] [US4] Create unit tests for `localStorage` synchronous hydration, persistence, exception fallback, and URL query isolation in frontend/tests/App.test.tsx

### Implementation for User Story 4

- [ ] T018 [US4] Implement synchronous initial state hydration from `window.localStorage.getItem("mishoojobs_hide_applied")` with default `false` and try/catch fallback in frontend/src/App.tsx
- [ ] T019 [US4] Implement `useEffect` persistence for `hideApplied` to `localStorage.setItem("mishoojobs_hide_applied", JSON.stringify(hideApplied))` in frontend/src/App.tsx, strictly ensuring zero synchronization with URL query parameters (`window.location.search`)

**Checkpoint**: User Story 4 is functional; toggle preference persists across browser refreshes and tab reopens with zero URL leakage.

---

## Phase 7: User Story 5 - Cross-Portal Deduplication & Synchronized State (Priority: P2)

**Goal**: Match applications by canonical vacancy fingerprint so applying to a vacancy on one portal (e.g., Computrabajo) automatically hides duplicate postings of that vacancy from other portals (e.g., OCC or Indeed), and synchronize status changes from Pipeline View into Search View.

**Independent Test**: Mark a vacancy originally found on OCC as applied. Perform a search or observe the feed where the same role appears from Indeed or Computrabajo with matching canonical fingerprint. Verify that the duplicate card is also excluded when the filter is active.

### Tests for User Story 5

- [ ] T020 [P] [US5] Create unit tests verifying multi-portal canonical fingerprint matching, Search/Pipeline tab synchronization, and distinct fingerprint separation for anonymous employers ("Empresa Confidencial", FR-017) in frontend/tests/hooks/useApplications.test.ts

### Implementation for User Story 5

- [ ] T021 [US5] Verify and enforce canonical composite fingerprint lookup in frontend/src/hooks/useApplications.ts so that applications submitted on one portal automatically resolve across duplicate postings
- [ ] T022 [US5] Ensure bidirectional state synchronization between Pipeline View and Search Feed in frontend/src/App.tsx when switching tabs or modifying vacancy statuses

**Checkpoint**: User Story 5 is functional; multi-portal duplicates share application state and update seamlessly.

---

## Phase 8: User Story 6 - Dedicated Empty State for 100% Applied Results (Priority: P3)

**Goal**: Display an emerald congratulatory empty state with an active recovery action ("Mostrar vacantes postuladas") when 100% of matching vacancies for the current search query have an applied status.

**Independent Test**: Conduct a search where every returned vacancy has already been applied to and the filter is active. Verify that the dedicated empty state renders with the checkmark icon, positive messaging, and a "Mostrar vacantes postuladas" button that instantly deactivates the filter upon click.

### Tests for User Story 6

- [ ] T023 [P] [US6] Create component tests for the 100% applied empty state condition and the "Mostrar vacantes postuladas" recovery button in frontend/tests/components/VacancyList.test.tsx

### Implementation for User Story 6

- [ ] T024 [US6] Implement dedicated 100% applied empty state in frontend/src/components/VacancyList.tsx with `CheckCircle2` icon, emerald container styling (`border-dashed border-emerald-900/60 bg-emerald-950/10`), congratulatory message, and `"Mostrar vacantes postuladas"` button invoking `onToggleHideApplied`
- [ ] T025 [US6] Pass total unignored matching count and `hiddenCount` from frontend/src/App.tsx to frontend/src/components/VacancyList.tsx to cleanly differentiate the 100% applied state from zero-search-results empty state

**Checkpoint**: User Story 6 is functional; candidates who exhaust all vacancies in a search receive positive feedback and one-click recovery.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Offline verification, strict TypeScript type checks, and architectural documentation updates

- [ ] T026 [P] Verify 100% offline test execution across all frontend suites (`npm test -- --run` in frontend/) and backend test suites (`.venv/bin/pytest backend/tests/ -v`)
- [ ] T027 [P] Perform TypeScript strict typecheck (`npx tsc --noEmit` in frontend/) ensuring zero `any` usage, clean linting, and no console warnings
- [ ] T028 Update GEMINI.md with key design decisions and conventions established by feature `004` (localStorage preference isolation, dynamic net facet counts, in-flight removal with index clamping, and 100% applied empty state recovery)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion - BLOCKS all user stories.
- **User Story 1 (Phase 3, P1)**: Depends on Phase 2 completion. Delivers the core MVP.
- **User Story 2 (Phase 4, P1)**: Depends on Phase 2 & Phase 3 completion (requires toggle state and application flow).
- **User Story 3 (Phase 5, P2)**: Depends on Phase 3 completion (requires `onToggleHideApplied` toggle handler).
- **User Story 4 (Phase 6, P2)**: Depends on Phase 2 & Phase 3 completion (requires `hideApplied` state in `App.tsx`).
- **User Story 5 (Phase 7, P2)**: Depends on Phase 2 & Phase 3 completion (requires `appliedFingerprintSet` and status maps).
- **User Story 6 (Phase 8, P3)**: Depends on Phase 3 completion (requires `VacancyList` empty state handling).
- **Polish (Phase 9)**: Depends on all user story phases (Phase 3 through Phase 8) being complete.

### User Story Dependencies

```
Phase 1: Setup
    │
    ▼
Phase 2: Foundational (T002, T003, T004)
    │
    ▼
Phase 3: User Story 1 (P1 - MVP Toolbar & FilterDrawer Toggle)
    ├──► Phase 4: User Story 2 (P1 - In-Flight Real-Time Removal)
    ├──► Phase 5: User Story 3 (P2 - Keyboard Shortcut 'h' / 'H')
    ├──► Phase 6: User Story 4 (P2 - localStorage Persistence)
    ├──► Phase 7: User Story 5 (P2 - Cross-Portal Deduplication)
    └──► Phase 8: User Story 6 (P3 - 100% Applied Empty State)
             │
             ▼
      Phase 9: Polish & Cross-Cutting (Offline Tests, Typecheck, GEMINI.md)
```

### Within Each User Story

- Tests written first, ensuring they fail or define expectations prior to implementation
- Component contracts before parent integration
- Core state mutations before UI bindings
- Verification against independent test criteria before advancing

### Parallel Opportunities

- **Phase 1**: T001 is standalone.
- **Phase 2**: T003 (`useApplications.ts`) can run in parallel with T002 (`application.ts`).
- **Phase 3**: T005 (`VacancyList.test.tsx`) and T006 (`FilterDrawer.test.tsx`) can be written in parallel.
- **Phase 4-8**: Once Phase 3 completes, US3 (Keyboard navigation) and US4 (localStorage persistence) can be executed in parallel as they touch different files (`useKeyboardNavigation.ts` vs `App.tsx`).
- **Phase 9**: T026 (offline tests) and T027 (typecheck) can run in parallel before T028 (`GEMINI.md` update).

---

## Parallel Example: User Story 1

```bash
# Launch test preparation for User Story 1 in parallel:
Task: "Create component tests for toolbar toggle pill states in frontend/tests/components/VacancyList.test.tsx"
Task: "Create component tests for FilterDrawer toggle switch in frontend/tests/components/FilterDrawer.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002 - T004)
3. Complete Phase 3: User Story 1 (T005 - T010)
4. **STOP and VALIDATE**: Verify toolbar toggle pill, FilterDrawer switch, and dynamic net counts on seniority pills and timeframe badges.

### Incremental Delivery

1. **Foundational Increment**: Extend status types with `"offer"` and establish `appliedFingerprintSet`.
2. **MVP Increment (US1)**: Toolbar toggle pill and FilterDrawer switch with dynamic net counts.
3. **Ergonomics Increment (US2 + US3)**: In-flight card collapse (<16ms) and `h`/`H` keyboard shortcut.
4. **Persistence & Data Integrity Increment (US4 + US5)**: `localStorage` hydration and cross-portal deduplication sync.
5. **Recovery Increment (US6)**: Emerald 100% applied empty state with one-click restoration.
6. **Polish Increment (Phase 9)**: 100% offline test suite validation, TypeScript check, and `GEMINI.md` update.
