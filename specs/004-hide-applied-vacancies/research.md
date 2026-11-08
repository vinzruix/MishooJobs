# Research: Hide Applied Vacancies & Search Feed Clean-Up

**Feature**: `004-hide-applied-vacancies`  
**Date**: 2026-11-08  
**Scope**: Client-side filtering architecture, local storage hydration, keyboard shortcuts, dynamic faceted counter synchronizations, and dedicated empty state recovery.

---

## 1. Client-Side Storage & Instant Hydration Strategy

### Decision
Store the candidate's toggle state (`hideApplied: boolean`) in browser `localStorage` under the exact key `mishoojobs_hide_applied`, defaulted to `false` for first-time users. Hydrate state synchronously during the initial component render cycle of `App.tsx` and never synchronize or expose this value to the browser URL query string (`window.location.search`).

### Rationale
1. **Zero Layout Shift / Instant Hydration**: `localStorage.getItem("mishoojobs_hide_applied")` is synchronous ($< 1$ ms), eliminating asynchronous loading flickers, flashes of unstyled content, or delayed card hiding on page load that would occur if querying IndexedDB asynchronously.
2. **Strict Candidate Privacy (Constitution Principle I & Spec Clarification 2)**: Candidate application activity and preference to hide applied vacancies must remain strictly local to the device. Exposing `?hide_applied=true` in the URL query string would leak personal job-seeking behavior if the candidate copies or shares the search URL with peers, mentors, or colleagues.
3. **Graceful Fallback**: If `localStorage` access throws an exception (e.g., Safari private browsing restrictions, security sandbox), the system catches the error and defaults gracefully to `false` without blocking search execution.

### Alternatives Considered
- **URL Query Param (`?hide_applied=true`)**: Rejected because it violates privacy guidelines and breaks the clean sharing of search links across users who have not applied to the same vacancies.
- **Dexie.js IndexedDB `preferences` table only**: Rejected for initial state hydration because IndexedDB reads are asynchronous, causing visible layout shifts during feed rendering.

---

## 2. Pure Functional Filter Pipeline & Net Faceted Counts Architecture

### Decision
Structure the client-side data filtering in `App.tsx` as a declarative, multi-stage pure functional pipeline:
1. `rawVacancies`: Scraped stream from `useJobStream`.
2. `unignoredVacancies`: Excludes entries in `ignoredSet` (`status === 'ignored'`) and enforces strict fingerprint uniqueness.
3. `appliedFingerprintSet`: Set of fingerprints whose locally tracked status is in `APPLIED_STATUSES = new Set(['applied', 'interviewing', 'rejected', 'offer'])`.
4. `baseActiveVacancies`: If `hideApplied` is active, filter out vacancies in `appliedFingerprintSet`; otherwise, keep all `unignoredVacancies`.
5. `hiddenAppliedCount`: Number of matching unignored vacancies excluded by the toggle for the current query/filter scope.
6. `tierCounts`: Dynamically computed from `baseActiveVacancies` (scoped to active timeframe), ensuring seniority pills reflect net visible cards.
7. `timeframeCounts`: Dynamically computed in `FilterDrawer` from `baseActiveVacancies` (scoped to active seniority), ensuring timeframe badges reflect net visible cards.
8. `displayedVacancies`: Final filtered and sorted list passed to `VacancyList`.

### Rationale
- **Dynamic Net Counts (Spec Clarification 1 & FR-018)**: When "Ocultar postuladas" is active, counter badges on seniority pills (e.g. `Primer Empleo Real (3)`) and timeframe options (e.g. `Últimas 24h (5)`) must reflect the *exact* count of cards rendered if clicked. Computing counts against `baseActiveVacancies` guarantees 100% mathematical parity.
- **Clean Empty State Differentiation (FR-016)**: Comparing the length of `baseActiveVacancies` to `unignoredVacancies` enables unambiguous detection of the 100% applied state (where `unignoredVacancies.length > 0` but `baseActiveVacancies.length === 0`).

### Alternatives Considered
- **Imperative Mutation of Vacancy Feed**: Rejected because React declarative state flows prevent race conditions and ensure instant (<16ms) reactivity on status updates.
- **Static Portal Counts**: Rejected because showing non-zero counter badges that yield zero cards when clicked leads to candidate frustration and perceived bugs.

---

## 3. Real-Time In-Flight Application Removal & Animation Performance

### Decision
When the candidate marks a card as applied (via `a` shortcut or card button) while `hideApplied` is active:
1. `setApplicationStatus(vacancy, 'applied')` immediately writes to Dexie.js and updates React state (`applications` / `statusMap`).
2. React re-evaluates `appliedFingerprintSet` and `baseActiveVacancies`.
3. The applied card is instantly excluded from `displayedVacancies` within 1 render frame ($< 16$ ms).
4. Total visible count decrements by 1, and hidden count increments by 1.
5. In `useKeyboardNavigation`, if the removed card was currently selected (`selectedIndex`), clamp `selectedIndex` to `Math.min(prev, newVacancies.length - 1)` so focus seamlessly transitions to the next card.

### Rationale
Meets SC-003 ($< 16$ ms removal) and prevents keyboard focus orphan states when the active item disappears from the DOM.

---

## 4. Keyboard Navigation (`h` / `H`) & Input Safeguards

### Decision
Add the `h` / `H` shortcut handler directly inside `useKeyboardNavigation.ts`:
- Check `target.tagName` against `INPUT`, `TEXTAREA`, `SELECT`, and `isContentEditable`.
- Check `isModalOpen` (ignore if vacancy detail modal or profile manager modal is open).
- When triggered, invoke `onToggleHideApplied()`.

### Rationale
Maintains keyboard-first UX consistency (alongside `/`, `j`, `k`, `Enter`, `s`, `a`, `Esc`) without interfering with user typing in search bars or notes.

---

## 5. Multi-Portal Deduplication & Cross-Portal Fingerprint Propagation

### Decision
Leverage the platform's canonical composite fingerprinting mechanism:
- Vacancies from different portals for the same job share the exact same `fingerprint` (e.g. SHA-256 of normalized company name and title).
- Because `ApplicationRecord` is indexed by `vacancy_fingerprint`, marking a job as applied on Computrabajo automatically links its `fingerprint`.
- OCC or Indeed listings with the same `fingerprint` resolve to the same record in `statusMap`, automatically excluding both.
- For anonymous employers ("Empresa Confidencial"), the scraper includes the portal job ID in the fingerprint to prevent false collision across unrelated confidential listings.

### Rationale
Fulfills FR-014 and FR-017 without requiring extra cross-portal mapping tables.

---

## 6. Dedicated 100% Applied Empty State & Recovery UX

### Decision
In `VacancyList.tsx`, introduce a dedicated empty state condition evaluated before generic empty states:
- Condition: `isHideApplied && hiddenCount > 0 && vacancies.length === 0`.
- UI Elements:
  - High-contrast emerald check circle icon (`CheckCircle2`).
  - Heading: `"¡Todo al día con tus postulaciones!"`
  - Subtext: `"Te has postulado a todas las vacantes encontradas para este criterio (${hiddenCount} ${hiddenCount === 1 ? 'postulada oculta' : 'postuladas ocultas'})."`
  - Action Button: `"Mostrar vacantes postuladas"` with `Eye` icon that invokes `onToggleHideApplied()`, instantly revealing all applied cards.

### Rationale
Fulfills FR-016 and SC-006 by providing positive reinforcement and zero-friction recovery rather than a confusing "No se encontraron vacantes" message.
