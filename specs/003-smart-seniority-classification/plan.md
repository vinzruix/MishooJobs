# Implementation Plan: Smart Seniority Classification & "First REAL Job" Detection

**Branch**: `003-smart-seniority-classification` | **Date**: 2026-11-07 | **Spec**: [spec.md](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/specs/003-smart-seniority-classification/spec.md)

**Input**: Feature specification from `/specs/003-smart-seniority-classification/spec.md`

---

## Summary

Replace legacy verbose student tags (`residencias`, `dualidad`, `servicio_social`, `intern`, `becario`) and the legacy `category` attribute completely across the full stack with a unified 5-tier experience taxonomy (`pasantia`, `primer_empleo`, `junior`, `mid`, `senior`). Implement a two-step hybrid classification workflow:
1. **Step 1 (Deterministic Fast-Pass)**: In-flight regex pattern matching executed during multi-portal scraping and SSE streaming, instantly assigning structured seniority attributes, live counts, and discrepancy flags ("Fake Junior" shield) without delaying live stream delivery.
2. **Step 2 (Deep AI Audit)**: On-demand semantic audit executed via the local Antigravity CLI (`agy`) when a candidate inspects vacancy details, confirming actual years of experience required, formal employment status, and classification reasoning, with permanent PostgreSQL caching by vacancy fingerprint.

---

## Technical Context

**Language/Version**: Python 3.12+ (verified 3.14 on macOS) backend, TypeScript 5.5+ (Strict Mode) frontend.  
**Primary Dependencies**:
- Backend: FastAPI 0.115+, Pydantic v2, SQLAlchemy 2.0 Async, Alembic, HTTPX, BeautifulSoup4, Bleach.
- Frontend: React 19, Vite, Tailwind CSS 3.4+, Dexie.js (IndexedDB), Lucide React.
- AI Orchestration: Antigravity CLI (`agy`) local subprocess execution (Zero external paid Gemini API keys).  
**Storage**: PostgreSQL 15+ (`vacancies`, `ai_evaluation_cache`, `scam_assessments`) for anonymous vacancy data and audit cache; browser `IndexedDB` (`mishoojobs_local_db`) for candidate resumes and applications. Zero candidate PII in PostgreSQL.  
**Testing**: 100% offline deterministic test suites with static HTML/JSON fixtures via `pytest` and `vitest`.  
**Target Platform**: Responsive Web Application (FastAPI backend + React SPA).  
**Performance Goals**:
- Instant client-side filtering (< 100ms) across 5 seniority tiers.
- Non-blocking SSE streaming with sub-millisecond fast-pass pre-classification.
- Zero-wait on-demand modal loading for previously audited vacancies via PostgreSQL caching.  
**Constraints**:
- Absolute candidate privacy (no user accounts, no login walls, zero candidate tables in database).
- Zero paid external API keys (`agy` CLI orchestration only).
- Mexican Spanish UI and labor market localization (MXN currency default).  
**Scale/Scope**: 5 seniority tiers, 3 primary job portals (Computrabajo, OCC, Indeed), full-stack purge of legacy `category`.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Rule | Compliance Status | Justification / Implementation Evidence |
|---|---|---|
| **Principle I: Privacy & Zero Friction** | PASS | Zero candidate registration or auth. Candidate resumes remain in browser IndexedDB. PostgreSQL stores only vacancy fingerprints, verified links, scam flags, and AI classification hashes. |
| **Principle II: Mexican Market Calibration** | PASS | Mexican Spanish UI. Calibration for Mexican labor terms (*becario*, *prácticas*, *residencias*, *servicio social*, *formación dual*, *nómina*). Default currency MXN. |
| **Principle III: Zero Scope Creep & Anti-Bloat** | PASS | Strict focus on search filtering, seniority classification, and candidate protection. No paywalls, auto-apply bots, or social features. |
| **Principle IV: Midudev Aesthetic & Whitelist** | PASS | Geist Mono / Geist Pixel typography, dark zinc styling (`zinc-950`/`zinc-900`), FastAPI + Pydantic v2 + PostgreSQL + React 19 + Tailwind. Strict typing without `any`. |
| **Principle V: Cost-Optimized AI (agy CLI)** | PASS | Step 2 Deep Audit delegates to local `agy` CLI subprocess calls (`agy --print ... --output-format json`). PostgreSQL composite fingerprint caching prevents duplicate AI calls. |
| **Principle VI: Visual Scam Transparency** | PASS | Deceptive "Fake Junior" postings (demanding $\ge 2$ years) are reclassified to Mid/Senior with high-contrast alert tags (`[ REQUISITOS DISCREPANTES ]`). Scam postings are excluded from "Primer Empleo Real". |
| **Testing Standard: Deterministic Offline** | PASS | All unit and integration tests run offline against recorded fixtures in `backend/tests/fixtures/` and mock `agy` CLI calls. |

---

## Project Structure

### Documentation (this feature)

```text
specs/003-smart-seniority-classification/
├── plan.md              # Implementation Plan (this file)
├── research.md          # Phase 0 decisions & regex heuristics
├── data-model.md        # Phase 1 schema, state transitions & DTO definitions
├── quickstart.md        # Phase 1 validation guide & verification scenarios
├── contracts/
│   └── api-contracts.md # Phase 1 REST & SSE API contracts
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code Layout

```text
backend/
├── alembic/versions/
│   └── 005_replace_category_with_seniority.py    # Database migration
├── src/mishoojobs/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── jobs.py                          # Stream endpoint with seniority query param
│   │   │   └── vacancies.py                     # On-demand audit & evaluate endpoints
│   │   └── sse.py                               # SSE generator with fast-pass classification
│   ├── models/
│   │   └── vacancy.py                           # JobVacancy with seniority columns (purged category)
│   ├── schemas/
│   │   ├── job.py                               # VacancyDTO & Seniority Enums
│   │   └── evaluation.py                        # SeniorityAuditRequest / SeniorityAuditResponse
│   └── services/
│       ├── seniority_classifier.py              # Step 1 Fast-Pass regex classification engine
│       ├── agy_ai_client.py                     # Step 2 agy CLI prompt & deep audit execution
│       └── scrapers/
│           ├── base.py                          # AbstractBaseScraper with classify_seniority_fast
│           ├── computrabajo.py                  # Computrabajo scraper adapter
│           ├── indeed.py                        # Indeed scraper adapter
│           └── occ.py                           # OCC scraper adapter
└── tests/
    ├── fixtures/                                # Static HTML/JSON fixtures for offline tests
    ├── integration/
    │   ├── test_seniority_audit_api.py          # API tests for audit endpoint & caching
    │   └── test_full_workflow.py                # Updated workflow integration tests
    └── unit/
        ├── test_seniority_classifier.py         # Deterministic fast-pass regex unit tests
        └── test_scrapers.py                     # Scraper seniority parsing tests

frontend/
├── src/
│   ├── components/
│   │   ├── FilterDrawer.tsx                     # 5-tier experience filter with live counters
│   │   ├── VacancyCard.tsx                      # Color-coded seniority badges & discrepancy tag
│   │   ├── VacancyDetailModal.tsx               # Modal with on-demand audit trigger & reasoning
│   │   └── VacancyList.tsx                      # Quick filter pills & empty state recovery
│   ├── hooks/
│   │   └── useJobStream.ts                      # Stream hook with seniority param
│   ├── services/
│   │   ├── api.ts                               # auditVacancy API client function
│   │   ├── heuristic_scorer.ts                  # Updated fit scoring using seniority_level
│   │   └── sse.ts                               # SSE client service with seniority filter
│   └── types/
│       └── job.ts                               # SeniorityLevel, AuditStatus, JobVacancy types
└── tests/
    ├── components/
    │   ├── FilterDrawer.test.tsx                # Filter drawer component tests
    │   ├── VacancyCard.test.tsx                 # Badge styling and discrepancy tag tests
    │   └── VacancyDetailModal.test.tsx          # Audit section and modal tests
    └── hooks/
        └── useJobStream.test.ts                 # Job stream hook tests
```

---

## Implementation Breakdown & Phases

### Phase 2.1: Database Migration & Schema Update
- Generate Alembic migration `005_replace_category_with_seniority.py` dropping `category` / `category_enum` and adding `seniority_level`, `years_required_min`, `is_real_first_job`, `audit_status`, `reasoning`, `has_discrepancy`.
- Update `JobVacancy` SQLAlchemy model in `backend/src/mishoojobs/models/vacancy.py`.
- Update `VacancyDTO`, `SearchParams`, and define `SeniorityLevelEnum`, `SeniorityFilterEnum`, and `AuditStatusEnum` in `backend/src/mishoojobs/schemas/job.py`.
- Define `SeniorityAuditRequest` and `SeniorityAuditResponse` in `backend/src/mishoojobs/schemas/evaluation.py`.

### Phase 2.2: Fast-Pass Seniority Classifier & Scraper Integration
- Create `SeniorityClassifier` in `backend/src/mishoojobs/services/seniority_classifier.py` implementing regex patterns for experience years, student terms, Fake Junior discrepancy detection, and Mexican Spanish reasoning.
- Update `AbstractBaseScraper` in `backend/src/mishoojobs/services/scrapers/base.py` to use `SeniorityClassifier.classify_fast` and remove legacy `infer_category`.
- Update `ComputrabajoScraper`, `IndeedScraper`, and `OCCScraper` to populate `seniority_level`, `years_required_min`, `is_real_first_job`, `audit_status`, `reasoning`, `has_discrepancy`.
- Update `jobs.py` router and `sse.py` stream generator to replace `category` with `seniority`, preserving `audit_status == 'verified'` on PostgreSQL upsert.

### Phase 2.3: Step 2 On-Demand Deep AI Audit
- Implement `run_seniority_audit` in `backend/src/mishoojobs/services/agy_ai_client.py` using local `agy` subprocess calls and structured JSON parsing.
- Add endpoint `POST /api/v1/vacancies/{fingerprint}/audit` in `backend/src/mishoojobs/api/routes/vacancies.py` with full description enrichment, `agy` audit execution, and PostgreSQL caching.
- Update `POST /api/v1/vacancies/evaluate` to integrate seniority audit output.

### Phase 2.4: Frontend Type Migration & State Management
- Update `frontend/src/types/job.ts`: delete `Category` / `category`, add `SeniorityLevel`, `SeniorityFilter`, `AuditStatus`, and update `JobVacancy`.
- Update `frontend/src/services/api.ts` with `auditVacancy(fingerprint: string, directUrl?: string, jobDescription?: string)` client method passing `{ vacancy_fingerprint: fingerprint, direct_url: directUrl, job_description: jobDescription }`.
- Update `frontend/src/services/sse.ts` to pass `seniority` parameter.
- Update `frontend/src/App.tsx`: replace `category` filter state with `seniority`, synchronize with URL query `?seniority=<value>`, compute live `tierCounts` across all 6 options, and handle browser navigation history.

### Phase 2.5: Visual Badges, Discrepancy Alerts, Heuristic Fit & Smart Sorting
- Update `frontend/src/components/VacancyCard.tsx` to render color-coded seniority badges (`[ PRIMER EMPLEO REAL ]` emerald with verified icon indicator, `[ PASANTÍA ]` cyan, `[ JR ]` violet, `[ MID ]` amber, `[ SR ]` rose/red), amber discrepancy alert tags (`[ REQUISITOS DISCREPANTES ]`), and verified indicators.
- Update `frontend/src/components/VacancyDetailModal.tsx` to display audit status, trigger on-demand `auditVacancy` when `audit_status === 'preliminary'`, and render verified badge `[ ✓ AUDITADO 0 EXP ]` with audit reasoning.
- Update heuristic fit scorers in `frontend/src/services/heuristic_scorer.ts` and `backend/src/mishoojobs/services/heuristic_scorer.py` to migrate from legacy `category` to `seniority_level` (candidate with early-career profile receives full match weight on `primer_empleo` and `junior`, neutral on `pasantia`, and score penalty on `mid` and `senior`).
- Update `frontend/src/components/FilterDrawer.tsx` and quick filter pills in `VacancyList.tsx` / `App.tsx` with 5-tier controls and real-time count badges.
- Implement smart default sorting for "Primer Empleo Real" (verified first, then preliminary, by publication date).
- Implement empty state in `VacancyList.tsx` with recommendation to expand to Pasantía or Junior and a "Limpiar filtro de experiencia" button.

### Phase 2.6: Offline Test Fixtures, Integration Tests & Maintenance
- Add unit tests for `SeniorityClassifier` in `backend/tests/unit/test_seniority_classifier.py` covering 0-experience, fake junior discrepancies, academic terms, and default fallbacks.
- Add integration tests for `POST /api/v1/vacancies/{fingerprint}/audit` in `backend/tests/integration/test_seniority_audit_api.py`.
- Update all existing backend and frontend tests to conform to `seniority_level`.
- **Mandatory Documentation Task**: Update [GEMINI.md](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/GEMINI.md) with key design decisions and new conventions established by feature 003:
  - `[003] Full-stack purge of legacy category in favor of unified 5-tier seniority_level (pasantia, primer_empleo, junior, mid, senior)`
  - `[003] Two-step hybrid seniority classification: deterministic fast-pass in live SSE stream and on-demand agy CLI deep audit in vacancy modal`
  - `[003] High-contrast emerald badge and verified-first default sorting for authentic 0-experience Primer Empleo Real listings`
  - `[003] Deceptive Fake Junior shield automatically reclassifying 2+ year requirements to Mid/Senior with discrepancy warning tags`

---

## Complexity Tracking

*No constitutional violations. All architecture adheres strictly to MishooJobs Constitution v1.1.0.*
