<!--
Sync Impact Report:
- Version change: 1.0.0 → 1.1.0
- List of modified principles:
  - Principle I: Clarified candidate zero-account rule vs. PostgreSQL backend cache.
  - Principle II: Explicitly designated Computrabajo, Indeed Mexico, and OCC Mundial as primary target portals.
  - Principle IV: Architectural Simplicity → Midudev-Inspired Aesthetic & Technical Whitelist (FastAPI, Pydantic v2, PostgreSQL, React+Vite+Tailwind, Geist Mono/Pixel).
  - Principle V: Zero Forced Cost for the Job-Seeker → Cost-Optimized AI & Scraping (AGY CLI).
- Added sections:
  - Security & Defensive Coding Standards (XSS sanitization, credential isolation, strict typing)
  - Testing & Quality Gates (Deterministic offline fixtures, verification checklist)
  - Compound Learning & Anti-Patterns Log
- Removed sections: None
- Follow-up TODOs: None
-->

# MishooJobs Constitution

> **Hierarchy of Authority:** This constitution governs all design decisions, UI/UX choices, technical architecture, and code generation for MishooJobs. If any technical proposal, feature request, or AI-generated task conflicts with these principles, this constitution strictly prevails.

---

## Core Principles

### I. Privacy & Zero Friction (Zero Barrier to Entry)
The web platform MUST be immediate, accessible, and candidate-centric:
- **No Mandatory Accounts for Job Seekers**: In version 0 (v0), candidates MUST NOT be forced to register, create accounts, or manage passwords to upload resumes, run compatibility checks, or browse jobs.
- **Candidate Data Privacy**: Candidate resumes and preference data MUST be processed client-side or kept in local browser storage (e.g., LocalStorage / IndexedDB) or ephemeral anonymous sessions. Candidate data MUST NEVER be shared, stored on untrusted remote servers, or harvested without explicit consent.
- **PostgreSQL Purpose**: PostgreSQL is exclusively utilized for job posting aggregation, deduplication, search indexing, scam flag caching, and aggregated metrics—never for candidate tracking without explicit consent.
- **Credential Protection**: AI credentials, scraping tokens, and database secrets MUST NEVER be exposed to the public client or committed to version control.
- **Rationale**: Students and early-career job seekers face high friction and application fatigue. Guaranteeing instant utility without account creation and ensuring local privacy builds immediate trust.

### II. Mexican Labor Market Calibration (Strict Localization)
MishooJobs is specifically calibrated for the Mexican early-career job market:
- **Language & Cultural Context**: The entire user interface, labels, filter options, and alert notifications MUST be in Spanish tailored to the Mexican labor context.
- **Academic & Employment Terminology**: The platform MUST recognize and prioritize Mexican academic and professional placement terms (*becario, prácticas profesionales, residencias profesionales, estadías, formación dual, esquema mixto, honorarios vs. nómina*).
- **Default Currency**: The default and exclusive currency MUST be the Mexican Peso (MXN, $).
- **Target Job Portals**: Initial scraping and aggregation efforts MUST prioritize the leading platforms in Mexico: **Computrabajo**, **Indeed (México)**, and **OCC Mundial**.
- **Remote Listing Integrity**: The engine MUST strictly filter out misleading "remote" listings that require foreign legal residency or work authorization (e.g., "US Citizen / Green Card required").
- **Rationale**: Generic global platforms fail junior job seekers in Mexico by cluttering results with inapplicable foreign legal requirements, mismatched terminology, and irrelevant foreign currencies.

### III. Zero Scope Creep & Anti-Bloat
Contributors and AI agents MUST NOT introduce premature features. The following are strictly PROHIBITED from v0 implementation:
- Payment gateways (e.g., Stripe, PayPal), billing portals, or subscription paywalls.
- Automated application bots (*auto-apply*) or CAPTCHA-solving bypass mechanisms.
- Internal social networks, community feeds, messaging/chat systems, or multi-role administrative dashboards.
- Any unprompted feature MUST be documented in a future backlog—it MUST NOT be built in the active sprint.
- **Rationale**: Delivering a fast, robust, and reliable core tool requires relentless discipline against operational baggage and feature creep.

### IV. Midudev-Inspired Aesthetic & Technical Whitelist
MishooJobs adopts a clean, developer-centric, minimalist design paired with a strictly enforced, modern tech stack:

1. **Visual & UI Design (Midudev-Inspired)**:
   - **Theme**: Dark mode by default with stark, high-contrast monochrome tones (`zinc-950` backgrounds, `zinc-900` cards, `zinc-800` borders).
   - **Typography**: Strictly **Geist Mono** for body/code/data tables and **Geist Pixel** (or pixel/monospace display fonts) for branding, metric counters, and status badge accents.
   - **Layout**: High data density, clean borders, subtle hover transitions, badge-driven statuses, and keyboard-first navigational shortcuts.
2. **Backend**:
   - **FastAPI** with **Python 3.12+**.
   - **Pydantic v2**: 100% of request/response payloads and internal DTOs MUST be strictly typed with Pydantic v2 schemas. Untyped `dict` payloads are strictly prohibited.
3. **Frontend**:
   - **React 19 + Vite + TypeScript (Strict Mode)**.
   - **Tailwind CSS**: Utility-first styling adhering to the zinc/mono design tokens.
4. **Database**:
   - **PostgreSQL** with asynchronous access (SQLAlchemy 2.0 Async / SQLModel) and Alembic migrations.
- **Rationale**: High performance, strict type safety, decoupled frontend-backend architecture, and a focused aesthetic inspired by modern developer tooling.

### V. Cost-Optimized AI & Scraping (AGY CLI + Apify MCP)
Operating costs MUST remain at zero or near-zero marginal cost:
- **Zero-API-Key AI Execution**: AI analysis, resume matching, and scam detection MUST NOT require external paid Gemini API keys. The backend MUST orchestrate AI tasks via the local **Antigravity CLI (`agy`) integration**, directly utilizing the user's active Gemini subscription.
- **Apify MCP Scraping**: External job data ingestion MUST use the **Apify MCP server**, strictly selecting the most cost-effective and free-tier-friendly actors for Mexican job portals (**Computrabajo**, **Indeed**, **OCC**).
- **Aggressive Caching**: Scraped vacancies and AI compatibility evaluations MUST be cached in PostgreSQL to prevent redundant scraping runs and duplicate AI evaluations.
- **Rationale**: An application serving juniors and university students must remain financially sustainable without passing costs or paywalls onto job-seekers or maintainers.

### VI. Visual Transparency Against Predatory Postings
The UI/UX MUST proactively safeguard young candidates against labor exploitation:
- **Prominent Scam Warnings**: Red flags and scam warnings MUST NEVER be buried or hidden; they MUST be displayed with prominent, high-contrast visual badges (e.g., clear warning labels: *"Potential MLM / Piramidal"*, *"100% Comisión Disfrazada de Sueldo"*, *"Trabajo No Remunerado"*, *"Sin Prestaciones de Ley"*).
- **Instant Compatibility Breakdown**: The compatibility breakdown (matching skills vs. skill gaps) MUST be immediately readable at a glance on clean, interactive, badge-driven job cards.
- **Rationale**: Early-career candidates are especially vulnerable to predatory listings disguised as internships or entry-level opportunities.

---

## Security & Defensive Coding Standards

1. **Job Content Sanitization (XSS Defense)**:
   - External job postings ingested via Apify contain untrusted HTML/text.
   - All rendered job descriptions MUST pass through strict sanitization (e.g., DOMPurify on the frontend or Bleach on the backend). Raw injection (`dangerouslySetInnerHTML`) without sanitization is strictly prohibited.
2. **Credential Isolation**:
   - Database credentials, Apify tokens, and environment secrets MUST NEVER be exposed in client-side bundles or checked into version control.
3. **Strict Type Safety**:
   - TypeScript `any` is forbidden (`noImplicitAny: true`).
   - Python code MUST pass strict linting and static typing without generic exceptions (`except Exception: pass` is prohibited).

---

## Testing & Quality Gates

1. **Deterministic Offline Testing**:
   - Automated tests (`pytest`, `vitest`) MUST NEVER make live network requests to Apify, external job sites, or the `agy` CLI.
   - All parsers and extractors MUST be validated against recorded static JSON/HTML fixtures stored in `tests/fixtures/`.
2. **Quality Verification Gates**:
   - Every plan (`/speckit-plan`) and implementation (`/speckit-implement`) must pass a compliance check verifying:
     - [ ] Zero mandatory account wall for job-seekers.
     - [ ] Strict adherence to FastAPI + Pydantic v2 + PostgreSQL + React/Vite.
     - [ ] Proper use of `agy` CLI for AI operations and Apify MCP for scraping.
     - [ ] Geist Mono / Geist Pixel visual styling.
     - [ ] Computrabajo, Indeed, and OCC compatibility.

---

## Compound Learning & Anti-Patterns Log

*(A living ledger of anti-patterns and mistakes strictly prohibited from being repeated)*

- **Anti-Pattern 01**: Never propose cloud-hosted auth providers (Clerk, Supabase Auth, Firebase Auth) for v0 candidates.
- **Anti-Pattern 02**: Never prompt for `GEMINI_API_KEY` when executing AI workflows; always delegate to the `agy` CLI wrapper.
- **Anti-Pattern 03**: Never run unthrottled or full-page scrapers when lightweight Apify API actor calls can extract structured JSON directly.
- **Anti-Pattern 04**: Never omit sanitization on scraped job vacancy descriptions.

---

## Governance

- **Supremacy**: This constitution supersedes all other documentation, practices, and informal agreements.
- **Amendments**: Amendments require explicit documentation, stakeholder consensus, and a migration plan.
- **Versioning Policy**: The constitution version follows Semantic Versioning (MAJOR.MINOR.PATCH):
  - **MAJOR**: Backward-incompatible governance or principle removals or redefinitions.
  - **MINOR**: New principle or section additions, or materially expanded guidance.
  - **PATCH**: Clarifications, wording refinements, and non-semantic typo corrections.
- **Compliance Review**: All project specifications, roadmaps, and PRs must reference and strictly conform to this document.

**Version**: 1.1.0 | **Ratified**: 2026-11-04 | **Last Amended**: 2026-11-05
