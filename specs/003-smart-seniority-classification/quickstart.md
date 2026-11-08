# Quickstart & Verification Guide: Smart Seniority Classification & "First REAL Job" Detection

**Feature Branch**: `003-smart-seniority-classification`  
**Date**: 2026-11-07  
**Status**: Completed  

---

## 1. Prerequisites & Environment Setup

Ensure your local development environment has:
- Python 3.12+ (or 3.14) with virtual environment activated:
  ```bash
  source .venv/bin/activate
  ```
- PostgreSQL 15+ running locally with database `mishoojobs_db`.
- Antigravity CLI (`agy`) installed and active:
  ```bash
  which agy && agy --version
  ```
- Node.js 20+ and npm installed for frontend testing.

---

## 2. Database Migration

Apply the new database migration to purge `category` and create `seniority_level` columns:

```bash
cd backend
alembic upgrade head
cd ..
```

*Verification*: Verify table structure with psql:
```bash
psql mishoojobs_db -c "\d vacancies"
```
Expect columns: `seniority_level`, `years_required_min`, `is_real_first_job`, `audit_status`, `reasoning`, `has_discrepancy`. Column `category` must be absent.

---

## 3. Automated Offline Verification

Run backend unit and integration test suites (100% offline using deterministic fixtures):

```bash
# 1. Run all backend tests
.venv/bin/pytest backend/tests/ -v

# 2. Specifically verify seniority classification & scraper parsers
.venv/bin/pytest backend/tests/unit/test_seniority_classifier.py -v
.venv/bin/pytest backend/tests/integration/test_seniority_audit_api.py -v
```

Run frontend Vitest test suite:

```bash
cd frontend
npm test -- --run
cd ..
```

---

## 4. End-to-End Validation Scenarios

### Scenario 1: Live Discovery & Step 1 Fast-Pass Streaming
1. Start the FastAPI backend:
   ```bash
   uvicorn mishoojobs.api.main:app --port 8000 --reload
   ```
2. Start the React frontend:
   ```bash
   cd frontend && npm run dev
   ```
3. Open `http://localhost:5173` in a browser.
4. Execute search: "Python Junior" or "Frontend".
5. **Expected Outcome**:
   - Vacancy cards stream in progressively via SSE.
   - Each card displays its standardized color-coded seniority badge:
     - `[ PASANTÍA ]` (Cyan)
     - `[ PRIMER EMPLEO REAL ]` (Emerald)
     - `[ JR ]` (Violet)
     - `[ MID ]` (Amber)
     - `[ SR ]` (Rose/Red)
   - Real-time counters next to each filter option update as batches arrive.

### Scenario 2: "Primer Empleo Real (0 Exp)" Filtering & Smart Sorting
1. Click the `[ Primer Empleo Real (0 Exp) ]` quick filter pill above the vacancy feed.
2. **Expected Outcome**:
   - URL updates to `http://localhost:5173/?seniority=primer_empleo`.
   - Results filter instantly (< 100ms) to show only verified or preliminary 0-experience listings.
   - Cards display high-contrast emerald badge `[ PRIMER EMPLEO REAL ]`.
   - Any deceptive listing requiring $\ge 1$ year is strictly excluded.
   - List prioritizes `audit_status == "verified"` listings at the top, followed by `preliminary`, ordered by publication date.

### Scenario 3: "Fake Junior" Shield & Discrepancy Indicator
1. Search or supply a listing with title "Junior React Developer" that requires "3 años de experiencia en proyectos comerciales".
2. **Expected Outcome**:
   - Listing is reclassified away from entry-level to `mid`.
   - A visible amber discrepancy tag `[ REQUISITOS DISCREPANTES: 2+ AÑOS ]` appears on the card.
   - Listing is excluded when filtering by `Primer Empleo Real` or `Junior`.

### Scenario 4: Step 2 On-Demand Deep AI Audit
1. Click any card with `[ 0 EXP PRELIMINAR ]` to open the `VacancyDetailModal`.
2. Inspect the audit section in the modal.
3. **Expected Outcome**:
   - The modal initiates `POST /api/v1/vacancies/{fingerprint}/audit`.
   - Subprocess `agy` analyzes the full vacancy text.
   - Modal displays the verified emerald badge `[ ✓ AUDITADO 0 EXP ]` and reasoning text.
   - Subsequent modal openings return the cached audit from PostgreSQL with `is_cached: true` (0ms AI delay).

### Scenario 5: URL Synchronization & Empty State Recovery
1. Navigate directly to `http://localhost:5173/?seniority=senior`.
2. Verify that the "Senior (5+ años)" filter is active on initial load.
3. If zero matches occur, verify that the dedicated empty state renders:
   - "No se encontraron vacantes para el nivel seleccionado en esta búsqueda."
   - Suggestion to expand to Pasantía or Junior.
   - Click `[ Limpiar filtro de experiencia ]` $\rightarrow$ resets to "Todos los niveles" and refreshes feed immediately.
