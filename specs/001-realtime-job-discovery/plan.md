# Implementation Plan: Real-Time Mexican Job Discovery & Verification for Juniors (MishooJobs)

**Branch**: `001-realtime-job-discovery` | **Date**: 2026-11-05 | **Spec**: [specs/001-realtime-job-discovery/spec.md](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/specs/001-realtime-job-discovery/spec.md)

**Input**: Feature specification from `specs/001-realtime-job-discovery/spec.md`

---

## Summary

Build the foundational job discovery and candidate qualification system for MishooJobs, calibrated specifically for early-career Mexican software engineers and students (*becarios, prácticas, servicio social, junior*). 

The platform guarantees **100% live job discovery with zero preloaded/mock data** (FR-001) by concurrently querying Computrabajo, Indeed México, and OCC Mundial, streaming verified active vacancies progressively via Server-Sent Events (SSE). It enforces **100% active functional direct links** (FR-002) via in-flight asynchronous HTTP HEAD health checks before rendering. 

To safeguard candidate privacy and eliminate onboarding friction, **zero account creation is required** (FR-006): resumes (PDF/Markdown) and application pipelines persist strictly in browser IndexedDB (FR-007). The system delivers a **two-tier compatibility scoring system** (FR-010): instant local heuristic skill-match scores (<2s) across all vacancy cards, paired with on-demand deep AI skill gap analysis (<5s) orchestrated through the local Antigravity CLI (`agy`) using the user's active Gemini subscription without paid API keys (Principle V). 

Fraudulent, exploitative, and predatory Mexican job listings (MLM schemes, candidate fees, commission-only traps, unpaid full-time labor) are proactively flagged with prominent high-contrast warning badges (FR-012, FR-013). The user interface adopts a Midudev-inspired dark developer aesthetic (`zinc-950`, Geist Mono/Pixel) with high data density and keyboard navigation shortcuts.

---

## Technical Context

**Language/Version**: Python 3.12+ (host running Python 3.14.3) and TypeScript 5.5+ (Node.js v26.8.1)

**Primary Dependencies**: 
- *Backend*: FastAPI (0.162+), Pydantic v2 (2.14+), Uvicorn, HTTPX (async client), BeautifulSoup4, Bleach (XSS sanitization), SQLAlchemy (2.0+ async), Asyncpg, Alembic, Tenacity.
- *Frontend*: React 19, Vite, Tailwind CSS, TypeScript, Lucide Icons, PDF.js (`pdfjs-dist`), Dexie.js / `idb-keyval` (IndexedDB).
- *AI & Scraping CLI*: Local Antigravity CLI (`agy`) integration for zero-API-key AI execution.

**Storage**: 
- *Client-Side (Workstation)*: IndexedDB (`mishoojobs_local_db`) for candidate profiles (resumes, extracted skills) and local application tracking statuses (`Saved`, `Applied`, `Interviewing`, `Ignored`).
- *Server-Side (PostgreSQL)*: `mishoojobs_db` for vacancy deduplication fingerprints, in-flight verified external portal links, scam assessment flags, and composite hash caching of Tier 2 AI evaluations (`ai_evaluation_cache`).

**Testing**: 
- *Backend*: `pytest` and `pytest-asyncio` with 100% deterministic offline tests using static HTML/JSON fixtures in `tests/fixtures/`. Live network calls strictly forbidden in automated test runs.
- *Frontend*: `vitest` and `@testing-library/react` for UI components, local storage, and keyboard shortcuts.

**Target Platform**: Web application (FastAPI backend + Vite SPA frontend), deployable locally on macOS/Linux.

**Project Type**: Decoupled Web Application (FastAPI REST & SSE backend + React SPA frontend).

**Performance Goals**: 
- First SSE vacancy batch emitted in `<5s` from fastest responding portal (SC-006).
- Full multi-portal query execution (~45 raw vacancies, 15 per portal) completed in `<15s` (SC-006).
- Instant Tier 1 heuristic match score calculation across all cards in `<2s` upon profile load/switch (SC-008).
- On-demand Tier 2 deep AI evaluation via `agy` completed in `<5s` (SC-008).
- Repeated Tier 2 AI inspection from PostgreSQL cache in `<20ms`.

**Constraints**: 
- **Zero Preloaded Data**: Zero synthetic, mock, or static pre-cached listings served in search results (FR-001, SC-001).
- **100% Functional Links**: In-flight HTTP verification must discard broken/expired (404/410) links before emitting cards (FR-002, SC-002).
- **Zero Accounts**: Absolutely no candidate authentication, login walls, or server-side candidate tracking (Principle I, FR-006).
- **Zero Paid Gemini API Keys**: All AI tasks must delegate strictly to local `agy` CLI (Principle V).
- **Strict Mexican Localization**: Currency strictly MXN ($), terms in Mexican labor context (*becario, prácticas, prestaciones de ley*), exclusion of foreign work visa restrictions (Principle II).

**Scale/Scope**: 
- 3 major Mexican job portals (Computrabajo, Indeed México, OCC Mundial).
- Bounded extraction of 15 vacancies per portal per query (~45 raw listings, consolidating to ~30-40 unique vacancies).
- Client-side storage supporting multiple localized candidate profiles and complete application pipeline tracking.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Status | Plan Compliance Verification |
|---|---|---|
| **I. Privacy & Zero Friction** | **PASS** | Zero mandatory account registration or login. Candidate profiles and application statuses reside strictly in client-side IndexedDB. PostgreSQL contains no candidate PII. Secrets isolated from client. |
| **II. Mexican Labor Market Calibration** | **PASS** | Default & exclusive currency is MXN ($). UI entirely in Spanish tailored to Mexico. Filters prioritize Mexican internship terms (*becario, prácticas profesionales, residencias, servicio social, dualidad, trainee, junior*). Remote filters exclude foreign visa restrictions. Target boards: Computrabajo, Indeed México, OCC Mundial. |
| **III. Zero Scope Creep & Anti-Bloat** | **PASS** | No payment gateways, paywalls, automated application bots, CAPTCHA bypasses, or internal social feeds in v0. Purely discovery, verification, AI scoring, and local tracking. |
| **IV. Midudev-Inspired Aesthetic & Technical Whitelist** | **PASS** | Dark theme `zinc-950`/`zinc-900`/`zinc-800`, Geist Mono & Geist Pixel typography, high data density, keyboard navigation. Backend: FastAPI + Python 3.12+ with 100% Pydantic v2 typed DTOs. Frontend: React 19 + Vite + TypeScript (Strict) + Tailwind CSS. Database: PostgreSQL with async SQLAlchemy 2.0 & Alembic. |
| **V. Cost-Optimized AI & Scraping (AGY CLI + Apify MCP)** | **PASS** | Zero-API-key execution: AI evaluation orchestrates through local `agy` CLI using active Gemini subscription. Scraper runs async HTTP with Apify actor fallback. Aggressive PostgreSQL caching of AI evaluations and fingerprints. |
| **VI. Visual Transparency Against Predatory Postings** | **PASS** | Prominent high-contrast warning badges (`[POSIBLE FRAUDE / PIRAMIDAL]`, `[100% COMISIÓN]`, `[TRABAJO NO REMUNERADO]`, `[COBRO A CANDIDATO]`). Immediate two-tier compatibility breakdown. |
| **Defensive Coding & Security** | **PASS** | Strict HTML/XSS sanitization via Bleach on backend and DOMPurify on frontend. Zero TypeScript `any` (`noImplicitAny: true`). Strict Python typing with Pydantic v2. |
| **Testing & Quality Gates** | **PASS** | Offline deterministic test suite using recorded HTML/JSON fixtures in `tests/fixtures/`. Zero live network calls during automated test execution. |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-realtime-job-discovery/
├── plan.md              # Implementation plan (this document)
├── research.md          # Technical research & architecture decisions (Phase 0)
├── data-model.md        # Entity definitions & relationships (Phase 1)
├── quickstart.md        # Runnable end-to-end validation guide (Phase 1)
├── contracts/           # API and data contracts (Phase 1)
│   ├── openapi.yaml     # REST API OpenAPI 3.1 specification
│   ├── sse-stream.json  # Server-Sent Events progressive streaming schema
│   ├── agy-eval.json    # Local agy CLI integration & output schema
│   └── local-storage.json # Browser IndexedDB client storage schema
└── tasks.md             # Implementation tasks (created in /speckit-tasks)
```

### Source Code (repository root)

```text
backend/
├── pyproject.toml               # Python project configuration & dependencies
├── alembic.ini                  # Database migration configuration
├── alembic/
│   ├── env.py                   # Async Alembic migration environment
│   └── versions/                # Migration scripts
├── src/
│   └── mishoojobs/
│       ├── __init__.py
│       ├── config.py            # Typed application settings (Pydantic Settings)
│       ├── database.py          # SQLAlchemy 2.0 async engine & sessionmaker
│       ├── models/              # SQLAlchemy database models
│       │   ├── __init__.py
│       │   ├── vacancy.py       # JobVacancy & ExternalJobLink tables
│       │   ├── scam.py          # ScamAssessment table
│       │   └── evaluation.py    # AIEvaluationCache table
│       ├── schemas/             # Pydantic v2 request/response models
│       │   ├── __init__.py
│       │   ├── job.py           # VacancyDTO, ExternalLinkDTO, SearchParams
│       │   ├── scam.py          # ScamReportResponse, RiskLevelEnum
│       │   └── evaluation.py    # AIEvaluationRequest, AIEvaluationResponse
│       ├── services/            # Core business logic
│       │   ├── __init__.py
│       │   ├── scrapers/        # Multi-portal scraper adapters
│       │   │   ├── __init__.py
│       │   │   ├── base.py      # AbstractBaseScraper interface
│       │   │   ├── computrabajo.py # Computrabajo México scraper
│       │   │   ├── indeed.py    # Indeed México scraper
│       │   └── occ.py           # OCC Mundial scraper
│       │   ├── verifier.py      # In-flight asynchronous HTTP HEAD URL validator
│       │   ├── deduplicator.py  # Canonical company/title/state SHA256 fingerprinting
│       │   ├── scam_detector.py # Deterministic Mexican labor scam rules engine
│       │   ├── heuristic_scorer.py # Fast weighted Jaccard skill matcher (<5ms)
│       │   └── agy_ai_client.py # Local agy CLI subprocess runner & JSON parser
│       └── api/                 # FastAPI routing & SSE delivery
│           ├── __init__.py
│           ├── main.py          # FastAPI application factory & middleware
│           ├── sse.py           # SSE progressive streaming generator
│           └── routes/
│               ├── __init__.py
│               ├── health.py    # Health & dependency diagnostics
│               ├── jobs.py      # GET /api/v1/jobs/stream endpoint
│               └── vacancies.py # POST /api/v1/vacancies/evaluate endpoint
└── tests/
    ├── conftest.py              # Pytest fixtures & test database setup
    ├── fixtures/                # Static recorded HTML & JSON fixtures
    │   ├── computrabajo_raw.html
    │   ├── indeed_raw.html
    │   ├── occ_raw.html
    │   └── agy_eval_response.json
    ├── unit/
    │   ├── test_scrapers.py     # Offline scraper parsing tests
    │   ├── test_verifier.py     # URL verification & fallback tests
    │   ├── test_deduplicator.py # Cross-portal deduplication tests
    │   ├── test_scam_detector.py # Scam & foreign visa exclusion tests
    │   └── test_heuristic_scorer.py # Heuristic scoring tests
    └── integration/
        ├── test_sse_stream.py   # Progressive SSE stream integration test
        └── test_ai_evaluation.py # agy CLI execution & PostgreSQL cache test

frontend/
├── package.json                 # React 19, Vite, Tailwind dependencies
├── tsconfig.json                # TypeScript strict configuration
├── vite.config.ts               # Vite bundler & API proxy configuration
├── tailwind.config.js           # Zinc/mono design tokens
├── index.html                   # HTML template with Geist Mono font
├── src/
│   ├── main.tsx                 # React application entrypoint
│   ├── App.tsx                  # Root layout & dashboard
│   ├── index.css                # Tailwind utility imports & dark theme vars
│   ├── types/                   # TypeScript interfaces
│   │   ├── job.ts               # Vacancy, ExternalLink, ScamReport
│   │   ├── profile.ts           # CandidateProfile, SkillMatch
│   │   └── application.ts       # ApplicationRecord, ApplicationStatus
│   ├── db/                      # IndexedDB local storage adapter
│   │   └── index.ts             # Dexie/IndexedDB database initialization
│   ├── services/                # API clients & client-side utilities
│   │   ├── sse.ts               # SSE stream consumer with reconnection
│   │   ├── resume_parser.ts     # Client-side Markdown & PDF text parser
│   │   ├── heuristic_scorer.ts  # Client-side instantaneous scoring (<2s)
│   │   └── api.ts               # Fetch client for on-demand AI evaluation
│   ├── hooks/                   # Custom React hooks
│   │   ├── useJobStream.ts      # Live job search streaming state
│   │   ├── useProfiles.ts       # Profile switching & local CRUD
│   │   └── useKeyboardNavigation.ts # Vim/keyboard navigation (/, j, k, Esc)
│   └── components/              # Midudev-inspired UI components
│       ├── Header.tsx           # Brand logo (Geist Pixel) & status pills
│       ├── SearchBar.tsx        # Search input with keyboard shortcut `/`
│       ├── PortalStatusBar.tsx  # Live progress pills per portal
│       ├── FilterDrawer.tsx     # Modality & Mexican academic format filters
│       ├── VacancyList.tsx      # High-density card grid
│       ├── VacancyCard.tsx      # Individual card with heuristic badge & links
│       ├── VacancyDetailModal.tsx # Inspection view with Tier 2 AI breakdown
│       ├── ScamBadge.tsx        # High-contrast warning badge
│       ├── FitScoreBadge.tsx    # High/Moderate/Low fit indicator
│       ├── ProfileManagerModal.tsx # Resume upload & profile switcher
│       └── PipelineView.tsx     # Local application tracker (Saved/Applied)
└── tests/
    ├── setup.ts                 # Vitest setup & IndexedDB mock
    └── components/              # Component rendering & interaction tests
```

**Structure Decision**: 
Decoupled web application with `backend/` (FastAPI + SQLAlchemy + Alembic) and `frontend/` (React 19 + Vite + Tailwind CSS). This structure cleanly isolates Python backend scraping, async link verification, and database caching from the client-side React UI and IndexedDB privacy sandbox.

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations.* The architecture conforms 100% to all principles of the MishooJobs Constitution (v1.1.0).
