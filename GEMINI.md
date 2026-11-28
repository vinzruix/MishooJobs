# MishooJobs – Agent Guidelines & Workspace Rules (GEMINI.md)

> **Authority Notice**: This document governs all autonomous and interactive coding agents (Antigravity / Gemini CLI) operating within the MishooJobs repository. It synthesizes the project constitution (v1.2.0), architectural standards, security rules, and testing mandates. All agent modifications must strictly conform to these rules.

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
│   │   ├── components/         # React 19 UI components
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

### 🎨 UX/UI Design Engineering & Animation Mandate (Emil Kowalski Skills)

> **Note**: Legacy visual guidelines (Midudev dark monochrome / zinc tokens / Geist typography) have been formally removed from the project constitution (v1.2.0) in preparation for a new UX design.

All UX/UI design, prototyping, component implementation, motion design, and code reviews MUST strictly leverage the installed Emil Kowalski skills located in `.agents/skills/`:

#### Mandatory Skill Application by UX/UI Phase:
1. **Phase 1: Architecture, Library Selection & Prototyping**
   - `pick-ui-library`: Select optimal UI primitives, drawers, dialogs, toasts, or virtualization libraries.
   - `prototype`: Build and compare multiple genuinely distinct UI variations with live visual pickers before converging on a solution.
2. **Phase 2: Interaction Design & Component Polish**
   - `emil-design-eng`: Core craft philosophy for UI polish, press/hover states, tooltip timing, popover origins, and transitions vs keyframes.
   - `apple-design`: Physical spring dynamics, fluid gesture interactions, spatial depth, hierarchy, and optical typography.
   - `gestures`: 1:1 finger tracking, interruptible drag/swipe sheets, rubber-banding, and physics-based dismissals.
   - `mobile-native`: Mobile-first touch ergonomics, notch/viewport fixes, sticky hover prevention, and native mobile feel.
   - `ask-sonner`: Polished toast feedback and status notifications.
3. **Phase 3: Motion & Choreography**
   - `animate`: Build intent-driven animations with proper purpose, curves, and exit transitions.
   - `choreograph`: Coordinate staggered entrances, layout swaps, and multi-element state transitions so groups feel intentional.
   - `find-animation-opportunities`: Discover high-value subtle animations on static surfaces.
   - `animation-vocabulary`: Standardized terminology for communicating motion mechanics.
4. **Phase 4: Stress-Testing, Performance & Animation Auditing**
   - `break-ui`: Stress-test components with worst-case data (overflow strings, empty states, huge numbers, missing fields) via a demo toggle.
   - `animation-performance`: Guarantee 60fps composite-only budgets (transform/opacity) and eliminate frame drops.
   - `review-animations` & `improve-animations`: Strict critique against Emil Kowalski craft standards; eliminate sluggish or mechanical transitions.
   - `remove-animations`: Purge unneeded motion on high-frequency actions and functional data surfaces.
5. **Phase 5: Taste Learning & Continuous Rule Refinement**
   - `learn-taste`: Capture user design corrections and persist confirmed rules into project design documentation.

#### Core Ergonomic & Safety Constants:
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
6. **Mandatory Emil Kowalski Skills for UX/UI**: Every task touching frontend components, interactions, animations, layout transitions, or styling MUST invoke and apply the appropriate design engineering skills (`emil-design-eng`, `animate`, `choreograph`, `break-ui`, `review-animations`, etc.).


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
- [Hotfix] Preserve progressive client vacancies state across deduplication summary events and standardize scraper fingerprint generation via AbstractBaseScraper.
- [Hotfix] Include vacancy desired/required skills in AgyAIClient evaluation prompt and contract (AIEvaluationRequest/EvaluationPayload) for comprehensive Tier 2 AI matching.
- [Hotfix] Normalize HTTP 401 bot challenges on job portal links in URLVerifier alongside 403/429 to avoid discarding valid candidate links under WAF.
- [Hotfix] Use curl_cffi with modern Chrome impersonation without conflicting headers for Indeed México scraping and batch fetch full descriptions via Indeed's /rpc/jobdescs endpoint; concurrently enrich OCC vacancies with full offer page descriptions.
- [Hotfix] Support multi-portal full description enrichment across Computrabajo, OCC, and Indeed in on-demand AI evaluation endpoint.
- [Hotfix] Restrict card footer platform actions strictly to one primary platform link (preserving all merged portal links in detail modal) to prevent multi-button wrapping and UI clutter.
- [003] Full-stack purge of legacy category in favor of unified 5-tier seniority_level (pasantia, primer_empleo, junior, mid, senior).
- [003] Two-step hybrid seniority classification: deterministic fast-pass in live SSE stream and on-demand agy CLI deep audit in vacancy modal.
- [003] High-contrast emerald badge and verified-first default sorting for authentic 0-experience Primer Empleo Real listings.
- [003] Deceptive Fake Junior shield automatically reclassifying 2+ year requirements to Mid/Senior with discrepancy warning tags.
- [indeed-block] Resolve Indeed Cloudflare 403 block by switching curl_cffi from safari17_0 with manual iPhone headers to clean impersonate="chrome", restoring live vacancy streaming and RPC description enrichment.
- [vancancies-count-dismatch] Synchronize SSE stream portal status counts with net delivered vacancies, and disambiguate anonymous employer fingerprints ("Empresa Confidencial") to prevent false duplicate collisions.
- [004] Client-side hide-applied toggle persisted in localStorage ('mishoojobs_hide_applied') with zero backend transmission and strictly omitted from URL query string.
- [004] Dynamic net faceted counter synchronization across seniority pills and timeframe filters matching rendered visible cards.
- [004] Real-time in-flight removal (<16ms) of applied vacancies with keyboard focus index clamping to prevent out-of-bounds or orphan focus states.
- [004] Dedicated 100% applied empty state with one-click filter recovery action and multi-portal canonical fingerprint matching.
- [005] Upgrade Dexie schema to version 2 (master_profile, master_profile_photo, resumes) with zero server-side candidate data.
- [005] Canonical Master Career Knowledge Base YAML with client-side AST line-level syntax validation and Mexican early-career defaults.
- [005] Ephemeral agy CLI resume parsing and STAR-format single-page CV generation (<500 words) with anti-hallucination fact shield.
- [005] Universal skills extraction synchronizing Master Profile skills across heuristic match scores, cards, and deep AI evaluation.
- [005] High-density 2-column formal engineering CV template with instant template switching (<100ms), inline text click-to-edit, dual ATS plain text / markdown clipboard export, and print-calibrated single-page vector PDF.
- [005] Enforce z-[60] stacking over z-50 detail modal and sequential Escape/cancel closing to retain underlying vacancy context.
- [005] Direct master profile editing navigation from Resume Library action bar and empty state.
- [005] Calibrate Modern Executive template and print canvas threshold buffer (1080px) to guarantee strict single-page Letter rendering.
- [005] Scale Technical High-Density photo container to 96x96px (w-24 h-24) to align proportionally with full header text span.
- [005] Immediately close Master Profile Editor modal on successful IndexedDB save.
- [vacancy-fingerprint-not-found] Progressive SSE stream batch persistence to PostgreSQL, resilient on-demand vacancy audit fallback without 404, and Indeed scraper connection retry with backoff.
- [occ-vacancy-404] Generate canonical OCC split-grid `?jobid=<id>` URLs, verify and enrich OCC offers via the `oferta.occ.com.mx` JSON endpoint without blindly passing WAF-masked `/empleo/oferta/` 404s, and preserve `jobid`/`jk` query parameters during confidential-company fingerprint disambiguation.
- [006] Surface numerical years_required_min on VacancyCard metadata row with localized Mexican Spanish agreement (0 años, 1 año, N años) and Briefcase icon without modal inspection.
- [UX-V2] Deprecate legacy Midudev/zinc-950 visual style in project constitution (v1.2.0); mandate Emil Kowalski design engineering skills (emilkowalski/skills) across all UX/UI lifecycle phases (prototyping, interaction polish, animation, choreography, stress testing).
- [007] Desktop master-detail split layout (40% master feed / 60% sticky detail pane, min-w 420px) with automatic first-vacancy selection and zero-modal inspection.
- [007] Modern light visual design system with #F8F9FA canvas, white container cards, slate-900 accent pills, and 4 semantic pastel metric blocks (Salary, Modality, Experience, Seniority).
- [007] Responsive mobile detail presentation via Vaul gesture-driven bottom sheet with 1:1 finger tracking, velocity dismissal, and drag handle.
- [007] Segmented 2-tab detail switch (Descripción vs Evaluación AI) with isolated evaluation caching by vacancy fingerprint and DOMPurified HTML descriptions.
- [007] Zero marketing slop policy purging promotional boilerplate ('Filtros Mexicanos', 'Desarrollado para Jr', verbose banners) across all UI surfaces.
- [light-theme-secondary-views] Full migration of secondary views (PipelineView, ResumeLibraryView), search bar, deduplication banner, and auxiliary modals to the Emil Kowalski #F8F9FA light design system with white cards and pastel badges.
- [scroll-highlight] Enforce global light color-scheme with accessible text selection in index.html/CSS, gate Vaul drawer strictly to mobile viewports (<1024px) to prevent body scroll-lock on desktop, and constrain detail pane scroll container with flex-1 min-h-0.
- [008] Consolidate multi-row filter drawer into a unified ~44px horizontal toolbar with contiguous seniority segmented control, popover dropdowns, and mobile single-row scroll.
- [008] Single canonical filter control invariant: streamline SearchBar to keyword query-only and eliminate duplicate seniority pill rows from VacancyList.
- [008] Client-side deterministic regex job description parsing into semantic white cards (Overview, Responsibilities, Requirements, Benefits, Conditions) with bullet tokenization and DOMPurify sanitization.
- [008] Purge technical boilerplate, version badges, bracket tags, and prominent deduplication banners in favor of concise labels and subtle inline counters.
- [filter-popover-duplicate-toggle] Render FilterToolbar dropdown popovers via React Portals with dynamic bounding-box anchoring to eliminate containing-block offsets and mobile clipping, streamline toolbar button sizing to eliminate desktop overflow, and eliminate duplicate 'Ocultar postuladas' button from VacancyList.
- [filter-bar-bug] Eliminate lg:overflow-visible from FilterToolbar scroll container and enforce overflow-x-clip on root page wrapper to prevent uncontained document-level horizontal overflow on mid-size viewports (1024px).
- [filter-bar] Define cross-browser .no-scrollbar utility in index.css suppressing visible WebKit/Firefox scrollbar tracks on FilterToolbar while preserving touch/wheel horizontal scrolling.
- [indeed-vacancies-bug] Replace curl_cffi generic 'chrome' (which resolves to blocked Chrome 152 in v0.17.0) with resilient multi-target fallback list ('chrome136', 'chrome146', 'safari184') in IndeedScraper to bypass Cloudflare WAF.
- [years-dismatch] Preserve Computrabajo structured requirements ('ul.disc') and strip action buttons during full description enrichment to prevent experience truncation and inaccurate 0-experience defaults.
- [experiencie-error] Distinguish unstated experience requirements from 0 years: Rule 11 returns nullable years_required_min (None) with [ EXP. NO ESPECIFICADA ] badge and 'Exp. no especificada' metadata/pastel cards.
- [occ-inactive] Equip OCCScraper with curl_cffi browser TLS impersonation (chrome136/chrome146/safari184) and robust exception handling to bypass Cloudflare WAF on search endpoints, with PostgreSQL enum casting in SSE upserts.
- [cv-customized-button] Surface persistent 'Adaptar CV' button in sticky action bar and in-flow description callout card across all vacancy detail views.
- [009] Frame cleaned transparent MishooJobs cat mascot (`mishoojobs-logo.png`) inside a light rounded-square header badge (`brand-home-btn` returning to `"search"`) and light-backed `/favicon.svg` + `/favicon.png` favicons for contrast across light and dark browser tabs.
- [009] Standardize user-facing `"Primer Empleo Real"` labels and AI prompts to `"Primer Empleo"` with non-mutating case-insensitive output/display normalization (`normalize_primer_empleo_text`, `normalizeSeniorityDisplayText`) while preserving internal `"primer_empleo"` keys.


