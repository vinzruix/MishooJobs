# Implementation Plan: Modern Split-View Jobs Layout & Clean UI Redesign

**Branch**: `007-modern-jobs-ui` | **Date**: 2026-11-15 | **Spec**: [specs/007-modern-jobs-ui/spec.md](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/specs/007-modern-jobs-ui/spec.md)

**Input**: Feature specification from `/specs/007-modern-jobs-ui/spec.md`

---

## Summary

Transform MishooJobs from a single-column dark monochrome interface with popup modals into a modern, light-themed master-detail split layout (40% master feed, 60% sticky detail pane on desktop $\ge$ 1024px; responsive gesture-driven slide-up bottom sheet on mobile < 1024px). The redesign introduces four distinct pastel metric blocks (Salary, Modality, Experience/Match, Seniority), clean company brand squircles, a 2-tab segmented switch (`Descripción` vs `Evaluación AI`), and a sticky full-width dark action button ("Postularme ahora"). Crucially, all non-value-adding marketing text, slogans, and promotional boilerplate ("FILTROS MEXICANOS", "MishooJobs desarrollado para Jr", verbose banners) are systematically eliminated to elevate the platform to a polished, professional product.

---

## Technical Context

**Language/Version**: TypeScript 5.7+ (frontend), Python 3.12+ (backend)  
**Primary Dependencies**: React 19, Vite 6, Tailwind CSS 3.4+, Dexie.js 4, Lucide React, `vaul` (drawers & bottom sheets)  
**Storage**: Client-side IndexedDB (`mishoojobs_local_db`) for master profile, resumes, and saved/applied pipelines; zero candidate PII in PostgreSQL  
**Testing**: Vitest + React Testing Library (frontend), Pytest (backend)  
**Target Platform**: Modern desktop & mobile browsers (Chrome, Safari, Firefox, Edge, iOS Safari, Android Chrome)  
**Project Type**: Full-stack web application (FastAPI backend + React frontend)  
**Performance Goals**: <50ms vacancy switch latency, 60fps composite-only animation budgets (transform/opacity), <200ms mobile sheet open/close  
**Constraints**: 100% offline deterministic test suite (zero live network calls during tests); zero external paid Gemini API keys (local `agy` CLI orchestration); zero candidate tracking in backend databases  
**Scale/Scope**: Frontend-centric architecture revamp touching 8 components (`App.tsx`, `Header.tsx`, `SearchBar.tsx`, `FilterDrawer.tsx`, `VacancyList.tsx`, `VacancyCard.tsx`, new `VacancyDetailPane.tsx`, and `PortalStatusBar.tsx`), deprecating `VacancyDetailModal.tsx` in favor of inline split pane + mobile Vaul drawer  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Standard | Status | Evidence / Verification |
| --- | --- | --- |
| **I. Privacy & Zero Friction** | **PASS** | No candidate registration, login walls, or candidate tables introduced. Selection state and application bookmarks reside exclusively in client IndexedDB. |
| **II. Mexican Labor Localization** | **PASS** | UI text strictly localized in Mexican Spanish. Currency is MXN ($). Preserves 5-tier Mexican seniority classification (*Primer Empleo Real*, *Pasantía*, *Junior*, *Mid*, *Senior*). |
| **III. Zero Scope Creep** | **PASS** | Strictly layout, visual redesign, and slop text elimination. No payment gateways, auto-apply bots, or internal social feeds added. |
| **IV. Technical Whitelist** | **PASS** | Uses React 19, TypeScript (strict mode, no `any`), Tailwind CSS, and `vaul` (recommended by Emil Kowalski skills). Backend remains untouched FastAPI + Pydantic v2. |
| **V. Cost-Optimized AI (AGY CLI)** | **PASS** | Deep vacancy evaluations and CV tailoring continue to invoke local `agy` CLI with composite PostgreSQL cache; zero paid Gemini API keys. |
| **VI. Visual Transparency** | **PASS** | Scam shields (MLM, candidate fee, 100% commission) and fake junior discrepancy tags remain prominently surfaced in both feed cards and the detail pane. |
| **Defensive Coding & Security** | **PASS** | Scraped job descriptions rendered in the detail pane pass through DOMPurify sanitization to defend against XSS. Untyped payloads prohibited. |
| **Testing & Quality Gates** | **PASS** | Vitest and Pytest test suites run 100% offline using recorded fixtures. |

---

## Project Structure

### Documentation (this feature)

```text
specs/007-modern-jobs-ui/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0 architectural & design research
├── data-model.md        # Phase 1 UI entities, pastel themes & state transitions
├── contracts/           # Phase 1 component contracts & interfaces
│   ├── component-contracts.ts
│   └── ui-contracts.md
├── quickstart.md        # Phase 1 end-to-end validation scenarios
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code Layout

```text
frontend/
├── src/
│   ├── components/
│   │   ├── Header.tsx                 # Clean navigation (light theme, slop-free)
│   │   ├── SearchBar.tsx              # Clean search bar (query + Mexican location)
│   │   ├── FilterDrawer.tsx           # Compact filter bar (slop text purged)
│   │   ├── PortalStatusBar.tsx        # Subtle live streaming indicator
│   │   ├── VacancyList.tsx            # Left column master feed (40% width on desktop)
│   │   ├── VacancyCard.tsx            # Redesigned card (squircle logo, pastel tags, relative time)
│   │   ├── VacancyDetailPane.tsx      # Reusable detail pane (4 pastel metrics, tabs, sticky CTA)
│   │   ├── PastelMetricGrid.tsx       # 4-column horizontal pastel metric block
│   │   ├── ScamBadge.tsx              # High-contrast fraud & predatory shield badges
│   │   └── VacancyDetailModal.tsx     # Deprecated / replaced by VacancyDetailPane + Vaul Drawer
│   ├── hooks/
│   │   ├── useKeyboardNavigation.ts   # Keyboard navigation (j/k/arrow scrolling, s, a, Esc)
│   │   └── useJobStream.ts            # Live SSE streaming hook
│   ├── types/
│   │   └── job.ts                     # JobVacancy and seniority types
│   ├── index.css                      # Global light theme base styles & scrollbar polish
│   └── App.tsx                        # Master-detail layout orchestration & auto-selection
└── tests/
    ├── App.test.tsx                   # Master-detail split view & mobile drawer tests
    ├── components/
    │   ├── VacancyCard.test.tsx       # Card rendering & selection tests
    │   ├── VacancyList.test.tsx       # Feed & empty state tests
    │   ├── VacancyDetailPane.test.tsx # Detail pane, tabs & pastel metrics tests
    │   └── FilterDrawer.test.tsx      # Clean filter tests (verifying slop text absence)
```

**Structure Decision**: Web application frontend refactor. The backend requires no API schema alterations because the existing FastAPI endpoints and SSE stream contracts already provide all required fields (`title`, `company_name`, `salary_min`, `salary_max`, `modality`, `seniority_level`, `years_required_min`, `description`, `skills`, `published_at`, `external_links`).

---

## Complexity Tracking

*No constitutional violations. Zero complexity exceptions required.*

---

## Implementation Phases & Detailed Steps

### Phase 1: Dependencies & Light Visual Theme Foundations
- **Task 1.1**: Install `vaul` (`npm install vaul`) in `frontend` for mobile gesture bottom sheets.
- **Task 1.2**: Update `frontend/src/index.css` to establish the modern light theme foundation (`body { background-color: #F8F9FA; color: #0F172A; }`), smooth scroll behavior, and light scrollbar ergonomics.
- **Task 1.3**: Update `frontend/src/components/Header.tsx` to use clean light styling (`bg-white/80 border-b border-slate-200/80 backdrop-blur text-slate-800`), refined brand logo, and remove non-essential labels.

### Phase 2: Detail Pane Component & Pastel Metric Grid
- **Task 2.1**: Implement `frontend/src/components/PastelMetricGrid.tsx`:
  - 4 semantic pastel cards:
    - **Salario**: `bg-emerald-50 border-emerald-200 text-emerald-950` with `DollarSign` icon.
    - **Modalidad**: `bg-sky-50 border-sky-200 text-sky-950` with `MapPin` icon.
    - **Experiencia / Match**: `bg-amber-50 border-amber-200 text-amber-950` with `Briefcase` icon.
    - **Seniority**: `bg-purple-50 border-purple-200 text-purple-950` with `Award` icon.
  - Formatted text with graceful fallbacks ("A convenir", "0 años", etc.) and WCAG AA contrast compliance.
- **Task 2.2**: Implement `frontend/src/components/VacancyDetailPane.tsx`:
  - Reusable container used in desktop sticky split and mobile drawer.
  - Header: company squircle icon, company name, bold job title, location, relative publication date, and bookmark action.
  - Renders `PastelMetricGrid`.
  - 2-tab segmented switch: `Descripción` and `Evaluación AI` with solid dark pill active state (`bg-slate-900 text-white`).
  - Tab 1 (`Descripción`): Scam badges, DOMPurified description, responsibilities, requirements, and desired technical skills.
  - Tab 2 (`Evaluación AI`): Match score, matched skills pills, missing gaps, seniority audit reasoning, and "Adaptar mi CV" button.
  - Sticky bottom action bar: Full-width dark button ("Postularme ahora" $\rightarrow$ opens verified portal link in new tab) with secondary actions (save/mark applied).

### Phase 3: Master-Detail Split Layout & Vacancy Card Redesign
- **Task 3.1**: Redesign `frontend/src/components/VacancyCard.tsx`:
  - Clean light card styling: `bg-white border-slate-200/80 rounded-2xl hover:border-slate-300 transition-all shadow-xs`.
  - Selected state: `border-slate-900 ring-2 ring-slate-900/10`.
  - Header row: Company squircle icon placeholder, company name, bold job title, relative time (`hace 1 hora`), and bookmark icon.
  - Attribute row: Modality pill, seniority pill (emerald `[ ✓ 0 EXP ]` for authentic first jobs), experience required (`0 años`, `1 año`), and salary excerpt.
  - Requirements snippet & single primary platform action link.
- **Task 3.2**: Redesign `frontend/src/components/VacancyList.tsx`:
  - Left column feed container (40% width on desktop).
  - Search results counter header: e.g., `"29 vacantes encontradas"`.
  - Clean pastel skeleton cards displayed during in-flight live streaming.
  - Direct card click selects vacancy and emits selection event to parent.

### Phase 4: Desktop Split Integration & Mobile Vaul Drawer in App.tsx
- **Task 4.1**: Update `frontend/src/App.tsx` layout:
  - Container grid: `grid grid-cols-1 lg:grid-cols-12 gap-6 items-start`.
  - Left column: `lg:col-span-5` hosting `VacancyList`.
  - Right column: `lg:col-span-7 sticky top-20` hosting `VacancyDetailPane` on viewports $\ge$ 1024px (`hidden lg:block`).
- **Task 4.2**: Implement mobile drawer in `App.tsx`:
  - On viewports < 1024px, selecting a card opens `vaul`'s `Drawer.Root` with drag handle bar, backdrop overlay, and embedded `VacancyDetailPane`.
  - Closing the drawer or swiping down restores full feed view.
- **Task 4.3**: Implement automatic first-item selection:
  - When vacancies stream in and `selectedVacancy` is null, automatically select `vacancies[0]`.
  - Ensure zero layout jump while initial batches stream.

### Phase 5: Systematic Slop Text & Slogan Elimination
- **Task 5.1**: Clean `frontend/src/components/FilterDrawer.tsx`:
  - Purge `"Filtros Mexicanos (Nivel de Experiencia, Modalidad & Fecha)"`.
  - Simplify header to `"Filtros"` or clean icon-based controls.
  - Restyle filter pills to match modern light aesthetic (`bg-slate-100 hover:bg-slate-200 text-slate-700` and `bg-slate-900 text-white` for active).
- **Task 5.2**: Clean `frontend/src/App.tsx`:
  - Remove verbose banner (`100% Búsqueda en Vivo: Concurrencia directa contra Computrabajo, Indeed y OCC...`).
  - Remove footer boilerplate (`MishooJobs • Desarrollado para juniors y estudiantes en México • Moneda MXN ($)`).
  - Simplify loading and empty states across `VacancyList.tsx` and `PortalStatusBar.tsx`.

### Phase 6: Keyboard Navigation, Craft Polish & Stress Testing
- **Task 6.1**: Update `frontend/src/hooks/useKeyboardNavigation.ts`:
  - Ensure `j`/`k` / arrow navigation updates `selectedVacancy` in master-detail split without opening modal.
  - Scroll active card into view smoothly (`scrollIntoView({ block: 'nearest' })`).
  - `Enter`/`Space` switches between detail tabs or triggers primary apply link.
  - `s` bookmarks vacancy; `a` marks as applied; `Esc` dismisses mobile drawer.
- **Task 6.2**: Apply Emil Kowalski craft guidelines:
  - Spring-based smooth transitions on cards and tabs.
  - Prevent layout shifts and dropped frames (`transform`/`opacity` composite-only properties).
  - Stress test with extreme strings (long company names, undisclosed salaries, missing requirements) via `break-ui` methodology.

### Phase 7: Verification & Spec Kit Maintenance
- **Task 7.1**: Run full frontend Vitest test suite (`npm test -- --run`) and update/create tests covering `VacancyDetailPane`, `PastelMetricGrid`, clean `FilterDrawer`, and master-detail selection behavior.
- **Task 7.2**: Run full backend Pytest suite (`.venv/bin/pytest backend/tests/ -v`) to guarantee zero backend regression.
- **Task 7.3 [MANDATORY Spec Kit Step]**: Update [`GEMINI.md`](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/GEMINI.md) Section 7 (Architectural Decisions & Conventions Log) with key decisions from feature `007-modern-jobs-ui`:
  - `[007] Desktop master-detail split layout (40% master list / 60% sticky detail pane, min-w 420px) with zero-modal inspection.`
  - `[007] Modern light visual design system with white container cards, slate-900 accent pills, and 4 semantic pastel metric blocks (Salary, Modality, Experience, Seniority).`
  - `[007] Responsive mobile detail presentation via Vaul gesture-driven bottom sheet with 1:1 finger tracking, velocity dismissal, and explicit close button.`
  - `[007] Segmented 2-tab detail switch (Descripción vs Evaluación AI) with isolated evaluation caching by vacancy fingerprint.`
  - `[007] Zero marketing slop policy purging promotional boilerplate ('Filtros Mexicanos', 'Desarrollado para Jr', verbose banners) across all UI surfaces.`
