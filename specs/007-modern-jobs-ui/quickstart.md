# Validation Quickstart: Modern Split-View Jobs Layout & Clean UI Redesign

**Feature Branch**: `007-modern-jobs-ui`  
**Date**: 2026-11-15  
**Spec Reference**: `specs/007-modern-jobs-ui/spec.md`  

---

## Prerequisites & Environment Setup

1. **Frontend dependencies**:
   Ensure dependencies (including `vaul` for mobile drawer support) are installed:
   ```bash
   cd frontend
   npm install
   ```

2. **Backend virtual environment (optional for mock/offline testing)**:
   ```bash
   source .venv/bin/activate
   ```

---

## Verification Scenarios

### Scenario 1: Desktop Master-Detail Split-View (≥ 1024px)
**Goal**: Verify 40/60 master-detail column rendering and instant zero-modal inspection.

1. Start Vite development server:
   ```bash
   cd frontend
   npm run dev
   ```
2. Open browser at `http://localhost:5173` on a desktop viewport ($\ge$ 1024px width).
3. **Validate**:
   - The UI displays an off-white canvas (`#F8F9FA` / `bg-slate-50`) with white container cards.
   - Left column (40% width) displays the list of job cards with a result count header (e.g., "29 vacantes encontradas").
   - Right column (60% width, min-w 420px) is pinned/sticky and immediately renders the full details of the first job in the list without opening any modal dialog.
   - Scrolling down the left list keeps the right detail pane stationary and accessible.

---

### Scenario 2: Instant Card Switching & Keyboard Navigation
**Goal**: Verify rapid keyboard and click-driven vacancy selection.

1. Click on the 2nd or 3rd job card in the left list.
2. **Validate**:
   - The selected card displays an active border/highlight.
   - The right detail panel immediately updates to the selected job (<50ms perceived latency).
3. Press `j` or `↓` arrow key:
   - Next card is highlighted and selected.
   - The right detail panel updates.
   - The left feed smoothly scrolls to keep the selected card in view.
4. Press `k` or `↑` arrow key:
   - Previous card is selected and scrolled into view.

---

### Scenario 3: Pastel Metric Cards & Segmented Tabs
**Goal**: Verify visual rendering of the 4 pastel metric blocks and tab switching.

1. Inspect the top section of the right detail pane.
2. **Validate 4 Pastel Cards**:
   - **Salario**: Emerald green tint (`bg-emerald-50`, dark emerald text).
   - **Modalidad**: Sky cyan tint (`bg-sky-50`, dark cyan text).
   - **Experiencia / Compatibilidad**: Amber peach tint (`bg-amber-50`, dark amber text).
   - **Seniority**: Purple violet tint (`bg-purple-50`, dark purple text).
3. Click the segmented switch:
   - Default tab is **"Descripción"**, displaying sanitized job description and requirements.
   - Switch to **"Evaluación AI"**: Active tab displays as a solid dark pill; content switches to AI score breakdown, skill matches/gaps, and seniority audit details without reloading.

---

### Scenario 4: Bottom Sheet on Mobile (< 1024px)
**Goal**: Verify responsive adaptation to slide-up drawer on small viewports.

1. Open DevTools and switch viewport to mobile (e.g., iPhone 14, 390px width).
2. **Validate**:
   - The layout collapses into a single-column job feed.
   - The sticky right desktop pane is hidden.
3. Tap any job card:
   - A slide-up bottom sheet appears fluidly from the bottom with a top drag handle bar.
   - The sheet contains the complete `VacancyDetailPane` with all 4 pastel metrics, segmented tabs, and sticky "Postularme ahora" button.
4. Drag the sheet handle down or click `Esc` / close button:
   - The sheet smoothly dismisses back to the feed.

---

### Scenario 5: Slop Text & Slogan Elimination Audit
**Goal**: Verify 100% absence of marketing slogans and cringe text.

1. Inspect all screen surfaces:
   - Filter drawer/controls: Check for absence of `"Filtros Mexicanos (Nivel de Experiencia, Modalidad & Fecha)"`.
   - Header & Footer: Check for absence of `"MishooJobs • Desarrollado para juniors y estudiantes en México"`.
   - Banner: Check for absence of `"100% Búsqueda en Vivo: Concurrencia directa contra Computrabajo, Indeed y OCC..."`.
2. Run automated text check:
   ```bash
   grep -rn -i "filtros mexicanos" frontend/src
   grep -rn -i "desarrollado para" frontend/src
   grep -rn -i "100% búsqueda en vivo" frontend/src
   ```
   **Expected**: 0 matches found.

---

### Scenario 6: Automated Test Suite Execution
**Goal**: Validate full regression safety across unit and component suites.

1. Run frontend test suite:
   ```bash
   cd frontend
   npm test -- --run
   ```
   **Expected**: All test suites pass.

2. Run backend test suite:
   ```bash
   .venv/bin/pytest backend/tests/ -v
   ```
   **Expected**: All 56 offline tests pass.
