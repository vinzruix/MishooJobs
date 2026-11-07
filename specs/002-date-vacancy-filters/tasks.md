---
description: "Task list for Date-Relevant Vacancy Filters (MishooJobs)"
---

# Tasks: Date-Relevant Vacancy Filters (MishooJobs)

**Input**: Design documents from `/specs/002-date-vacancy-filters/` (`spec.md`, `plan.md`, `data-model.md`, `contracts/`, `research.md`, `quickstart.md`)  
**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md, contracts/  
**Tests**: Unit and component tests are included per feature specifications and quickstart validation scenarios.  
**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], [US3])
- Clear file paths and verbatim data constraints are included in each description.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Update shared schemas, entities, and type contracts across backend and frontend.

- [ ] T001 Update frontend TypeScript interfaces in `frontend/src/types/job.ts` to add nullable `published_at?: string | null;`, timeframe enum `TimeframeId = "all" | "1h" | "24h" | "3d" | "7d" | "30d" | "30d_plus"`, sort enum `SortOrder = "recent" | "compatibility" | "relevance"`, and `PublicationTimeframe` interface (`id: TimeframeId; label: string; description: string; maxAgeMs?: number; minAgeMs?: number; count: number;`).
- [ ] T002 [P] Update backend Pydantic schema in `backend/src/mishoojobs/schemas/job.py` to add `published_at: Optional[datetime] = Field(default=None, description="Original publication timestamp in UTC. Null if unparseable or missing from portal.")` ensuring ISO 8601 UTC serialization in `VacancyDTO`.
- [ ] T003 [P] Update SQLAlchemy entity in `backend/src/mishoojobs/models/vacancy.py` to add `published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)` for recency indexing.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database schema migration and backend scraper ingestion infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 Create and execute Alembic database migration in `backend/alembic/versions/xxxx_add_published_at_to_vacancies.py` adding column `published_at TIMESTAMPTZ NULL` and index `ix_vacancies_published_at` to table `vacancies`.
- [ ] T005 [P] Implement `parse_mexican_relative_date(raw_text: Optional[str], reference_dt: Optional[datetime] = None) -> Optional[datetime]` regex parser in `backend/src/mishoojobs/services/scrapers/base.py` supporting Mexican terms (`minuto`, `un momento`, `hora`, `d[ií]a`, `hoy`, `ayer`, `semana`, `mes`, `m[aá]s de un mes`) returning UTC datetime or `None` if unparseable/absent.
- [ ] T006 [P] Update Computrabajo scraper in `backend/src/mishoojobs/services/scrapers/computrabajo.py` to extract raw publication date strings, parse via `parse_mexican_relative_date`, and assign `published_at`.
- [ ] T007 [P] Update Indeed scraper in `backend/src/mishoojobs/services/scrapers/indeed.py` to extract raw publication date strings, parse via `parse_mexican_relative_date`, and assign `published_at`.
- [ ] T008 [P] Update OCC scraper in `backend/src/mishoojobs/services/scrapers/occ.py` to extract raw publication date strings, parse via `parse_mexican_relative_date`, and assign `published_at`.
- [ ] T009 Update SSE event generator in `backend/src/mishoojobs/api/sse.py` to ensure `published_at` is preserved during vacancy upsert and transmitted in `vacancy_batch` event data.
- [ ] T010 [P] Add backend unit tests in `backend/tests/unit/test_scrapers.py` verifying `parse_mexican_relative_date` with fixed reference datetime (`datetime(2026, 11, 6, 12, 0, 0, tzinfo=timezone.utc)`), null handling, and date extraction across Computrabajo, Indeed, and OCC HTML fixtures.

**Checkpoint**: Foundation ready - backend ingests, stores, and streams verified `published_at` timestamps, database is migrated, and frontend contracts are declared.

---

## Phase 3: User Story 1 - Instant Filtering by Publication Date Preserving Search Context (Priority: P1) 🎯 MVP

**Goal**: Allow candidates to filter live vacancies by cumulative publication date thresholds ("Cualquier fecha", "Última hora", "Últimas 24 horas", "Últimos 3 días", "Última semana", "Último mes", "Más de 1 mes") with multi-select inclusive union, resetting pagination to page 1 while preserving active search query, location, modality, and category. Postings with `published_at == null` must strictly appear only under "Cualquier fecha".

**Independent Test**: Conduct a search with existing keywords and filters, apply different date filter options ("Últimas 24 horas", "Última semana"). Verify results update immediately (< 300ms), pagination resets to page 1, and active keywords/filters remain intact.

### Tests for User Story 1
- [ ] T011 [P] [US1] Unit tests for date filtering logic and cumulative threshold evaluation in `frontend/tests/services/date_utils.test.ts` covering cumulative windows (`maxAgeMs`, `minAgeMs`), multi-select union, and exclusion of `published_at == null` from specific timeframes.

### Implementation for User Story 1
- [ ] T012 [P] [US1] Implement `TIMEFRAMES` configuration and `filterVacanciesByTimeframes(vacancies: Vacancy[], timeframes: TimeframeId[], now: Date): Vacancy[]` in `frontend/src/services/date_utils.ts` adhering to duration rules: `1h` (`ageMs <= 3,600,000`), `24h` (`ageMs <= 86,400,000`), `3d` (`ageMs <= 259,200,000`), `7d` (`ageMs <= 604,800,000`), `30d` (`ageMs <= 2,592,000,000`), `30d_plus` (`ageMs > 2,592,000,000`), and `all` (unbounded, includes null dates).
- [ ] T013 [US1] Update `frontend/src/components/FilterDrawer.tsx` to add "Fecha de Publicación" section with timeframe options, handling multi-select inclusive union, unchecking "Cualquier fecha" when selecting specific timeframes, and resetting other options when "Cualquier fecha" is selected.
- [ ] T014 [US1] Update filter state handling in `frontend/src/App.tsx` to maintain `timeframes: TimeframeId[]` (defaulting to `["all"]`), filter the rendered vacancies using `filterVacanciesByTimeframes`, reset pagination to page 1 on timeframe change, and preserve active query, location, modality, and category.

**Checkpoint**: User Story 1 is functional and testable independently (MVP ready!).

---

## Phase 4: User Story 2 - Visual Freshness Badges & Relative Timestamps on Vacancy Cards (Priority: P1)

**Goal**: Display localized Mexican Spanish relative timestamps ("Hace unos momentos", "Hace 2 horas", "Hace 1 día", "Fecha no especificada") and high-contrast "Nueva" badge (published ≤ 48 hours) on vacancy cards, updating automatically every 60 seconds without full list re-renders.

**Independent Test**: View vacancy cards with varied publication dates. Confirm that relative strings match elapsed time, postings published ≤ 48 hours show the "Nueva" badge, and after 60 seconds the timestamps update automatically.

### Tests for User Story 2
- [ ] T015 [P] [US2] Unit tests for `formatMexicanRelativeTime` and `isNewVacancy` in `frontend/tests/services/date_utils.test.ts` asserting exact string mappings and 48-hour boundary threshold (`(now - published_at) <= 48 * 3600 * 1000`).
- [ ] T016 [P] [US2] Component tests in `frontend/tests/components/VacancyCard.test.tsx` verifying rendering of `Clock` icon, relative time text, and emerald `Nueva` badge presence for fresh vacancies and absence for older/null postings.

### Implementation for User Story 2
- [ ] T017 [P] [US2] Implement `formatMexicanRelativeTime(publishedAt: string | null | undefined, now: Date): string` and `isNewVacancy(publishedAt: string | null | undefined, now: Date): boolean` in `frontend/src/services/date_utils.ts` following Mexican Spanish intervals (`<60s` -> `"Hace unos momentos"`, `<3600s` -> `"Hace N minuto(s)"`, `<86400s` -> `"Hace N hora(s)"`, `<=48h` -> `"Hace N día(s)"`, `<7d` -> `"Hace N día(s)"`, `<30d` -> `"Hace N semana(s)"`, `>=30d` -> `"Hace más de 1 mes"`, null -> `"Fecha no especificada"`).
- [ ] T018 [P] [US2] Implement `useDateTicker(intervalMs?: number): Date` custom hook in `frontend/src/hooks/useDateTicker.ts` running a single 60-second background `setInterval` emitting updated reference time.
- [ ] T019 [US2] Update `frontend/src/components/VacancyCard.tsx` to accept or compute `relative_text` and `is_new`, rendering the clock icon, relative time string, and high-contrast `Nueva` badge (`bg-emerald-950/80 text-emerald-400 border border-emerald-600/80`).
- [ ] T020 [US2] Integrate `useDateTicker` in `frontend/src/App.tsx` and pass current reference time down to `VacancyList` and `VacancyCard` for 60-second reactive updates without re-triggering network or stream requests.

**Checkpoint**: User Stories 1 AND 2 work together independently.

---

## Phase 5: User Story 3 - Available Job Counts & Smart Recency Ordering (Priority: P2)

**Goal**: Display cumulative vacancy counts next to each date filter option based on current search context, and provide a visible sorting dropdown in the results toolbar with smart recency auto-switching (timeframes ≤ 3 days automatically select "Más recientes primero" unless user explicitly overrode sorting).

**Independent Test**: Conduct a search, verify count badges next to each filter option match matching vacancies. Select "Últimos 3 días" and verify sorting dropdown automatically switches to "Más recientes primero". Manually select "Mayor compatibilidad" and verify subsequent date filter changes do not override user choice.

### Tests for User Story 3
- [ ] T021 [P] [US3] Unit tests for cumulative count calculation and vacancy sorting functions (`recent`, `compatibility`, `relevance`) in `frontend/tests/services/date_utils.test.ts`.

### Implementation for User Story 3
- [ ] T022 [P] [US3] Implement `calculateTimeframeCount(vacancies: Vacancy[], timeframe: TimeframeConfig, now: Date): number` and `sortVacancies(vacancies: Vacancy[], sortOrder: SortOrder): Vacancy[]` in `frontend/src/services/date_utils.ts` handling `recent` (descending `published_at`, nulls last), `compatibility` (descending `fitScore`, unscored last), and `relevance` (original arrival order).
- [ ] T023 [US3] Update `frontend/src/components/FilterDrawer.tsx` to compute and display cumulative count badges beside each date filter label (e.g., `"Últimas 24 horas (12)"`).
- [ ] T024 [US3] Add sorting dropdown control to results toolbar in `frontend/src/components/VacancyList.tsx` offering options: `"Más recientes primero"` (`recent`), `"Mayor compatibilidad (Fit Score)"` (`compatibility`), and `"Relevancia por defecto"` (`relevance`).
- [ ] T025 [US3] Integrate sorting state in `frontend/src/App.tsx` managing `sortOrder: SortOrder` and `isSortUserOverridden: boolean`, automatically setting `sortOrder` to `"recent"` when timeframes contain `1h`, `24h`, or `3d` and `isSortUserOverridden === false`, and passing sorted list to `VacancyList`.

**Checkpoint**: User Stories 1, 2, and 3 work seamlessly.

---

## Phase 6: User Story 4 - Shareable & Bookmarkable URL Synchronization (Priority: P2)

**Goal**: Synchronize the active date filter with URL query parameter `?published_within=...` (supporting single tokens `24h`, comma-separated `1h,3d`, and fallback to "all" for invalid tokens), supporting browser back/forward `popstate` navigation and direct link opening.

**Independent Test**: Select "Últimas 24 horas", copy URL, open in new tab/incognito, verify "Últimas 24 horas" is selected. Use browser Back/Forward to verify state synchronizes with URL.

### Tests for User Story 4
- [ ] T026 [P] [US4] Unit tests for URL parameter serialization and parsing (`parseTimeframesFromQuery`, `serializeTimeframesToQuery`) in `frontend/tests/services/date_utils.test.ts` verifying comma-separated multi-select, invalid token fallback to `["all"]`, and omission when `all`.

### Implementation for User Story 4
- [ ] T027 [P] [US4] Implement `parseTimeframesFromQuery(queryValue: string | null): TimeframeId[]` and `serializeTimeframesToQuery(timeframes: TimeframeId[]): string | null` in `frontend/src/services/date_utils.ts` validating tokens against `TimeframeId` values.
- [ ] T028 [US4] Implement URL synchronization and `popstate` listener in `frontend/src/App.tsx` initializing `timeframes` from `published_within` query parameter on mount, updating `window.history.replaceState` on timeframe change without full-page reloads, and handling browser back/forward navigation.

**Checkpoint**: User Story 4 complete - URL query synchronization and history navigation verified.

---

## Phase 7: User Story 5 - Empty State Guidance & One-Click Filter Reset (Priority: P3)

**Goal**: When a date filter yields zero vacancies, display an informative empty state suggesting expansion to "Última semana" and a one-click "Limpiar filtro de fecha" button that resets date filter to "Cualquier fecha" and clears `published_within` from URL.

**Independent Test**: Apply a restrictive date filter with 0 results. Confirm friendly empty state displays with recommendation link and "Limpiar filtro de fecha" button. Click "Ver vacantes de la última semana" to switch filter to 7 days, or click "Limpiar filtro de fecha" to reset to "Cualquier fecha".

### Tests for User Story 5
- [ ] T029 [P] [US5] Component tests in `frontend/tests/components/VacancyList.test.tsx` verifying empty state rendering when date filter active with 0 results, recommendation link click callback, and reset button click callback.

### Implementation for User Story 5
- [ ] T030 [US5] Implement date-filter-specific empty state in `frontend/src/components/VacancyList.tsx` showing `Clock` icon, message `"No se encontraron vacantes para este marco de tiempo"`, recommendation link `"Última semana"`, and `"Limpiar filtro de fecha"` button with `RotateCcw` icon.
- [ ] T031 [US5] Wire empty state callbacks in `frontend/src/App.tsx` so clicking `"Limpiar filtro de fecha"` resets `timeframes` to `["all"]` and removes `published_within` from URL, and clicking `"Última semana"` updates `timeframes` to `["7d"]`.

**Checkpoint**: All user stories functional and independently testable.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Full regression testing, documentation updates, and architectural governance synchronization.

- [ ] T032 [P] Run full backend offline test suite `pytest backend/tests/ -v` and frontend test suite `npm test -- --run` validating 100% test pass rate with zero network calls.
- [ ] T033 Execute manual interactive verification scenarios per `specs/002-date-vacancy-filters/quickstart.md` validating live SSE stream compatibility, sorting behavior, and mobile drawer responsiveness.
- [ ] T034 [P] Update verification notes and test evidence in `specs/002-date-vacancy-filters/quickstart.md`.
- [ ] T035 Update `GEMINI.md` with key architectural decisions and new conventions established by feature `002-date-vacancy-filters`:
  - `[002] Standardize publication dates as UTC datetime (published_at) in VacancyDTO with regex-based Mexican relative date parsing`.
  - `[002] Client-side cumulative date filtering with multi-select inclusive union and 60-second background ticker for relative timestamps and 'Nueva' badges (≤48h)`.
  - `[002] URL query parameter sync (?published_within=...) and smart recency sorting defaulting to 'Más recientes primero' for timeframes ≤ 3 days`.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (BLOCKING)
    ↓
Phase 3: User Story 1 (P1 - MVP) ──┬──→ Phase 4: User Story 2 (P1)
                                   ├──→ Phase 5: User Story 3 (P2)
                                   ├──→ Phase 6: User Story 4 (P2)
                                   └──→ Phase 7: User Story 5 (P3)
                                            ↓
                               Phase 8: Polish & Maintenance
```

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**:
  - **User Story 1 (P1)**: Can begin immediately after Foundational (Phase 2). Establishes core filtering mechanism.
  - **User Story 2 (P1)**: Depends on Foundational (Phase 2). Can run in parallel with US1 or sequentially.
  - **User Story 3 (P2)**: Depends on US1 (filtering foundation) and US2 (timestamps) for counts and recency sort.
  - **User Story 4 (P2)**: Depends on US1 (timeframe state definition) for URL query sync.
  - **User Story 5 (P3)**: Depends on US1 (empty result state on date filter) for reset handling.
- **Polish (Phase 8)**: Depends on completion of all desired user stories.

---

## Parallel Execution Opportunities

### Phase 1 & Phase 2 Parallel Tasks
```bash
# Setup parallel tasks:
Task: "T002 [P] Update backend Pydantic schema in backend/src/mishoojobs/schemas/job.py"
Task: "T003 [P] Update SQLAlchemy entity in backend/src/mishoojobs/models/vacancy.py"

# Foundational scrapers & tests parallel tasks:
Task: "T005 [P] Implement parse_mexican_relative_date in backend/src/mishoojobs/services/scrapers/base.py"
Task: "T006 [P] Update Computrabajo scraper in backend/src/mishoojobs/services/scrapers/computrabajo.py"
Task: "T007 [P] Update Indeed scraper in backend/src/mishoojobs/services/scrapers/indeed.py"
Task: "T008 [P] Update OCC scraper in backend/src/mishoojobs/services/scrapers/occ.py"
Task: "T010 [P] Add backend unit tests in backend/tests/unit/test_scrapers.py"
```

### User Story 1 Parallel Tasks
```bash
# Launch test and utility implementation together:
Task: "T011 [P] [US1] Unit tests for date filtering logic in frontend/tests/services/date_utils.test.ts"
Task: "T012 [P] [US1] Implement TIMEFRAMES and filterVacanciesByTimeframes in frontend/src/services/date_utils.ts"
```

### User Story 2 Parallel Tasks
```bash
# Launch utility tests, component tests, and hook together:
Task: "T015 [P] [US2] Unit tests in frontend/tests/services/date_utils.test.ts"
Task: "T016 [P] [US2] Component tests in frontend/tests/components/VacancyCard.test.tsx"
Task: "T017 [P] [US2] Implement formatMexicanRelativeTime and isNewVacancy in frontend/src/services/date_utils.ts"
Task: "T018 [P] [US2] Implement useDateTicker in frontend/src/hooks/useDateTicker.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete **Phase 1: Setup** (DTOs, database model, frontend interfaces).
2. Complete **Phase 2: Foundational** (migration, scraper parsing, unit tests).
3. Complete **Phase 3: User Story 1** (date filtering, FilterDrawer section, App state).
4. **STOP and VALIDATE**: Verify live search with date filters works independently without errors.

### Incremental Delivery
1. Foundation Complete → Backend extracts and exposes `published_at`.
2. Add **User Story 1** → Instant date filtering in FilterDrawer (MVP).
3. Add **User Story 2** → Human relative timestamps & "Nueva" badges (≤ 48h) with 60s ticker.
4. Add **User Story 3** → Available job counts & smart recency ordering.
5. Add **User Story 4** → URL query string sync (`?published_within=...`) & browser history.
6. Add **User Story 5** → Empty state guidance & "Limpiar filtro" quick action.
7. Complete **Phase 8** → Run offline test suites and update `GEMINI.md`.
