---

description: "Task list for Custom Brand Logo & \"Primer Empleo\" Label Standardization"
---

# Tasks: Custom Brand Logo & "Primer Empleo" Label Standardization

**Input**: Design documents from `/specs/009-custom-logo-primer-empleo/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/brand-header-contract.md](./contracts/brand-header-contract.md), [contracts/primer-empleo-normalization-contract.md](./contracts/primer-empleo-normalization-contract.md)

**Tests**: Included where explicitly specified in `plan.md` and `quickstart.md` (100% offline Vitest + Pytest verification).

**Organization**: Tasks are grouped by user story (`US1`, `US2`) so each increment can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`)
- Every task includes exact file paths and constraint details from `data-model.md` and `contracts/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize TypeScript asset typing and public static asset directory required by the frontend build.

- [ ] T001 Create `frontend/src/vite-env.d.ts` containing `/// <reference types="vite/client" />` so TypeScript strict mode (`noImplicitAny: true`) resolves static `.png` asset imports
- [ ] T002 [P] Create `frontend/public/` directory to serve static browser favicons (`/favicon.svg` and `/favicon.png`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Confirm zero schema or migration dependencies block parallel execution of US1 and US2.

> **Note**: Per `specs/009-custom-logo-primer-empleo/data-model.md`, this feature requires zero PostgreSQL schema migrations and zero Dexie.js IndexedDB version upgrades. Once Phase 1 (`T001`–`T002`) completes, **User Story 1** and **User Story 2** have zero overlapping source files and can proceed in parallel.

---

## Phase 3: User Story 1 - Personalized MishooJobs Mascot Logo (Priority: P1) 🎯 MVP

**Goal**: Replace generic placeholder icons (`Briefcase` in header and `/vite.svg` favicon) with the cleaned custom suited black cat mascot inside a subtle light rounded-square badge, and make the header brand block navigate back to `"Vacantes"` from any tab.

**Independent Test**: Load any view (`Vacantes`, `Postulaciones`, `CVs`, or `LiveCVViewer`) on `375px` mobile and `1440px` desktop viewports; verify the cleaned suited cat mascot appears inside the light bordered badge beside `"MishooJobs"` with zero checkerboard or overlay toolbar artifacts, clicking the brand returns to `"Vacantes"`, and the browser tab displays the light-backed mascot favicon clearly on both light and dark themes.

### Implementation for User Story 1

- [ ] T003 [US1] Isolate and clean the suited black cat mascot from `specs/009-custom-logo-primer-empleo/reference-logo.png` into `frontend/src/assets/mishoojobs-logo.png` (1:1 square transparent RGBA PNG, `256x256` or `512x512`, true alpha transparency, zero grey/white checkerboard, zero top-right floating UI toolbar, and cleanly reconstructed right ear tip)
- [ ] T004 [US1] Generate light-backed contrast-safe favicons `frontend/public/favicon.svg` (`viewBox="0 0 64 64"`, `#FFFFFF`/`#F8FAFC` rounded-square badge with `rx="14"`, `1.5px` `#E2E8F0` border, and embedded base64 data URI of `frontend/src/assets/mishoojobs-logo.png`) and `frontend/public/favicon.png` (`64x64` RGBA PNG with matching rounded-square light backing badge) (depends on T003)
- [ ] T005 [P] [US1] Update `frontend/index.html` to remove `<link rel="icon" type="image/svg+xml" href="/vite.svg" />` and declare `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` and `<link rel="icon" type="image/png" href="/favicon.png" />` (depends on T004)
- [ ] T006 [US1] Update `frontend/src/components/Header.tsx` to remove `Briefcase`, import `mishooLogo` from `../assets/mishoojobs-logo.png`, render the mascot inside a light rounded-square badge (`w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs overflow-hidden flex items-center justify-center shrink-0`) with `<img src={mishooLogo} alt="Logo de MishooJobs" className="w-full h-full object-contain" />`, and wrap the badge + `"MishooJobs"` wordmark in `<button type="button" data-testid="brand-home-btn" aria-label="MishooJobs - Ir a Vacantes" onClick={() => setActiveTab("search")}>` with `shrink-0`, `transition-transform duration-150 ease-out active:scale-[0.98]`, and `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 rounded-xl` (depends on T001, T003)

### Tests for User Story 1

- [ ] T007 [P] [US1] Create `frontend/tests/components/Header.test.tsx` verifying `<img>` mascot logo (`alt="Logo de MishooJobs"`), absence of legacy `Briefcase` SVG, `brand-home-btn` click invoking `setActiveTab("search")` from `"pipeline"` and `"resumes"`, and `shrink-0` layout stability (depends on T006)
- [ ] T008 [P] [US1] Update `frontend/tests/App.test.tsx` to verify clicking `brand-home-btn` from `"Postulaciones"` or `"CVs"` navigates directly back to the `"Vacantes"` view (depends on T006)

**Checkpoint**: User Story 1 is complete and independently verifiable (header mascot badge, home navigation, and browser favicons).

---

## Phase 4: User Story 2 - Standardize "Primer Empleo" Labels Across All Views (Priority: P1)

**Goal**: Standardize every user-facing label, AI prompt reference, and cached/fresh evaluation or audit output from `"Primer Empleo Real"` (case-insensitive) to `"Primer Empleo"` while preserving internal `"primer_empleo"` keys, `?seniority=primer_empleo` URL sync, live facet counters, and `"0 años verificados"` subtext.

**Independent Test**: Inspect `FilterToolbar`, `PastelMetricGrid`, and `VacancyDetailPane` (plus mobile bottom sheet) for a `primer_empleo` vacancy, and verify offline Vitest + Pytest suites confirm zero occurrences of `"Primer Empleo Real"` (any casing) in UI labels, AI prompts, and cached/fresh API responses while `primer_empleo` filtering and sorting behave identically.

### Implementation for User Story 2

- [ ] T009 [P] [US2] Update `SENIORITY_OPTIONS` in `frontend/src/components/FilterToolbar.tsx` so the `id: "primer_empleo"` option uses `label: "Primer Empleo"` (preserving `isHighlight: true`, live facet counter, and `?seniority=primer_empleo` emission)
- [ ] T010 [P] [US2] Update `buildPastelMetrics` in `frontend/src/components/PastelMetricGrid.tsx` so `case "primer_empleo":` sets `seniorityValue = "Primer Empleo"` while preserving `senioritySubtext = "0 años verificados"` and `theme: "purple"`
- [ ] T011 [P] [US2] Create `frontend/src/services/text_normalizer.ts` exporting `normalizeSeniorityDisplayText(text?: string | null): string` returning `""` for null/undefined/empty inputs and replacing `/\bprimer\s+empleo\s+real\b/gi` with `"Primer Empleo"`
- [ ] T012 [US2] Update `frontend/src/components/VacancyDetailPane.tsx` to import and apply `normalizeSeniorityDisplayText` when rendering `auditResult?.reasoning || vacancy.reasoning`, `evaluation.role_readiness_summary`, and `evaluation.actionable_advice` (depends on T011)
- [ ] T013 [P] [US2] Update `backend/src/mishoojobs/services/agy_ai_client.py` to change `AgyAIClient.AUDIT_PROMPT_TEMPLATE` from `'Primer Empleo Real (0 Exp)'` to `'Primer Empleo (0 Exp)'`, add `normalize_primer_empleo_text(text: str) -> str` using `re.sub(r"\bprimer\s+empleo\s+real\b", "Primer Empleo", text, flags=re.IGNORECASE)`, and apply it inside `AgyAIClient.clean_json_output` (`role_readiness_summary`, `actionable_advice`) and `AgyAIClient.clean_seniority_audit_output` (`reasoning`)
- [ ] T014 [US2] Update `backend/src/mishoojobs/api/routes/vacancies.py` to import and apply `normalize_primer_empleo_text` on both PostgreSQL cache-hit and fresh responses in `evaluate_vacancy` (`role_readiness_summary`, `actionable_advice`, and `seniority_audit.reasoning`) and `audit_vacancy_seniority` (`reasoning`) without mutating stored cache keys (depends on T013)

### Tests for User Story 2

- [ ] T015 [P] [US2] Update `frontend/tests/components/FilterToolbar.test.tsx`, `frontend/tests/components/PastelMetricGrid.test.tsx`, `frontend/tests/components/VacancyList.test.tsx`, `frontend/tests/components/VacancyCard.test.tsx`, and `frontend/tests/App.test.tsx` to assert `"Primer Empleo"` instead of `"Primer Empleo Real"` while verifying `"0 años verificados"` and `primer_empleo` filter behavior (depends on T009, T010)
- [ ] T016 [P] [US2] Update `frontend/tests/components/VacancyDetailPane.test.tsx` (and add unit assertions for `frontend/src/services/text_normalizer.ts`) to verify case-insensitive normalization of `"Primer Empleo Real"`, `"Primer empleo real"`, and `"PRIMER EMPLEO REAL"` to `"Primer Empleo"` in rendered audit reasoning and AI evaluation summary/advice (depends on T011, T012)
- [ ] T017 [P] [US2] Update `backend/tests/integration/test_ai_evaluation.py` and `backend/tests/integration/test_seniority_audit_api.py` (100% offline) to verify `AUDIT_PROMPT_TEMPLATE` uses `'Primer Empleo (0 Exp)'` and cached `AIEvaluationCache` / `JobVacancy` records containing `"Primer Empleo Real"` (mixed/upper/lower case) normalize to `"Primer Empleo"` in API responses (depends on T013, T014)

**Checkpoint**: User Story 2 is complete and independently verifiable across UI controls, detail panes, AI prompts, and cached backend responses.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Repository-wide audit, offline suite verification, responsive/visual QA, and mandatory constitution documentation update.

- [ ] T018 [P] Run static source audits from `specs/009-custom-logo-primer-empleo/quickstart.md` (`grep` for `vite.svg` in `frontend/` and case-insensitive `"primer empleo real"` in `frontend/src/` and `backend/src/`) to confirm zero stale user-facing occurrences remain
- [ ] T019 Run full offline test and build verification (`cd frontend && npm test -- --run && npx tsc --noEmit && npm run build` and `.venv/bin/pytest backend/tests/ -v`) (depends on T007, T008, T015, T016, T017)
- [ ] T020 Visually inspect rendered mascot badge, light-backed favicons across light/dark browser tab contexts, and `375px` mobile / `1440px` desktop header responsiveness (`break-ui` edge cases) to confirm zero checkerboard, screenshot overlay, clipping, or layout shift (depends on T019)
- [ ] T021 Update `GEMINI.md` Architectural Decisions & Conventions Log with concise `[009]` entries documenting the custom light-backed mascot header/favicon convention and standardized `"Primer Empleo"` output normalization (depends on T019)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately (`T001`, `T002` in parallel).
- **Foundational (Phase 2)**: Zero schema or migration blockers; completes immediately once Phase 1 finishes.
- **User Story 1 (Phase 3)**: Depends on Phase 1 (`T001`, `T002`). Within US1: `T003` → `T004` → `T005`; `T001` + `T003` → `T006` → `T007`, `T008`.
- **User Story 2 (Phase 4)**: Independent of US1 (only `frontend/tests/App.test.tsx` overlaps with `T008` in tests, so run `T008` and `T015` sequentially on `App.test.tsx`). Within US2: `T009`, `T010`, `T011`, `T013` are fully parallel; `T011` → `T012`; `T013` → `T014`; `T015`, `T016`, `T017` follow their respective implementation tasks.
- **Polish (Phase 5)**: Depends on completion of US1 and US2 (`T018` → `T019` → `T020`, `T021`).

### Parallel Opportunities

- **Cross-Story Parallelism**: After `T001`–`T002`, Developer A can execute User Story 1 (`T003`–`T007`) while Developer B executes User Story 2 (`T009`–`T017`), coordinating only on `frontend/tests/App.test.tsx` (`T008` / `T015`).
- **Within User Story 2**: `T009` (`FilterToolbar.tsx`), `T010` (`PastelMetricGrid.tsx`), `T011` (`text_normalizer.ts`), and `T013` (`agy_ai_client.py`) touch four separate files and can be implemented simultaneously.

---

## Parallel Example: User Story 2

```bash
# Launch all independent US2 edits in parallel:
Task: "T009 Update FilterToolbar.tsx SENIORITY_OPTIONS label to 'Primer Empleo'"
Task: "T010 Update PastelMetricGrid.tsx buildPastelMetrics label to 'Primer Empleo'"
Task: "T011 Create frontend/src/services/text_normalizer.ts"
Task: "T013 Update backend/src/mishoojobs/services/agy_ai_client.py prompt & normalizer"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2 — Both P1)

1. Complete **Phase 1: Setup** (`T001`–`T002`).
2. Deliver **User Story 1** (`T003`–`T008`): clean mascot brand asset, light-backed favicons, interactive header logo button, and header/app tests.
3. Deliver **User Story 2** (`T009`–`T017`): `"Primer Empleo"` label updates, client/server case-insensitive normalization for cached outputs, and Vitest/Pytest verification.
4. Execute **Phase 5: Polish** (`T018`–`T021`): static grep audit, full offline test/build gate, visual/responsive QA, and `GEMINI.md` update.
