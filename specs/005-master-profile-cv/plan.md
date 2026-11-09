# Implementation Plan: Master Career Knowledge Base & Dynamic AI CV Generator

**Branch**: `005-master-profile-cv` | **Date**: 2026-11-09 | **Spec**: [spec.md](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/specs/005-master-profile-cv/spec.md)

**Input**: Feature specification from `/specs/005-master-profile-cv/spec.md`

## Summary

Deprecate the legacy static resume upload mechanism and regex-based skill parser in favor of a centralized **Master Career Knowledge Base** stored permanently in client-side IndexedDB (`mishoojobs_local_db`). The Master Profile serves as the canonical single source of truth across the entire platform for candidate qualifications and technical skills (powering real-time job fit scores and AI gap analyses). 

An intelligent AI generation pipeline orchestrated via local `agy` CLI dynamically curates, rephrases, and generates hyper-tailored, ATS-optimized, 1-page CVs in two scenarios: **One-Click Vacancy Tailoring** (contextual to a job post) and **Role Archetype Generation** (evergreen career tracks like "AI Engineer" or "Frontend Developer"). Resumes render in high-density formal templates (defaulting to a two-column layout with photo, About Me, Contact, Categorized Tech Stack, STAR bullet points, Education, Certificates, and Logros Académicos), maximizing page coverage with zero wasted whitespace, print-ready vector PDF, ATS plain text export, and strictly zero server-side candidate data storage.

---

## Technical Context

**Language/Version**: 
- Backend: Python 3.12+ (Python 3.14 verified)
- Frontend: TypeScript 5.7+ / React 19

**Primary Dependencies**: 
- Backend: FastAPI, Pydantic v2, `pypdf` (ephemeral PDF text extraction), `pyyaml` (canonical YAML formatting), `asyncio` subprocess (`agy` CLI wrapper)
- Frontend: React 19, Vite, Tailwind CSS 3.4+, Dexie.js (IndexedDB v2), `yaml` npm package (v2.7+ client-side parser & AST validator), Lucide React

**Storage**: 
- Client-Side: Dexie.js IndexedDB (`mishoojobs_local_db` version 2) containing `master_profile` (YAML + parsed JSON), `master_profile_photo` (binary Blob), and `resumes` (generated tailored/role CVs)
- Server-Side: PostgreSQL (`mishoojobs_db`) exclusively for job postings, URL checks, scam audit flags, and AI evaluation hashes. **Zero candidate tables or candidate records allowed**.

**Testing**: 
- Backend: Pytest with `pytest-asyncio` using deterministic offline fixtures (`tests/fixtures/`)
- Frontend: Vitest + React Testing Library + `fake-indexeddb`

**Target Platform**: Modern desktop and mobile browsers (Chrome, Edge, Firefox, Safari) + Local Linux/macOS host for FastAPI & `agy` CLI

**Project Type**: Full-stack web application (FastAPI backend + React/Vite SPA frontend)

**Performance Goals**: 
- Resume parsing & structuring via `agy` CLI: <15 seconds
- Dynamic CV generation (Vacancy-tailored / Role archetype): <20 seconds
- Client-side template switching: <100 milliseconds
- Zero layout reflow or pagination overflow on single-page PDF print output

**Constraints**: 
- 100% Client-Side Privacy: Strictly zero candidate PII or resume records persisted in PostgreSQL or server disk
- Anti-Hallucination Fact Shield: Zero invented metrics, dates, or employers
- 1-Page Constraint: All generated resumes must fit onto a single printed page (max 500 words, calibrated `@page` print rules)
- Offline Test Guarantee: Automated tests must run 100% offline without live external calls

**Scale/Scope**: Single developer local instance, unlimited resumes saved in client IndexedDB, multi-portal integration (Computrabajo, Indeed, OCC)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Compliance Analysis | Status |
|---|---|---|
| **I. Privacy & Zero Friction** | No candidate registration or login walls. Resumes, master profiles, photos, and generated CVs are persisted strictly in browser IndexedDB. Backend parsing and generation endpoints are 100% ephemeral and stateless, returning data directly to the client with zero database persistence. | **PASS** |
| **II. Mexican Labor Market Calibration** | Entire interface and starter template in Mexican Spanish. Recognizes Mexican placement terms (*becario*, *prácticas profesionales*, *residencias*, *logros académicos*). Interactive language toggle (ES/EN) allows English generation while defaulting to Spanish. | **PASS** |
| **III. Zero Scope Creep & Anti-Bloat** | No payment gateways, no auto-apply bots, no user accounts, no social feeds. Templates strictly restricted to 3 built-in designs without custom HTML/CSS uploads. | **PASS** |
| **IV. Midudev-Inspired Aesthetic & Whitelist** | Dark mode by default (`zinc-950` backgrounds, `zinc-900` cards, `zinc-800` borders), Geist Mono and Geist Pixel typography. High data density, keyboard-first shortcuts. FastAPI + Pydantic v2 + PostgreSQL + React 19 + TypeScript Strict Mode. | **PASS** |
| **V. Cost-Optimized AI (`agy` CLI)** | Zero paid Gemini API keys. Ingestion and CV generation delegate to local `agy` CLI subprocess utilizing the developer's active Gemini subscription. | **PASS** |
| **VI. Anti-Scam Shield & Transparency** | Preserves high-contrast scam warning badges and real-time fit score calculations across all vacancy cards. | **PASS** |
| **Security Standards** | Untrusted resume files parsed strictly in memory with text extraction and Pydantic validation. Zero raw HTML injection. | **PASS** |
| **Testing & Quality Gates** | 100% offline unit, contract, and integration tests with deterministic fixtures. | **PASS** |

*Post-Design Evaluation: All gates verified and satisfied.*

---

## Project Structure

### Documentation (this feature)

```text
specs/005-master-profile-cv/
├── plan.md              # This implementation plan
├── research.md          # Technical decisions & research rationale
├── data-model.md        # Entities, schemas & Dexie v2 migration
├── quickstart.md        # Step-by-step verification and test guide
├── contracts/           # API and data contracts
│   ├── cv-api.yaml      # OpenAPI 3.1 specification for /cv endpoints
│   ├── master-profile-schema.json # JSON Schema for canonical Master Profile
│   └── generated-cv-schema.json   # JSON Schema for generated single-page CVs
└── tasks.md             # Implementation tasks (/speckit-tasks output)
```

### Source Code Layout

```text
backend/
├── src/mishoojobs/
│   ├── api/
│   │   ├── main.py                     # Route registration (includes cv router)
│   │   └── routes/
│   │       ├── cv.py                   # POST /cv/parse-resume, /generate-tailored, /generate-role
│   │       └── vacancies.py            # AI evaluation with Master Profile skills
│   ├── schemas/
│   │   ├── master_profile.py           # Pydantic v2 schemas for MasterProfileData
│   │   └── resume.py                   # Pydantic v2 schemas for CV generation requests & payloads
│   └── services/
│       └── agy_ai_client.py            # agy CLI prompts for parsing & STAR resume generation
└── tests/
    ├── fixtures/
    │   ├── sample_master_profile.yml   # Deterministic Master Profile fixture
    │   └── sample_resume.md            # Deterministic resume markdown fixture
    └── test_cv_service.py              # Unit & contract tests for CV parsing & generation

frontend/
├── src/
│   ├── components/
│   │   ├── Header.tsx                  # Adds "Mis CVs" navigation tab and counter
│   │   ├── MasterProfileEditor.tsx     # In-browser YAML editor with line numbers & error badges
│   │   ├── AvatarUploader.tsx          # Dedicated headshot photo upload & canvas resizer
│   │   ├── LiveCVViewer.tsx            # High-density formal renderer, inline click-to-edit, PDF print
│   │   ├── templates/
│   │   │   ├── TechnicalHighDensity.tsx # Two-column layout (default) with zero dead whitespace
│   │   │   ├── ClassicATS.tsx          # Single-column linear ATS layout
│   │   │   └── ModernExecutive.tsx     # Executive zinc layout
│   │   ├── ResumeLibraryView.tsx       # "Mis CVs" management tab (preview, duplicate, delete)
│   │   ├── VacancyTailorModal.tsx      # One-click CV generation modal with ES/EN toggle
│   │   ├── RoleArchetypeModal.tsx      # Role archetype CV creation modal
│   │   └── SyncImprovementsModal.tsx   # Selective sync of edited bullets back to Master Profile
│   ├── db/
│   │   └── index.ts                    # Dexie v2 schema upgrade (master_profile, photo, resumes)
│   ├── services/
│   │   ├── master_profile_service.ts   # Client-side YAML parse/validate & starter template
│   │   ├── master_profile_skills.ts    # Extracts universal skills for heuristic scorer
│   │   ├── cv_api.ts                   # Backend API client for /cv endpoints
│   │   └── ats_exporter.ts             # Plain text and Markdown clipboard formatting
│   └── types/
│       ├── master_profile.ts           # TypeScript interfaces for Master Profile
│       └── resume.ts                   # TypeScript interfaces for Generated Resumes & Templates
└── tests/
    ├── components/
    │   ├── MasterProfileEditor.test.tsx
    │   ├── LiveCVViewer.test.tsx
    │   └── ResumeLibraryView.test.tsx
    └── services/
        ├── master_profile_service.test.ts
        └── ats_exporter.test.ts
```

**Structure Decision**: Standard full-stack web application structure (`backend/` and `frontend/`). Decoupled client-side persistence in Dexie with stateless backend endpoints delegating to local `agy` CLI.

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations identified. All designs adhere strictly to constitutional constraints.*
