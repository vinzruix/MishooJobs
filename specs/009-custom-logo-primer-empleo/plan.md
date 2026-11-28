# Implementation Plan: Custom Brand Logo & "Primer Empleo" Label Standardization

**Branch**: `009-custom-logo-primer-empleo` | **Date**: 2026-11-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-custom-logo-primer-empleo/spec.md`

## Summary

Isolate and clean the user-provided suited black cat mascot from `specs/009-custom-logo-primer-empleo/reference-logo.png` (removing the checkerboard background and top-right floating overlay toolbar while reconstructing the occluded right ear tip) to publish a transparent header asset (`frontend/src/assets/mishoojobs-logo.png`) and light-backed contrast-safe browser favicons (`frontend/public/favicon.svg` and `frontend/public/favicon.png`). Update `Header.tsx` to render the custom mascot inside a subtle light rounded-square badge with a thin border next to the `"MishooJobs"` wordmark and make the brand block an interactive button returning to the primary `"Vacantes"` view. Standardize all user-facing occurrences of `"Primer Empleo Real"` (case-insensitive) to `"Primer Empleo"` across UI components (`FilterToolbar.tsx`, `PastelMetricGrid.tsx`), backend AI audit prompts (`agy_ai_client.py`), and response/display normalization layers (`vacancies.py`, `VacancyDetailPane.tsx`) while preserving internal `"primer_empleo"` keys and filtering behavior.

## Technical Context

**Language/Version**: TypeScript 5.7+ (Frontend React 19), Python 3.12+ (Backend FastAPI)  
**Primary Dependencies**: React 19, Vite 6, Tailwind CSS 3.4+, Lucide React, FastAPI 0.115+, Pydantic v2  
**Storage**: PostgreSQL 15+ (`AIEvaluationCache`, `JobVacancy` read/output normalization only; zero schema migration); Dexie.js IndexedDB untouched  
**Testing**: Vitest + React Testing Library (frontend), Pytest + HTTPX ASGITransport (backend), 100% offline  
**Target Platform**: Modern evergreen desktop and mobile web browsers (light & dark browser tab themes, `<768px` mobile to `1440px+` desktop)  
**Project Type**: Full-stack web application (`frontend/` React SPA + `backend/` FastAPI service)  
**Performance Goals**: Zero runtime overhead for brand assets (bundled PNG + inline-data SVG favicon); O(n) sub-millisecond regex text normalization; responsive mobile header at `375px` with zero layout shift  
**Constraints**: 100% offline automated tests; zero checkerboard or screenshot UI artifacts in published mascot assets; strict TypeScript (`noImplicitAny: true`); backwards compatibility with `"primer_empleo"` query params and cached DB rows  
**Scale/Scope**: 3 static brand assets, 5 frontend source files, 2 backend service/route files, and 7 updated/new test files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Rule | Pre-Research Status | Post-Design Status | Justification / Notes |
|------------------|---------------------|--------------------|-----------------------|
| **I. Privacy & Zero Friction** | **PASS** | **PASS** | No candidate accounts, no PII persistence, no tracking. |
| **II. Mexican Labor Market Calibration** | **PASS** | **PASS** | Mexican Spanish UI maintained; `"Primer Empleo"` standardizes tier terminology cleanly while retaining `"0 años verificados"` subtext. |
| **III. Zero Scope Creep & Anti-Bloat** | **PASS** | **PASS** | Scoped strictly to custom logo integration, favicon replacement, header home navigation, and `"Primer Empleo"` label standardization. |
| **IV. Technical Whitelist** | **PASS** | **PASS** | React 19, Vite, TypeScript Strict Mode (`vite-env.d.ts` for asset typing), Tailwind CSS, FastAPI, Pydantic v2. Zero `any` types or untyped dict endpoints. |
| **V. Cost-Optimized AI & Scraping** | **PASS** | **PASS** | `AgyAIClient` prompt updated in-place; cached DB evaluations normalized on output without invalidating existing PostgreSQL cache keys or triggering redundant `agy` calls. |
| **VI. Visual Transparency** | **PASS** | **PASS** | Scam badges, discrepancy alerts, and zero-experience verification indicators remain prominent and unaltered. |
| **Security & Defensive Coding** | **PASS** | **PASS** | Static local logo assets only; no un-sanitized HTML injection; explicit regex boundaries on text normalization. |
| **Testing & Quality Gates** | **PASS** | **PASS** | 100% offline Vitest and Pytest verification covering header rendering/navigation, filter labels, metric cards, and cached evaluation/audit normalization. |
| **Emil Kowalski Design Engineering** | **PASS** | **PASS** | Applies `emil-design-eng` & `break-ui` principles: subtle `1px` hairline badge border, tactile `active:scale-[0.98]` with targeted `transition-transform duration-150 ease-out`, accessible `focus-visible` ring, and `375px` mobile header stress-testing. |

## Project Structure

### Documentation (this feature)

```text
specs/009-custom-logo-primer-empleo/
├── plan.md                                      # This file (/speckit-plan output)
├── research.md                                  # Phase 0 research & asset/normalization decisions
├── data-model.md                                # Phase 1 asset specs & normalization mapping
├── quickstart.md                                # Phase 1 validation & audit guide
├── contracts/
│   ├── brand-header-contract.md                 # Header & favicon UI/accessibility contract
│   └── primer-empleo-normalization-contract.md  # Label & cached AI output normalization contract
└── tasks.md                                     # Phase 2 output (/speckit-tasks - not created here)
```

### Source Code (repository root)

```text
frontend/
├── index.html                                   # UPDATED: Replace /vite.svg with /favicon.svg & /favicon.png
├── public/
│   ├── favicon.svg                              # NEW: Light-backed rounded-square SVG mascot favicon
│   └── favicon.png                              # NEW: Light-backed 64x64 PNG fallback favicon
├── src/
│   ├── vite-env.d.ts                            # NEW: Vite client types for static PNG asset imports
│   ├── assets/
│   │   └── mishoojobs-logo.png                  # NEW: Cleaned transparent suited black cat mascot PNG
│   ├── components/
│   │   ├── Header.tsx                           # UPDATED: Custom mascot badge + clickable home button
│   │   ├── FilterToolbar.tsx                    # UPDATED: "Primer Empleo Real" -> "Primer Empleo"
│   │   ├── PastelMetricGrid.tsx                 # UPDATED: "Primer Empleo Real" -> "Primer Empleo"
│   │   └── VacancyDetailPane.tsx                # UPDATED: Normalize cached audit/eval text on display
│   └── services/
│       └── text_normalizer.ts                   # NEW: Client-side case-insensitive label normalizer
└── tests/
    ├── App.test.tsx                             # UPDATED: "Primer Empleo" filter & brand-home navigation test
    └── components/
        ├── Header.test.tsx                      # NEW: Mascot logo, no Briefcase, brand-click -> "search"
        ├── FilterToolbar.test.tsx               # UPDATED: Assert "Primer Empleo" pill label
        ├── PastelMetricGrid.test.tsx            # UPDATED: Assert "Primer Empleo" & "0 años verificados"
        ├── VacancyList.test.tsx                 # UPDATED: Assert no duplicate quick pill
        ├── VacancyCard.test.tsx                 # UPDATED: Test title consistency
        └── VacancyDetailPane.test.tsx           # UPDATED: Verify normalized display for cached eval/audit text

backend/
├── src/mishoojobs/
│   ├── services/
│   │   └── agy_ai_client.py                     # UPDATED: Prompt wording + normalize_primer_empleo_text()
│   └── api/routes/
│       └── vacancies.py                         # UPDATED: Normalize cached & fresh eval/audit responses
└── tests/
    └── integration/
        ├── test_ai_evaluation.py                # UPDATED: Verify cached eval normalization
        └── test_seniority_audit_api.py          # UPDATED: Verify prompt & cached audit normalization
```

**Structure Decision**: Cleanly extends the existing React/Vite `frontend/` and FastAPI `backend/` structure, introducing `frontend/public/` for static favicons, `frontend/src/assets/` for Vite-bundled brand imagery, and pure stateless normalization helpers in both `backend/src/mishoojobs/services/agy_ai_client.py` and `frontend/src/services/text_normalizer.ts`.

---

## Planned Implementation Phases

### Phase 1: Brand Asset Isolation & Favicon Packaging
- Isolate the suited black cat mascot from `specs/009-custom-logo-primer-empleo/reference-logo.png` into `frontend/src/assets/mishoojobs-logo.png` with a clean transparent alpha channel, zero checkerboard pattern, zero top-right overlay toolbar, and cleanly reconstructed right ear tip.
- Generate `frontend/public/favicon.svg` (light rounded-square backing badge `#FFFFFF`/`#F8FAFC` with thin `#E2E8F0` border and embedded cleaned PNG data URI) and `frontend/public/favicon.png` (`64x64`).
- Add `frontend/src/vite-env.d.ts` (`/// <reference types="vite/client" />`) and update `frontend/index.html` to reference `/favicon.svg` and `/favicon.png` instead of `/vite.svg`.

### Phase 2: Navigation Header Brand Integration (`emil-design-eng`)
- Update `frontend/src/components/Header.tsx` to remove the `Briefcase` icon import/rendering and display `mishoojobs-logo.png` inside a subtle light rounded-square badge (`w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs overflow-hidden flex items-center justify-center shrink-0`) next to `"MishooJobs"`.
- Wrap the logo badge + `"MishooJobs"` wordmark in an accessible `<button type="button">` (`data-testid="brand-home-btn"`, `onClick={() => setActiveTab("search")}`) with `transition-transform duration-150 ease-out active:scale-[0.98]`, `focus-visible` ring, and `shrink-0` mobile responsiveness.

### Phase 3: "Primer Empleo" Label Standardization & Output Normalization
- Update `FilterToolbar.tsx` (`SENIORITY_OPTIONS`) and `PastelMetricGrid.tsx` (`buildPastelMetrics`) from `"Primer Empleo Real"` to `"Primer Empleo"`, keeping `"primer_empleo"` keys, `?seniority=primer_empleo`, and `"0 años verificados"` subtext unchanged.
- Create `frontend/src/services/text_normalizer.ts` (`normalizeSeniorityDisplayText`) and apply it in `VacancyDetailPane.tsx` when displaying `auditResult?.reasoning || vacancy.reasoning`, `evaluation.role_readiness_summary`, and `evaluation.actionable_advice`.
- Update `AgyAIClient.AUDIT_PROMPT_TEMPLATE` in `backend/src/mishoojobs/services/agy_ai_client.py` to reference `'Primer Empleo (0 Exp)'`, add `normalize_primer_empleo_text()`, and apply it in `agy_ai_client.py` and `backend/src/mishoojobs/api/routes/vacancies.py` for both cached and fresh `AIEvaluationResponse` and `SeniorityAuditResponse` payloads.

### Phase 4: Verification, Stress Testing & Governance
- Update and expand frontend Vitest tests (`Header.test.tsx`, `FilterToolbar.test.tsx`, `PastelMetricGrid.test.tsx`, `VacancyDetailPane.test.tsx`, `VacancyList.test.tsx`, `VacancyCard.test.tsx`, `App.test.tsx`) and backend Pytest integration tests (`test_ai_evaluation.py`, `test_seniority_audit_api.py`).
- Run `npm test -- --run`, `npx tsc --noEmit`, `npm run build`, and `.venv/bin/pytest backend/tests/ -v` offline.
- Stress-test the header layout at `375px` mobile and `1440px` desktop widths (`break-ui`) and visually inspect the rendered mascot and favicon in light/dark browser contexts.
- **Mandatory Maintenance Step**: Update [`GEMINI.md`](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/GEMINI.md) Architectural Decisions & Conventions Log with concise `[009]` entries documenting the custom light-backed mascot favicon/header convention and standardized `"Primer Empleo"` output normalization.

---

## Complexity Tracking

> No Constitution violations; table intentionally omitted.
