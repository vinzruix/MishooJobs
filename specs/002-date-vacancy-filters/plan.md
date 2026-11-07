# Implementation Plan: Date-Relevant Vacancy Filters (MishooJobs)

**Branch**: `002-date-vacancy-filters` | **Date**: 2026-11-06 | **Spec**: [specs/002-date-vacancy-filters/spec.md](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/specs/002-date-vacancy-filters/spec.md)

**Input**: Feature specification from `specs/002-date-vacancy-filters/spec.md`

---

## Summary

Enable early-career candidates in Mexico to filter live-aggregated job postings by publication date across cumulative age thresholds ("Cualquier fecha", "Última hora", "Últimas 24 horas", "Últimos 3 días", "Última semana", "Último mes", "Más de 1 mes") with multi-select inclusive union support. Enhance job cards with Mexican Spanish relative timestamps ("Hace 2 horas") and a high-contrast "Nueva" badge (≤ 48 hours), automatically refreshed via a 60-second client-side ticker without network overhead. Provide intelligent recency ordering defaults (≤ 3 days defaults to "Más recientes primero"), URL query synchronization (`?published_within=24h`), and proactive empty-state guidance with one-click reset.

---

## Technical Context

**Language/Version**: Python 3.12+ (verified on 3.14) & TypeScript 5.5+ (Strict Mode) / React 19  
**Primary Dependencies**:  
- **Backend**: FastAPI 0.115+, Pydantic v2, SQLAlchemy 2.0 Async, Alembic, HTTPX, BeautifulSoup4, Bleach, Tenacity  
- **Frontend**: React 19, Vite 6+, Tailwind CSS 3.4+, Dexie.js (v4), Lucide React  
**Storage**:  
- PostgreSQL 15+ (`mishoojobs_db`): `vacancies` table with added `published_at TIMESTAMPTZ NULL` column & recency index `ix_vacancies_published_at`.  
- Client-Side: IndexedDB (`mishoojobs_local_db`) for local pipeline and profile caching; zero candidate PII in PostgreSQL.  
**Testing**:  
- Backend: Pytest with deterministic offline HTML fixtures in `backend/tests/fixtures/`.  
- Frontend: Vitest + React Testing Library for component, hook, and date utility suites.  
**Target Platform**: Evergreen Modern Browsers (Chrome, Firefox, Safari, Edge) & macOS/Linux server runtimes.  
**Project Type**: Web application (FastAPI backend service + React 19 SPA frontend).  
**Performance Goals**:  
- Client-side date filter switching & pagination update < 300ms (SC-001).  
- Single top-level 60-second interval ticker for relative time strings with zero DOM lag (SC-002).  
- Live SSE progressive streaming seamlessly integrates new vacancy batches into active filter counts.  
**Constraints**:  
- Zero mandatory candidate accounts or login walls (Constitution Principle I).  
- Mexican Spanish localization & Mexican Central Time (UTC-6) reference evaluation (Principle II).  
- Midudev-inspired dark mode aesthetic: `zinc-950` root, `zinc-900` cards, `zinc-800` borders, `Geist Mono` typography (Principle IV).  
- 100% offline automated test suite using static fixtures.  
**Scale/Scope**: Real-time aggregation across Computrabajo, Indeed México, and OCC Mundial (~45 live vacancies per search query).

---

## Constitution Check

*GATE: All gates passed prior to Phase 0 and re-evaluated post-Phase 1 design.*

| Principle / Gate | Status | Evaluation Notes |
|------------------|--------|------------------|
| **I. Privacy & Zero Friction** | PASS | Zero candidate accounts or tracking required. Date filter parameters reside purely in URL query params and client memory. PostgreSQL is used strictly for vacancy cache deduplication. |
| **II. Mexican Market Calibration** | PASS | UI and relative date strings are localized in Mexican Spanish (*"Hace unos momentos"*, *"Hace 2 horas"*, *"Hace 1 día"*, *"Fecha no especificada"*). Evaluated against Mexican Central Time (UTC-6). |
| **III. Zero Scope Creep** | PASS | Strictly focuses on publication date filtering, "Nueva" badges, sorting control, and URL sync. No auto-apply bots or external paywalls introduced. |
| **IV. Midudev Aesthetic & Whitelist** | PASS | Strict dark mode styling with `zinc-950/900/800`, Geist Mono typography, high-contrast badges for "Nueva" (emerald) and scams (amber/red). Strict Pydantic v2 schemas and TypeScript strict mode. |
| **V. Cost-Optimized AI & Scraping** | PASS | Deterministic regex date parser in base scraper; zero external paid API keys or unnecessary AI calls for date parsing. |
| **VI. Predatory Postings Shield** | PASS | Date filtering preserves scam detection badges and maintains high visual contrast. |
| **VII. Testing & Quality Gates** | PASS | 100% offline tests with static HTML/JSON fixtures. Live network requests forbidden in test harness. |

---

## Project Structure

### Documentation (this feature)

```text
specs/002-date-vacancy-filters/
├── spec.md              # Feature requirements and clarifications
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0: Technology research & design decisions
├── data-model.md        # Phase 1: Entity definitions & state transitions
├── contracts/           # Phase 1: Interface & schema contracts
│   ├── api-contracts.md # Backend DTO & SSE wire contracts
│   └── ui-contracts.md  # URL query, sorting, and UI component contracts
├── quickstart.md        # Phase 1: Verification scenarios & test guide
└── tasks.md             # Phase 2: Actionable tasks (/speckit-tasks output)
```

### Source Code Layout

```text
backend/
├── alembic/
│   └── versions/
│       └── xxxx_add_published_at_to_vacancies.py # Migration for published_at column
├── src/mishoojobs/
│   ├── models/
│   │   └── vacancy.py              # Add published_at Mapped column + index
│   ├── schemas/
│   │   └── job.py                  # Add published_at to VacancyDTO
│   ├── api/
│   │   └── sse.py                  # Persist & stream published_at in vacancy_batch
│   └── services/
│       └── scrapers/
│           ├── base.py             # parse_mexican_relative_date utility
│           ├── computrabajo.py     # Extract & parse publication date
│           ├── indeed.py           # Extract & parse publication date
│           └── occ.py              # Extract & parse publication date
└── tests/
    ├── fixtures/                   # Static HTML fixtures with date indicators
    └── unit/
        └── test_scrapers.py        # Date parsing & DTO validation tests

frontend/
├── src/
│   ├── types/
│   │   └── job.ts                  # Add published_at, TimeframeId, SortOrder
│   ├── services/
│   │   └── date_utils.ts           # formatMexicanRelativeTime, isNewVacancy, filter logic
│   ├── hooks/
│   │   └── useDateTicker.ts        # 60-second background ticker hook
│   ├── components/
│   │   ├── FilterDrawer.tsx        # "Fecha de Publicación" section with cumulative counts
│   │   ├── VacancyCard.tsx         # Relative timestamp + "Nueva" badge (≤48h)
│   │   └── VacancyList.tsx         # Results header with Sorting Dropdown & Empty State
│   └── App.tsx                     # URL query sync (?published_within=...), filter & sort state
└── tests/
    ├── components/
    │   └── VacancyCard.test.tsx    # Badge & relative time rendering tests
    └── services/
        └── date_utils.test.ts      # Freshness calculation & filter unit tests
```

**Structure Decision**: Standard web application layout with decoupled FastAPI backend (`backend/`) and React 19 Vite frontend (`frontend/`), reusing existing component and service conventions.

---

## Complexity Tracking

*No constitutional violations; architecture strictly follows established project guidelines.*

---

## Implementation Roadmap & Maintenance Tasks

### Phase 1: Backend Storage & Scraper Ingestion
1. Add `published_at` to `JobVacancy` SQLAlchemy model and generate Alembic migration.
2. Add `published_at: Optional[datetime]` to `VacancyDTO` Pydantic schema and update SSE streaming generator.
3. Implement `parse_mexican_relative_date` helper in `AbstractBaseScraper`.
4. Update Computrabajo, Indeed, and OCC scrapers to extract dates from HTML cards and assign `published_at`.
5. Update offline fixtures and write comprehensive unit tests in `test_scrapers.py`.

### Phase 2: Frontend Freshness Utilities & Components
1. Implement `date_utils.ts` with Mexican Spanish relative time formatting, "Nueva" badge eligibility (≤ 48h), and cumulative timeframe matching.
2. Implement `useDateTicker` 60-second ticker hook.
3. Update `VacancyCard.tsx` to render clock icon, localized relative time, and "Nueva" badge.
4. Update `FilterDrawer.tsx` to add "Fecha de Publicación" section with cumulative count badges.
5. Add Sorting dropdown to `VacancyList.tsx` toolbar with smart recency auto-switching (≤ 3 days).
6. Implement empty state guidance with "Limpiar filtro" and "Última semana" recommendation link.

### Phase 3: URL Synchronization & Integration
1. Implement URL query parameter sync for `?published_within=...` supporting comma-separated multi-select and `popstate` browser navigation.
2. Integrate live SSE stream handling so newly arriving listings dynamically update cumulative filter badge counts without resetting scroll position.
3. Write end-to-end component and integration tests in `frontend/tests/`.

### Phase 4: Final Maintenance Task (GEMINI.md Update)
- **Task**: Update [`GEMINI.md`](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/GEMINI.md) with key design decisions and new conventions established by feature `002-date-vacancy-filters`:
  - `[002] Standardize publication dates as UTC datetime (published_at) in VacancyDTO with regex-based Mexican relative date parsing`.
  - `[002] Client-side cumulative date filtering with multi-select inclusive union and 60-second background ticker for relative timestamps and 'Nueva' badges (≤48h)`.
  - `[002] URL query parameter sync (?published_within=...) and smart recency sorting defaulting to 'Más recientes primero' for timeframes ≤ 3 days`.
