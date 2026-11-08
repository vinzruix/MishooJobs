# Quickstart & Verification Guide: Hide Applied Vacancies & Search Feed Clean-Up

**Feature Branch**: `004-hide-applied-vacancies`  
**Date**: 2026-11-08  
**Status**: Ready for Implementation  

---

## 1. Prerequisites & Environment Setup

Ensure your local development environment has:
- Node.js 20+ and npm installed for frontend testing and development.
- Python 3.12+ (Python 3.14 verified) with virtual environment activated (for running the backend mock or test server):
  ```bash
  source .venv/bin/activate
  ```

---

## 2. Automated Offline Verification

Run the frontend test suite with Vitest:

```bash
# 1. Run all frontend unit and component tests
cd frontend
npm test -- --run

# 2. Specifically test keyboard navigation and application filtering
npx vitest run src/tests/hooks/useKeyboardNavigation.test.ts
npx vitest run src/tests/components/VacancyList.test.tsx
npx vitest run src/tests/components/FilterDrawer.test.tsx
cd ..
```

Run backend contract & integration test suite (ensuring zero regression):

```bash
.venv/bin/pytest backend/tests/ -v
```

---

## 3. End-to-End Validation Scenarios

### Scenario 1: One-Click Toolbar Toggle (`hideApplied`)
1. Start frontend development server (`cd frontend && npm run dev`) and open `http://localhost:5173`.
2. Perform a search (e.g., "Python Junior").
3. Mark 2 vacancies as applied (via the card "Marcar como postulada" button).
4. Verify the toolbar toggle pill in the results header shows `Ocultar postuladas (2)`.
5. Click the `Ocultar postuladas` pill.
6. **Expected Outcome**:
   - The 2 applied vacancies immediately disappear from the feed in $< 50$ ms.
   - The toggle pill transitions to high-contrast emerald styling with label `Ocultando postuladas (2)`.
   - The header summary text updates to: `Mostrando N vacantes verificadas en vivo (2 postuladas ocultas)`.
   - The browser URL address bar remains clean with zero query parameters added.

---

### Scenario 2: In-Flight Application Removal (< 16ms)
1. With `Ocultando postuladas` active, focus on any visible job card.
2. Press the `a` key on the keyboard (or click "Marcar como postulada").
3. **Expected Outcome**:
   - The vacancy card immediately vanishes from the feed within 1 frame ($< 16$ ms).
   - The visible counter decrements by 1.
   - The hidden counter badge increments from `(2)` to `(3)`.
   - Keyboard selection seamlessly moves to the next card in the feed.

---

### Scenario 3: Dynamic Net Count Badges (Seniority & Timeframe)
1. Observe the horizontal seniority pills (e.g. `Primer Empleo Real`, `Junior`, `Pasantía`) and the FilterDrawer timeframe options.
2. Toggle `Ocultar postuladas` ON and OFF.
3. **Expected Outcome**:
   - When active, the counter badges dynamically update to count *only unapplied visible vacancies*.
   - Clicking any seniority pill with count `K` displays exactly `K` cards in the feed (100% count-to-render parity).

---

### Scenario 4: Keyboard Navigation (`h` / `H`)
1. While browsing the search results outside of input fields, press the `h` or `H` key.
2. **Expected Outcome**:
   - The toggle state switches between active and inactive instantly.
3. Click inside the search input or a notes textarea and press `h`.
4. **Expected Outcome**:
   - The character "h" is typed normally into the text field without toggling the filter.
5. Open the Vacancy Detail modal and press `h`.
6. **Expected Outcome**:
   - The modal remains open and the filter is NOT toggled.

---

### Scenario 5: Multi-Portal Deduplication & Cross-Portal State Sync
1. Find a vacancy scraped from Computrabajo that has duplicate postings on OCC or Indeed sharing the same canonical `fingerprint`.
2. Mark the vacancy as applied.
3. Switch to the Search tab with `Ocultando postuladas` active.
4. **Expected Outcome**:
   - Duplicate postings of that role from OCC and Indeed are also hidden from the feed simultaneously.

---

### Scenario 6: Dedicated 100% Applied Empty State & Recovery
1. In a specific search or filter view, mark all matching vacancies as applied while `Ocultar postuladas` is active.
2. **Expected Outcome**:
   - Instead of a generic "No se encontraron vacantes", a congratulatory emerald empty state appears:
     - Heading: *"¡Te has postulado a todas las vacantes encontradas para este criterio!"*
     - Subtext: *"Has completado la postulación de las N vacantes coincidentes..."*
     - Action button: *"Mostrar vacantes postuladas (N)"*.
3. Click "Mostrar vacantes postuladas".
4. **Expected Outcome**:
   - The filter is turned off and all N applied vacancies reappear immediately.

---

### Scenario 7: Local Storage Persistence Across Browser Sessions
1. Enable `Ocultar postuladas`.
2. Refresh the browser tab or close and reopen the tab.
3. **Expected Outcome**:
   - The toggle remains enabled on initial render without flicker.
   - The preference is read from `localStorage.getItem("mishoojobs_hide_applied")`.
   - The URL query string contains zero filter flags.
