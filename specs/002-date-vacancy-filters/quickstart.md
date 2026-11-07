# Quickstart Validation Guide: Date-Relevant Vacancy Filters

**Feature**: `002-date-vacancy-filters`  
**Date**: 2026-11-06  
**Status**: Ready for Validation  

---

## 1. Prerequisites & Environment Setup

Verify backend virtual environment and dependencies:

```bash
# 1. Activate backend environment
source .venv/bin/activate

# 2. Apply database migrations for published_at column
cd backend && alembic upgrade head && cd ..

# 3. Ensure frontend dependencies are ready
cd frontend && npm install && cd ..
```

---

## 2. Automated Offline Test Scenarios

Execute the complete offline test suite (zero network requests, 100% deterministic):

### Scenario A: Backend Scraper Date Extraction & DTO Validation
Validates that Computrabajo, Indeed, and OCC parsers accurately parse Mexican relative date strings into UTC `datetime` objects and output `VacancyDTO` with `published_at`.

```bash
# Run backend unit tests for scrapers and date parsing
.venv/bin/pytest backend/tests/unit/test_scrapers.py -v -k "date"
```

*Expected Outcome*: All test cases pass with green status, correctly parsing "Hace 2 horas", "Ayer", and handling unparseable dates as `None`.

### Scenario B: Frontend Freshness Utilities & Date Filtering
Validates that `formatMexicanRelativeTime`, `isNewVacancy`, cumulative threshold filters, and union logic calculate correctly.

```bash
# Run frontend unit tests for date utilities
cd frontend && npm test -- --run src/services/date_utils.test.ts
```

*Expected Outcome*: Relative strings match Mexican Spanish formatting, 48-hour boundary correctly assigns "Nueva" badge, and cumulative threshold filters pass all time tests.

### Scenario C: Component & Sorting Dropdown Tests
Validates that `VacancyCard` renders timestamps, `FilterDrawer` renders date filter buttons with cumulative counts, and the sorting dropdown auto-switches to "Más recientes primero" for ≤ 3 days.

```bash
# Run frontend component tests
cd frontend && npm test -- --run tests/components/VacancyCard.test.tsx
```

*Expected Outcome*: Vacancy card displays "Hace X horas" with clock icon, "Nueva" badge appears when `published_at` is fresh, and sorting controls behave as specified.

---

## 3. End-to-End Interactive Verification Flow

Start both local development servers:

```bash
# Terminal 1: Backend API (Port 8000)
source .venv/bin/activate
uvicorn mishoojobs.api.main:app --reload --port 8000

# Terminal 2: Frontend SPA (Port 5173)
cd frontend
npm run dev
```

Open browser to `http://localhost:5173`.

### Scenario 1: Date Filtering & Cumulative Counts
1. Perform a search for "Python Junior" in Mexico.
2. Open the FilterDrawer.
3. Observe the "Fecha de Publicación" section. Verify each option displays an accurate badge count, e.g. "Últimas 24 horas (4)", "Últimos 3 días (9)".
4. Click "Últimas 24 horas".
5. Verify the vacancy list immediately updates (SC-001 < 300ms) to display only postings from the past 24 hours.
6. Verify URL updates to `?published_within=24h`.

### Scenario 2: Smart Recency Ordering
1. With "Últimas 24 horas" selected, observe the sorting dropdown in the results header.
2. Confirm the dropdown automatically defaulted to **"Más recientes primero"**.
3. Verify listings are sorted from newest to oldest based on relative timestamps.
4. Manually change the sorting dropdown to **"Mayor compatibilidad (Fit Score)"**.
5. Switch date filter to "Última semana". Confirm sorting remains **"Mayor compatibilidad"** because user explicitly changed it.

### Scenario 3: "Nueva" Badge & 60-Second Auto-Ticker
1. Inspect job cards with publication dates under 48 hours.
2. Confirm they display the prominent green **"Nueva"** badge.
3. Postings older than 48 hours must not display the "Nueva" badge.
4. Leave the browser tab open for > 60 seconds; observe relative timestamps update automatically without page refresh.

### Scenario 4: URL Sharing & History Navigation
1. Copy the current browser URL containing `?published_within=24h`.
2. Open the URL in an incognito window.
3. Confirm that "Últimas 24 horas" is pre-selected and filtered results match.
4. Use the browser Back button; verify the filter reverts and results re-render instantly.

### Scenario 5: Empty State Guidance & One-Click Reset
1. Select "Última hora" in a query with 0 very recent results.
2. Verify the empty state renders with the message recommending "Última semana" alongside a "Limpiar filtro de fecha" button.
3. Click "Ver vacantes de la última semana"; verify the filter immediately switches to "Última semana" and results appear.
4. Click "Limpiar filtro de fecha"; confirm filter resets to "Cualquier fecha" and URL parameter clears.
