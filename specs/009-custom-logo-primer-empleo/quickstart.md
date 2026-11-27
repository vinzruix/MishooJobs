# Quickstart Validation Guide: Custom Brand Logo & "Primer Empleo" Label Standardization

**Feature**: `009-custom-logo-primer-empleo`  
**Date**: 2026-11-27

## Prerequisites

- Python virtual environment activated (`.venv/bin/activate`)
- Frontend dependencies installed (`frontend/node_modules`)
- Local PostgreSQL service running (`mishoojobs_db`) for backend integration tests

## 1. Automated Offline Verification

Run all frontend unit/component tests and TypeScript compilation check:

```bash
cd frontend && npm test -- --run && npx tsc --noEmit && npm run build && cd ..
```

Expected outcomes:
- All Vitest suites pass with zero failures, including `Header.test.tsx`, `FilterToolbar.test.tsx`, `PastelMetricGrid.test.tsx`, `VacancyDetailPane.test.tsx`, `VacancyList.test.tsx`, and `App.test.tsx`.
- `tsc --noEmit` passes with zero errors (confirming `vite-env.d.ts` and strict `noImplicitAny` compliance).
- `vite build` succeeds and emits `dist/favicon.svg`, `dist/favicon.png`, and bundled logo asset with zero broken references.

Run all backend unit and integration tests (100% offline):

```bash
.venv/bin/pytest backend/tests/ -v
```

Expected outcomes:
- All Pytest suites pass, including `test_ai_evaluation.py`, `test_seniority_audit_api.py`, and `test_seniority_classifier.py`.
- Tests verify `AUDIT_PROMPT_TEMPLATE` uses `"Primer Empleo"` and cached `AIEvaluationCache` / `JobVacancy` records containing `"Primer Empleo Real"` (mixed/upper/lower case) normalize to `"Primer Empleo"` in API responses.

## 2. Static Source Audit (Zero Stale Strings or Icons)

Verify zero remaining user-facing occurrences of `"Primer Empleo Real"` or `/vite.svg`:

```bash
grep -rn --exclude-dir=node_modules --exclude-dir=dist "vite\.svg" frontend/
grep -rin --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=__pycache__ --exclude-dir=.pytest_cache "primer empleo real" frontend/src/ backend/src/
```

Expected outcomes:
- Zero matches for `vite.svg` in `frontend/`.
- Zero user-facing UI/prompt matches for `"primer empleo real"` in `frontend/src/` or `backend/src/` (only normalization regexes or internal comments if any).

## 3. End-to-End Visual & Functional Verification

1. Start backend & frontend locally:
   ```bash
   source .venv/bin/activate && uvicorn mishoojobs.api.main:app --reload --port 8000
   cd frontend && npm run dev
   ```
2. Open `http://localhost:5173` in a desktop browser and inspect:
   - **Browser Tab Favicon**: Custom suited black cat mascot framed on a light rounded-square badge; clearly visible in both light and dark browser tab themes.
   - **Navigation Header**: Suited black cat mascot inside a subtle light rounded-square badge with thin border beside `"MishooJobs"`, with zero checkerboard or screenshot toolbar artifacts.
   - **Header Navigation Click**: Switch to `"Postulaciones"` or `"CVs"` (or open a CV in `LiveCVViewer`), then click the cat logo or `"MishooJobs"` wordmark → confirms immediate return to `"Vacantes"`.
   - **Filter Toolbar**: Seniority pill reads `"Primer Empleo"` (with live counter) and clicking it filters to `primer_empleo` vacancies and syncs `?seniority=primer_empleo`.
   - **Detail Pane & Mobile Drawer**: Inspecting a `primer_empleo` vacancy displays `"Primer Empleo"` in the purple `"Nivel"` pastel metric card with `"0 años verificados"` subtext, and any AI audit/evaluation text uses `"Primer Empleo"` consistently.
   - **Mobile Responsive Viewport (`375px`)**: Header logo and navigation buttons stay aligned cleanly on one row without clipping or distortion.
