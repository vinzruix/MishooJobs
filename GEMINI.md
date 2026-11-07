# MishooJobs – Agent Guidelines & Workspace Rules (GEMINI.md)

> **Authority Notice**: This document governs all autonomous and interactive coding agents (Antigravity / Gemini CLI) operating within the MishooJobs repository. It synthesizes the project constitution (v1.1.0), architectural standards, security rules, and testing mandates. All agent modifications must strictly conform to these rules.

---

## 1. Project Overview & Philosophy

**MishooJobs** is a privacy-first, real-time job aggregation and verification platform calibrated specifically for early-career developers, students, and interns in Mexico.

### Core Architectural Pillars
1. **Zero Mandatory Accounts & Absolute Privacy**: No registration, no login walls, and zero candidate PII stored on any server. Resumes, parsed skills, and application tracking reside strictly in browser local storage (`IndexedDB`).
2. **100% Live Discovery (Zero Mock/Preloaded Data)**: Real-time multi-portal concurrent scraping streamed directly to the client via Server-Sent Events (SSE).
3. **100% Verified Active Links**: In-flight asynchronous HTTP HEAD health checks validate that every direct application URL is active (HTTP 200/302) before rendering. Dead or expired listings are discarded.
4. **Zero-API-Key Deep AI Analysis**: Orchestrated via subprocess calls to the local Antigravity CLI (`agy`), utilizing the developer's active Gemini subscription with composite-hash PostgreSQL caching.
5. **Anti-Scam & Predatory Postings Shield**: Deterministic rules engine flags pyramid schemes (MLM), candidate fees (uniforms, exams), 100% commission traps, and unpaid labor with high-contrast warning badges.
6. **Mexican Labor Market Calibration**: Default currency is MXN ($), UI is in Mexican Spanish, and the platform recognizes regional placement terms (*becario*, *prácticas profesionales*, *residencias profesionales*, *estadías*, *formación dual*, *honorarios vs nómina*).

---

## 2. Tech Stack & Directory Structure

```
mishooJobs/
├── backend/
│   ├── alembic/                # Database migrations
│   ├── src/mishoojobs/
│   │   ├── api/                # FastAPI routers & SSE endpoints
│   │   ├── config.py           # Pydantic BaseSettings
│   │   ├── database.py         # SQLAlchemy 2.0 Async engine & session
│   │   ├── models/             # SQLAlchemy / SQLModel database entities
│   │   ├── schemas/            # Pydantic v2 validation DTOs
│   │   └── services/           # Scrapers, verifiers, scorers, agy runner
│   ├── tests/                  # Pytest unit, integration & fixture suites
│   └── pyproject.toml          # Python package & dependency spec
├── frontend/
│   ├── src/
│   │   ├── components/         # React 19 UI components (zinc/mono aesthetic)
│   │   ├── db/                 # Dexie.js IndexedDB schema (mishoojobs_local_db)
│   │   ├── hooks/              # Custom React hooks (keyboard shortcuts, SSE)
│   │   ├── services/           # Client API & evaluation services
│   │   └── types/              # TypeScript strict interfaces & schemas
│   ├── tests/                  # Vitest + React Testing Library component tests
│   ├── vite.config.ts
│   └── tailwind.config.js
└── specs/                      # Spec Kit specifications and design contracts
```

### Technology Whitelist
- **Backend**: Python 3.12+ (Python 3.14 verified), FastAPI 0.115+, Pydantic v2, SQLAlchemy 2.0 Async, Alembic, HTTPX, BeautifulSoup4, Pytest.
- **Frontend**: React 19, TypeScript 5.5+ (Strict Mode), Vite, Tailwind CSS 3.4+, Dexie.js (IndexedDB), Lucide React, Vitest.
- **Database**: PostgreSQL 15+ (`mishoojobs_db`). **Exclusively** for vacancy deduplication fingerprints, URL verification cache, scam audit flags, and AI evaluation hashes. **Zero candidate tables allowed**.
- **AI Orchestration**: Antigravity CLI (`agy`) local subprocess calls. **No paid external Gemini API keys**.
- **Scraping Sources**: Computrabajo, Indeed México, OCC Mundial.

---

## 3. Strict Development Rules & Constraints

### 🚫 Anti-Patterns & Hard Prohibitions
- **NEVER** introduce candidate authentication systems (Clerk, Supabase Auth, Firebase Auth, JWT login walls).
- **NEVER** request, configure, or prompt for `GEMINI_API_KEY`. AI tasks MUST delegate to `agy` CLI (`agy --print ... --output-format json`).
- **NEVER** create database tables or schemas to persist candidate personal data, resumes, or user identities in PostgreSQL.
- **NEVER** use untyped `dict` payloads in API endpoints; 100% of request/response contracts must be strictly validated with **Pydantic v2**.
- **NEVER** use TypeScript `any` (`noImplicitAny: true` is enforced).
- **NEVER** use un-sanitized `dangerouslySetInnerHTML`. Scraped job content must pass through DOMPurify/Bleach sanitization.
- **NEVER** suppress exceptions with `except Exception: pass`. Handle specific error types explicitly.
- **NEVER** introduce scope creep (no payment gateways, no auto-apply bots, no internal chats/social feeds).

### 🎨 Visual & UI Design Guidelines (Midudev-Inspired)
- **Palette**: Dark mode by default using Tailwind zinc shades (`zinc-950` root, `zinc-900` cards, `zinc-800` borders, `zinc-400` muted text).
- **Typography**: Strictly **Geist Mono** for body/code/tables and **Geist Pixel** (or pixel/monospace display styling) for logos, metric counters, and status badges.
- **Navigation**: Keyboard-first UX:
  - `/`: Focus search bar
  - `j` / `↓`: Select next card
  - `k` / `↑`: Select previous card
  - `Enter` / `Space`: Open details & AI evaluation modal
  - `s`: Save vacancy to local pipeline
  - `a`: Mark vacancy as applied
  - `Esc`: Close open modal dialogs
- **Scam Badges**: Deceptive/predatory postings must be highlighted with high-contrast alert badges (`[POSIBLE FRAUDE / PIRAMIDAL]`, `[COBRO A CANDIDATO]`, `[100% COMISIÓN]`, `[TRABAJO NO REMUNERADO]`).

---

## 4. Key Commands & Workflows

### Environment Setup
```bash
# 1. Activate backend virtual environment
source .venv/bin/activate

# 2. Install backend in editable mode with development dependencies
pip install -e "./backend[dev]"

# 3. Apply database migrations
cd backend && alembic upgrade head && cd ..

# 4. Install frontend dependencies
cd frontend && npm install && cd ..
```

### Running Services
```bash
# Terminal 1: Run FastAPI Backend (Port 8000)
source .venv/bin/activate
uvicorn mishoojobs.api.main:app --reload --port 8000

# Terminal 2: Run Vite Frontend (Port 5173)
cd frontend
npm run dev
```

### Testing & Verification
All automated tests must run **100% offline** using static JSON/HTML fixtures in `backend/tests/fixtures/` with zero live network calls.

```bash
# Run backend test suite (unit + integration + contracts)
.venv/bin/pytest backend/tests/ -v

# Run frontend test suite (component + UX)
cd frontend && npm test -- --run
```

---

## 5. Agent Instructions for Modifications

When implementing tasks or modifying this codebase:
1. **Check Constitution First**: Verify that proposed changes do not violate candidate zero-account privacy or local-first storage.
2. **Follow Type Safety**: Define Pydantic v2 models in `backend/src/mishoojobs/schemas/` and TypeScript interfaces in `frontend/src/types/`.
3. **Verify Links & Sanitization**: Ensure external job feeds validate URL liveness via asynchronous HTTP HEAD checks and sanitize text against XSS before rendering.
4. **Preserve Offline Test Guarantee**: If adding new scrapers or endpoints, always provide deterministic offline fixtures and mock network dependencies.
5. **Keep It Lean**: Prefer modular, single-responsibility services without redundant dependencies or architectural bloat.


## 6. Spec Kit Integration Rules

- **Mandatory Documentation Step in `/speckit.plan`**:
  When generating `plan.md`, always include as the final step of the last implementation phase a maintenance task:
  - **Task**: Update [`GEMINI.md`](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/GEMINI.md) with key design decisions and new conventions established by the feature.
  - **Format**: One concise line per decision, prefixed with the specification ID (e.g., `[001] Use Dexie.js for client-side IndexedDB persistence`).
  - **Relevance Filter**: Strictly avoid trivial implementation details or redundant descriptions. Record only transversal, reusable architectural decisions and conventions that guide subsequent specifications.

---

## 7. Architectural Decisions & Conventions Log

- [001] Use Dexie.js for client-side IndexedDB persistence of user profiles, resumes, and application pipeline with zero candidate PII in PostgreSQL.
- [002] Standardize publication dates as UTC datetime (published_at) in VacancyDTO with regex-based Mexican relative date parsing.
- [002] Client-side cumulative date filtering with multi-select inclusive union and 60-second background ticker for relative timestamps and 'Nueva' badges (≤48h).
- [002] URL query parameter sync (?published_within=...) and smart recency sorting defaulting to 'Más recientes primero' for timeframes ≤ 3 days.
- [Hotfix] Use Pydantic AliasChoices for DB column validation while preserving canonical JSON keys (description, skills), normalize WAF bot challenges (403/429) as active for human candidates, and unwrap agy CLI response envelopes.
- [Hotfix] Key VacancyDetailModal by vacancy.fingerprint and sync internal evaluation state to prevent stale AI analysis leak between vacancies; switch FilterDrawer timeframe toggle to single-select to eliminate count mismatch and avoid redundant background re-scraping on client-side filter resets.
- [Hotfix] Stream-level and client-state fingerprint deduplication with field merging (latest published_at, links, longer description) preventing duplicate React keys and reconciler DOM orphan persistence on date filtering.
- [Hotfix] Deduplicate external application links by portal name (1 primary active link per portal) and enforce flex-shrink-0 on card actions to prevent button overflow.
