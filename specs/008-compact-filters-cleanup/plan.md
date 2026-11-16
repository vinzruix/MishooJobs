# Implementation Plan: Compact Filter Toolbar, Redundancy Elimination, Content De-Cluttering & Structured Job Descriptions

**Branch**: `008-compact-filters-cleanup` | **Date**: 2026-11-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-compact-filters-cleanup/spec.md`

## Summary

Consolidate the oversized (~240px) multi-row filter drawer into a sleek, unified, single-row horizontal toolbar (~44px) featuring a contiguous seniority segmented control, popover dropdowns for timeframe, modality, and Mexican states, an applied-job toggle, and an instant reset action. Eliminate redundant location inputs and duplicate seniority pill rows across the search interface. Structure raw job descriptions into scannable semantic visual cards (Overview, Responsibilities, Requirements, Benefits, Conditions) using a deterministic client-side regex parser with DOMPurify sanitization. Finally, purge technical build badges, promotional boilerplate, and bracket tags across all views (Header, Pipeline, Resume Library, Master Profile Editor, and Deduplication notice).

## Technical Context

**Language/Version**: TypeScript 5.5+ (Frontend React 19), Python 3.12+ (Backend FastAPI)  
**Primary Dependencies**: React 19, Tailwind CSS 3.4+, Lucide React, DOMPurify, Dexie.js  
**Storage**: Dexie.js (IndexedDB `mishoojobs_local_db`) for candidate data; PostgreSQL 15+ for vacancy caching. Zero candidate PII on server.  
**Testing**: Vitest + React Testing Library (frontend), Pytest (backend)  
**Target Platform**: Modern evergreen web browsers (Desktop & Mobile viewports, touch-enabled iOS Safari / Chrome)  
**Project Type**: Full-stack web application (Reactive client UI + FastAPI SSE stream)  
**Performance Goals**: <50ms filter response; 60fps scrolling; ≥65% vertical filter height reduction (~240px to ~44px).  
**Constraints**: 100% offline deterministic test suite; mobile single-row horizontal scroll with touch momentum and edge masks; strict type safety (no `any`).  
**Scale/Scope**: 5 frontend components touched/created, 1 client-side parser utility, ~1000 lines of UI cleanup.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Rule | Compliance Status | Justification / Notes |
|------------------|-------------------|-----------------------|
| **I. Privacy & Zero Friction** | **PASS** | No mandatory accounts, no candidate data stored on remote servers. Filter state and keyword searches reside in client memory / URL parameters. |
| **II. Mexican Labor Market Calibration** | **PASS** | Spanish Mexican UI; Mexican States dropdown is canonical; Primer Empleo Real (0 exp) and Pasantía experience tiers remain highlighted and prioritized. |
| **III. Zero Scope Creep & Anti-Bloat** | **PASS** | No new backend endpoints, no payments, no chats. Pure UI consolidation, content restructuring, and noise elimination. |
| **IV. Technical Whitelist** | **PASS** | React 19, TypeScript strict mode (`noImplicitAny: true`), Tailwind CSS, DOMPurify. Untyped dicts and `any` are strictly prohibited. |
| **V. Cost-Optimized AI & Scraping** | **PASS** | Job description parsing is executed deterministically client-side via regex tokenization, incurring zero LLM cost or latency. |
| **VI. Visual Transparency** | **PASS** | Scam warning badges and Fake Junior discrepancy alerts remain prominently positioned in the detail pane. |
| **Security & Defensive Coding** | **PASS** | DOMPurify sanitizes all rendered job description sections to defend against XSS vulnerabilities. |
| **Testing & Quality Gates** | **PASS** | All new components and parsing logic validated offline via deterministic Vitest component tests. |
| **Emil Kowalski Design Engineering** | **PASS** | Strict adherence to `emil-design-eng`, `animate`, `mobile-native`, and `break-ui` (single-row mobile scroll with edge masks, tactile `active:scale-[0.98]`, popover transitions). |

## Project Structure

### Documentation (this feature)

```text
specs/008-compact-filters-cleanup/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── filter-toolbar-contract.md
│   └── job-description-parser-contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   ├── FilterToolbar.tsx          # NEW: Unified compact horizontal filter toolbar (~44px)
│   │   ├── JobDescriptionViewer.tsx   # NEW: Structured semantic visual cards for job descriptions
│   │   ├── SearchBar.tsx              # UPDATED: Streamlined query-only search bar (location removed)
│   │   ├── VacancyList.tsx            # UPDATED: Duplicate seniority pill row removed; inline count polish
│   │   ├── VacancyDetailPane.tsx      # UPDATED: Integrated JobDescriptionViewer with DOMPurify
│   │   ├── Header.tsx                 # UPDATED: Build version badge removed; concise navigation tabs
│   │   ├── PipelineView.tsx           # UPDATED: IndexedDB badge removed; concise header
│   │   ├── ResumeLibraryView.tsx      # UPDATED: Promotional boilerplate removed; bracket-free badges
│   │   └── MasterProfileEditor.tsx    # UPDATED: Technical jargon removed; clean validation badges
│   ├── services/
│   │   └── job_description_parser.ts  # NEW: Client-side deterministic regex sectioning utility
│   ├── types/
│   │   └── job.ts                     # UPDATED: FilterState, StructuredJobDescription interfaces
│   └── App.tsx                        # UPDATED: Wire FilterToolbar, remove FilterDrawer & extraction banner
└── tests/
    ├── components/
    │   ├── FilterToolbar.test.tsx     # NEW: Tests for toolbar, popovers, mobile scroll, and reset action
    │   ├── JobDescriptionViewer.test.tsx # NEW: Tests for section cards, bullet items, and fallback
    │   ├── SearchBar.test.tsx         # UPDATED: Verify single keyword input behavior
    │   └── VacancyList.test.tsx       # UPDATED: Verify list renders cleanly without duplicate pills
    └── services/
        └── job_description_parser.test.ts # NEW: Tests for regex section detection and bullet tokenization
```

**Structure Decision**: Standard React/Vite frontend enhancement modifying existing presentation components in `frontend/src/components/` and adding parsing logic in `frontend/src/services/` with comprehensive Vitest coverage in `frontend/tests/`.

---

## Planned Phases & Implementation Steps

### Phase 1: Core Utilities & Components
- Create `job_description_parser.ts` to tokenize raw text into semantic sections (`overview`, `responsibilities`, `requirements`, `benefits`, `conditions`) with bullet detection and fallback handling.
- Create `JobDescriptionViewer.tsx` to render structured white cards (`bg-white border border-slate-200/80 rounded-xl p-4`) with semantic Lucide icons and DOMPurify sanitization.
- Create `FilterToolbar.tsx` with contiguous seniority segmented control, Date/Modality/State popovers, Hide Applied toggle, Reset button, and mobile horizontal scroll with edge fade masks.

### Phase 2: Redundancy Elimination
- Streamline `SearchBar.tsx`: Remove free-text location input, keep exclusively keywords query + shortcut `/` + submit.
- Clean up `VacancyList.tsx`: Remove secondary quick seniority pill row (`quickSeniorityOptions`), ensuring the toolbar is the sole seniority selector.

### Phase 3: Detail Pane Integration & Description Structuring
- Integrate `JobDescriptionViewer` into `VacancyDetailPane.tsx` description tab.
- Verify fallback rendering for brief or unstructured vacancy descriptions without empty cards.

### Phase 4: UI De-Cluttering & Boilerplate Purge
- In `Header.tsx`: Remove `v0.1.0 • MX Jr Live` badge and shorten navigation tabs (`Vacantes`, `Postulaciones`, `CVs`, `Perfil`).
- In `PipelineView.tsx`: Remove `Almacenamiento Local (IndexedDB)` badge.
- In `ResumeLibraryView.tsx`: Remove boilerplate explanatory paragraph and replace `[VACANTE: ...]` / `[ROL: ...]` with bracket-free styled badges.
- In `MasterProfileEditor.tsx`: Remove `(Master Career Knowledge Base)` subtitle and replace `[ESTRUCTURA VÁLIDA]` / `[ERROR EN LÍNEA ...]` with clean text badges.
- In `App.tsx`: Replace prominent deduplication alert banner with subtle inline text counter next to results count. Remove legacy `FilterDrawer.tsx`.

### Phase 5: Verification & Governance
- Run full frontend test suite (`npm --prefix frontend test -- --run`).
- Run backend test suite (`.venv/bin/pytest backend/tests/ -v`).
- Verify responsive layout across mobile and desktop breakpoints.
- **Mandatory Maintenance Step**: Update [`GEMINI.md`](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/GEMINI.md) Architectural Decisions & Conventions Log with the new architectural standards established by Feature 008 (compact toolbar, single canonical filter control, structured description cards, and UI de-cluttering).

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *None* | No architectural violations or complexity exceptions. | Design conforms strictly to all constitutional principles and whitelist. |
