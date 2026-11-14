# Tasks: Specific Experience Requirement Display on Vacancy Cards

**Input**: Design documents from `/specs/006-vacancy-card-experience/`  
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [ui-contracts.md](contracts/ui-contracts.md), [quickstart.md](quickstart.md)  
**Tests**: Unit tests in Vitest covering formatting logic and component rendering across all experience levels.  
**Organization**: Grouped by user story to enable independent implementation, testing, and delivery.  

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify frontend workspace environment and test baseline.

- [ ] T001 Verify frontend test suite baseline passes offline via `npm test -- --run` from `frontend/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core formatting utility that all user stories depend on.

**⚠️ CRITICAL**: Must be completed before UI integration.

- [ ] T002 Implement `formatExperienceRequired(years: number): string` utility in `frontend/src/services/date_utils.ts` adhering strictly to Mexican Spanish grammatical rules (`years <= 0` → `"0 años de exp"`, `years === 1` → `"1 año de exp"`, `years >= 2` → `${years} años de exp`)
- [ ] T003 [P] Add unit test suite for `formatExperienceRequired` in `frontend/tests/services/date_utils.test.ts` testing 0 years, 1 year, and multiple years

**Checkpoint**: Foundation ready — UI integration and component testing can proceed.

---

## Phase 3: User Story 1 - Instant Visibility of Required Experience on Every Card (Priority: P1) 🎯 MVP

**Goal**: Every search feed vacancy card visibly displays the specific minimum years of experience required in its metadata row without requiring details modal inspection.

**Independent Test**: Render vacancy cards with various `years_required_min` values and verify that the metadata row displays the formatted experience string directly on the card.

### Tests for User Story 1

- [ ] T004 [US1] Update `frontend/tests/components/VacancyCard.test.tsx` to assert that `VacancyCard` renders `"1 año de exp"` when `years_required_min: 1`

### Implementation for User Story 1

- [ ] T005 [US1] Import `Briefcase` from `lucide-react` and `formatExperienceRequired` from `../services/date_utils` in `frontend/src/components/VacancyCard.tsx`
- [ ] T006 [US1] Render experience metadata item with `Briefcase` icon and formatted text in `frontend/src/components/VacancyCard.tsx` metadata row between Salary and Relative Time per `specs/006-vacancy-card-experience/contracts/ui-contracts.md`

**Checkpoint**: User Story 1 is functional and testable independently as the MVP increment.

---

## Phase 4: User Story 2 - Grammatically Correct Mexican Spanish Localization (Priority: P2)

**Goal**: Ensure all experience counts (0, 1, and N+ years) conform strictly to Mexican Spanish singular/plural grammar with zero unformatted tokens or English labels.

**Independent Test**: Render vacancy cards with `years_required_min: 0`, `years_required_min: 1`, and `years_required_min: 3+` and assert exact text agreement.

### Tests & Implementation for User Story 2

- [ ] T007 [P] [US2] Add component test in `frontend/tests/components/VacancyCard.test.tsx` verifying that a vacancy with `years_required_min: 0` renders `"0 años de exp"`
- [ ] T008 [P] [US2] Add component test in `frontend/tests/components/VacancyCard.test.tsx` verifying that a vacancy with `years_required_min: 3` renders `"3 años de exp"` and `years_required_min: 5` renders `"5 años de exp"`

**Checkpoint**: User Stories 1 and 2 are fully verified with 100% linguistic coverage.

---

## Phase 5: User Story 3 - Visual Density and Layout Integrity Across Viewports (Priority: P2)

**Goal**: Ensure the metadata row wraps gracefully on mobile viewports ($\ge 360\text{px}$) without horizontal scrolling, button overflow, or visual layout clipping.

**Independent Test**: Verify container classes and flex-wrap properties in `VacancyCard.tsx` and assert that metadata items maintain non-overflowing flex wrapping.

### Implementation & Verification for User Story 3

- [ ] T009 [US3] Verify that the metadata container classes (`flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-zinc-400 mb-3`) in `frontend/src/components/VacancyCard.tsx` allow graceful multi-line wrapping on mobile viewports without pushing action buttons outside card boundaries
- [ ] T010 [US3] Add a component test in `frontend/tests/components/VacancyCard.test.tsx` validating that the experience metadata element includes `font-mono text-xs text-zinc-300` styling and contains the `lucide-briefcase` icon

**Checkpoint**: All three user stories are functionally and visually complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end test verification and architectural conventions documentation.

- [ ] T011 Run complete frontend test suite offline via `npm test -- --run` from `frontend/` to ensure zero regressions
- [ ] T012 Validate end-to-end verification checklist defined in `specs/006-vacancy-card-experience/quickstart.md`
- [ ] T013 Update [`GEMINI.md`](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/GEMINI.md) Section 7 (Architectural Decisions & Conventions Log) with: `[006] Surface numerical years_required_min on VacancyCard metadata row with localized Mexican Spanish agreement (0 años, 1 año, N años) and Briefcase icon without modal inspection.`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup (T001) — BLOCKS all user story UI work.
- **User Story 1 (Phase 3)**: Depends on Foundational (T002, T003). Deliverable as MVP.
- **User Story 2 (Phase 4)**: Depends on US1 component integration (T005, T006).
- **User Story 3 (Phase 5)**: Depends on US1 component integration (T005, T006).
- **Polish (Phase 6)**: Depends on all user stories (T001-T010) being complete.

### Parallel Opportunities

- Within Phase 2: T003 (unit tests) can run in parallel with/after T002.
- Within Phase 4: T007 and T008 can be written in parallel.
- Phases 4 and 5 can be executed in parallel once Phase 3 completes.

---

## Parallel Execution Example: User Story 2

```bash
# Add linguistic unit tests in parallel:
Task: "Add component test in frontend/tests/components/VacancyCard.test.tsx for 0 años"
Task: "Add component test in frontend/tests/components/VacancyCard.test.tsx for 3+ años"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1 (T001) & Phase 2 (T002, T003).
2. Complete Phase 3 (T004, T005, T006).
3. Validate User Story 1 independently in browser/tests.

### Incremental Delivery
1. Add User Story 2 linguistic tests (T007, T008) to guarantee 0, 1, and N+ edge cases.
2. Add User Story 3 responsive checks (T009, T010).
3. Execute Polish phase (T011, T012, T013) to log conventions in `GEMINI.md`.
