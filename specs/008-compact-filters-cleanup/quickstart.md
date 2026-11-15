# Quickstart: Compact Filters, Content De-Cluttering & Structured Job Descriptions

**Feature Branch**: `008-compact-filters-cleanup`  
**Date**: 2026-11-15  
**Spec**: [spec.md](./spec.md)

---

## 1. Prerequisites & Setup

Ensure both frontend and backend development environments are ready:

```bash
# 1. Activate backend environment
source .venv/bin/activate

# 2. Check frontend dependencies
cd frontend && npm install && cd ..
```

---

## 2. Automated Test Verification

Run all unit, component, and integration tests offline:

```bash
# Run Vitest test suite for compact filters, parser, and UI components
npm --prefix frontend test -- --run

# Run backend regression tests
.venv/bin/pytest backend/tests/ -v
```

---

## 3. Manual / Interactive Verification Scenarios

Start the local development server:

```bash
# Terminal 1: Backend API
source .venv/bin/activate
uvicorn mishoojobs.api.main:app --reload --port 8000

# Terminal 2: Frontend App
cd frontend && npm run dev
```

Open `http://localhost:5173/` in a browser.

### Scenario 1: Compact Filter Toolbar & Popovers
1. **Desktop Viewport**:
   - Observe that the large filter drawer is replaced by a sleek, ~44px horizontal toolbar.
   - Click each seniority tier (`Primer Empleo Real`, `Pasantía`, `Junior`, etc.) in the segmented control; verify that vacancy counts match and the listing updates immediately (<50ms).
   - Click the "Fecha" dropdown pill; confirm popover opens with timeframe options and live counts (`Hoy`, `3 días`, `7 días`, `14 días`, `30 días`, `Todas`).
   - Select "Últimos 7 días"; verify the pill label updates and popover closes.
   - Observe that the "Restablecer" button appears; click it and confirm filters return to defaults.
2. **Mobile Viewport (<768px)**:
   - Resize browser to 375px width (iPhone dimensions) or open DevTools device emulation.
   - Confirm the toolbar stays on a **single row** without multi-row wrapping or expansion.
   - Swipe horizontally to scroll through all filter controls with smooth touch momentum.

### Scenario 2: Redundancy Elimination
1. **Search Bar**:
   - Verify there is **no** location input next to the search input.
   - Search for a role (e.g. `Python`) and confirm search works seamlessly.
   - Press `/` anywhere on the page and verify the search input receives focus.
2. **Vacancy List**:
   - Verify that the duplicate row of seniority pills previously positioned above the vacancy list is gone.
   - Confirm seniority is controlled exclusively from the horizontal toolbar.

### Scenario 3: Structured Job Description Card Presentation
1. Click on any vacancy in the list to inspect it in the right-hand detail pane (or mobile bottom sheet).
2. On the "Descripción" tab:
   - Verify the description is broken down into structured white cards with icons:
     - `Resumen del Puesto` (Briefcase)
     - `Responsabilidades y Funciones` (ListChecks)
     - `Requisitos y Conocimientos` (CheckCircle2)
     - `Beneficios y Prestaciones` (Gift)
     - `Condiciones y Modalidad` (MapPin)
   - Verify bullet points render with styled bullets and generous line height.
   - Verify that a plain text listing without explicit headings falls back to a clean single overview card without empty sections.

### Scenario 4: Content De-Cluttering & Text Purge
1. **Header Navigation**:
   - Confirm the `v0.1.0 • MX Jr Live` badge is removed.
   - Confirm tab labels are concise: `Vacantes`, `Postulaciones`, `CVs`, `Perfil`.
2. **Postulaciones (Pipeline)**:
   - Navigate to the "Postulaciones" tab.
   - Verify the `Almacenamiento Local (IndexedDB)` badge is removed.
3. **Mis CVs (Resume Library)**:
   - Navigate to the "CVs" tab.
   - Verify the promotional paragraph ("Currículums adaptados a vacantes...") is gone.
   - Verify resume cards display clean badge labels without bracket wrappers (e.g. `Mercado Libre` instead of `[VACANTE: Mercado Libre]`).
4. **Perfil Maestro (Editor)**:
   - Click "Perfil" to open the Master Profile Editor.
   - Confirm `(Master Career Knowledge Base)` subtitle is gone.
   - Confirm the validation badge reads `Estructura válida` (not `[ESTRUCTURA VÁLIDA]`).
5. **Deduplication Inline Counter**:
   - When duplicate listings are merged, confirm there is no large banner. Instead, confirm a subtle counter is displayed next to the results count (e.g. `42 vacantes • 12 combinadas`).
