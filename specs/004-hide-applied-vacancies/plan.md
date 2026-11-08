# Implementation Plan: Hide Applied Vacancies & Search Feed Clean-Up

**Branch**: `004-hide-applied-vacancies` | **Date**: 2026-11-08 | **Spec**: [spec.md](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/specs/004-hide-applied-vacancies/spec.md)

**Input**: Feature specification from `/specs/004-hide-applied-vacancies/spec.md`

---

## Summary

Provide candidates with a fast ($< 50$ ms), keyboard-accessible (`h`/`H`), client-side toggle to exclude job vacancies they have already applied to (`applied`, `interviewing`, `rejected`, `offer`). This eliminates visual clutter during repeat searches and keeps candidate attention strictly focused on fresh opportunities. The feature operates 100% locally via browser storage (`localStorage` for preference persistence + `IndexedDB` via Dexie.js for application tracking) with absolute zero candidate data or application history transmitted to the backend server. The implementation features in-flight removal (< 16ms) upon application, dynamic net faceted counter synchronization across seniority pills and timeframe filters, and a dedicated congratulatory empty state with one-click recovery.

---

## Technical Context

**Language/Version**: TypeScript 5.5+ (Strict Mode) frontend, Python 3.12+ (Python 3.14 verified) backend.  
**Primary Dependencies**:
- Frontend: React 19, Vite, Tailwind CSS 3.4+, Dexie.js (IndexedDB), Lucide React.
- Backend: FastAPI 0.115+, Pydantic v2 (no backend modifications required for this feature).  
**Storage**:
- Browser `localStorage` (`key: "mishoojobs_hide_applied"`) for synchronous, flicker-free toggle persistence across browser reloads.
- Browser `IndexedDB` (`mishoojobs_local_db.applications`) for candidate application statuses (`applied`, `interviewing`, `rejected`, `offer`, `saved`, `ignored`).
- Absolute zero candidate tables, tracking, or PII in PostgreSQL.  
**Testing**: 100% offline deterministic test suites with Vitest + React Testing Library for frontend hooks and components; Pytest for regression verification.  
**Target Platform**: Responsive Web Application (React SPA).  
**Project Type**: Web application (client-side state pipeline & UI enhancements).  
**Performance Goals**:
- Toggle response time $< 50$ ms without page reload or network calls.
- In-flight card removal $< 16$ ms (1 animation frame) upon marking a job as applied.
- 100% mathematical parity between counter badges on seniority pills/timeframes and rendered card counts.  
**Constraints**:
- Absolute candidate privacy (zero accounts, zero candidate data in PostgreSQL, zero URL query string leakage).
- Mexican Spanish UI localization (`"Ocultar postuladas"`, `"Mostrar vacantes postuladas"`).
- Keyboard-first navigation (`h`/`H` toggle, `a` apply, `s` save, `j`/`k` navigation).  
**Scale/Scope**: Client-side filtering pipeline across `App.tsx`, `VacancyList.tsx`, `FilterDrawer.tsx`, `useKeyboardNavigation.ts`, `useApplications.ts`, and `application.ts`.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Rule | Compliance Status | Justification / Implementation Evidence |
|---|---|---|
| **Principle I: Privacy & Zero Friction** | PASS | 100% local browser execution (`IndexedDB` + `localStorage`). Zero backend network requests, zero accounts, and zero URL parameter tracking to prevent candidate activity leakage. |
| **Principle II: Mexican Market Calibration** | PASS | Mexican Spanish UI throughout: `"Ocultar postuladas"`, `"Ocultando postuladas"`, `"Mostrar vacantes postuladas"`. Preserves regional seniority taxonomy (*pasantía*, *primer empleo real*). |
| **Principle III: Zero Scope Creep & Anti-Bloat** | PASS | Strictly focuses on feed decluttering, counter synchronizations, and keyboard accessibility. No automated bots, payment walls, or server-side sync. |
| **Principle IV: Midudev Aesthetic & Whitelist** | PASS | Strict zinc dark-mode palette (`zinc-950`, `zinc-900`, `zinc-800`), Geist Mono typography, high-contrast emerald badge accents, React 19 + TypeScript Strict without `any`. |
| **Principle V: Cost-Optimized AI & Scraping** | PASS | Operates client-side with zero marginal cost and zero external paid API calls. |
| **Principle VI: Visual Transparency Against Predatory Postings** | PASS | Scam and discrepancy badges remain intact on visible cards. Discarded listings (`ignored`) remain globally excluded. |
| **Testing Standard: Deterministic Offline** | PASS | All new hooks and UI components validated with offline Vitest unit and interaction tests. |

---

## Project Structure

### Documentation (this feature)

```text
specs/004-hide-applied-vacancies/
├── plan.md              # Implementation Plan (this file)
├── research.md          # Phase 0 decisions & architectural research
├── data-model.md        # Phase 1 data entities, types & state transitions
├── quickstart.md        # Phase 1 verification scenarios & run guide
├── contracts/
│   └── ui-contracts.md  # Phase 1 UI component & keyboard contracts
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code Layout

```text
frontend/
├── src/
│   ├── types/
│   │   └── application.ts           # Extended ApplicationStatus union ("offer")
│   ├── hooks/
│   │   ├── useApplications.ts       # appliedFingerprints Set & status helpers
│   │   └── useKeyboardNavigation.ts # Added 'h'/'H' keyboard shortcut handler
│   ├── components/
│   │   ├── VacancyList.tsx          # Results toolbar toggle pill & 100% applied empty state
│   │   └── FilterDrawer.tsx         # Dedicated "Ocultar postuladas" switch & net counter sync
│   └── App.tsx                      # localStorage hydration, pure functional filter pipeline & net counts
└── tests/
    ├── hooks/
    │   ├── useApplications.test.ts  # Application status & applied set unit tests
    │   └── useKeyboardNavigation.test.ts # 'h'/'H' shortcut and input protection tests
    └── components/
        ├── VacancyList.test.tsx     # Toggle pill styling & empty state recovery tests
        └── FilterDrawer.test.tsx    # Drawer switch synchronization & net counter tests
```

---

## Implementation Breakdown & Phases

### Phase 1: Data Contracts & Type Definitions
- Extend `ApplicationStatus` in `frontend/src/types/application.ts` to include `"offer"` alongside `"new" | "saved" | "applied" | "interviewing" | "rejected" | "ignored"`.
- Define `APPLIED_STATUSES` constant set (`applied`, `interviewing`, `rejected`, `offer`) for clean status evaluation.
- Document and establish entity models in `data-model.md` and UI contracts in `ui-contracts.md`.

### Phase 2: State Management & Keyboard Navigation
- Update `frontend/src/hooks/useApplications.ts`:
  - Export memoized `appliedFingerprintSet: Set<string>` containing fingerprints with post-application status.
- Update `frontend/src/hooks/useKeyboardNavigation.ts`:
  - Add optional prop `onToggleHideApplied?: () => void`.
  - Listen for `e.key === "h" || e.key === "H"`.
  - Enforce safeguards: ignore shortcut when focus is within `INPUT`, `TEXTAREA`, `SELECT`, content-editable elements, or when any modal is open (`isModalOpen`).
  - Seamlessly adjust `selectedIndex` when the active card is removed in-flight.
- Update `frontend/src/App.tsx`:
  - Hydrate `hideApplied` state from `localStorage.getItem("mishoojobs_hide_applied")` with default `false`.
  - Persist `hideApplied` to `localStorage` on change.
  - Implement the pure functional filter pipeline:
    - Compute `baseActiveVacancies` (unignored minus applied when toggle is active).
    - Compute `hiddenAppliedCount` (unignored matching listings excluded by toggle).
    - Compute `tierCounts` and FilterDrawer counts dynamically against `baseActiveVacancies`.
    - Pass `hideApplied`, `hiddenCount`, and toggle handler to `VacancyList` and `FilterDrawer`.
    - Connect `onToggleHideApplied` to `useKeyboardNavigation`.

### Phase 3: Component Integration & Dynamic Net Facets
- Update `frontend/src/components/VacancyList.tsx`:
  - Add toolbar toggle pill with `EyeOff` / `Eye` icons, tooltip, and live hidden count badge `(N)`.
  - Style active state with high-contrast emerald tokens (`bg-emerald-950 border-emerald-600 text-emerald-300`).
  - Update results summary text: `Mostrando X vacantes verificadas en vivo (Y postuladas ocultas)`.
  - Implement dedicated 100% applied empty state (`CheckCircle2` icon, congratulatory text, and `"Mostrar vacantes postuladas"` action button).
- Update `frontend/src/components/FilterDrawer.tsx`:
  - Add dedicated "Ocultar postuladas" switch block with bidirectional sync.
  - Ensure seniority and timeframe counter badges display contextual net counts matching visible cards.

### Phase 4: Automated Testing & Verification
- Unit test `useApplications` and `appliedFingerprintSet`.
- Unit test `useKeyboardNavigation` for `h`/`H` toggling and input exclusion.
- Component test `VacancyList` for toggle pill states, count updates, and 100% applied empty state.
- Component test `FilterDrawer` for switch synchronization and net facet counters.
- Validate 100% offline test execution (`npm test -- --run` and `pytest`).

### Phase 5: Documentation & Constitution Maintenance
- **Mandatory Documentation Task**: Update `GEMINI.md` with key design decisions and new conventions established by feature `004`:
  - `[004] Client-side hide-applied toggle persisted in localStorage ('mishoojobs_hide_applied') with zero backend transmission and omitted from URL query string.`
  - `[004] Dynamic net faceted counter synchronization across seniority pills and timeframe filters matching rendered visible cards.`
  - `[004] Real-time in-flight removal (<16ms) of applied vacancies with keyboard focus index clamping.`
  - `[004] Dedicated 100% applied empty state with one-click filter recovery action.`
