# Technical Research & Architecture Decisions: Compact Filters, Content De-Cluttering & Structured Job Descriptions

**Feature Branch**: `008-compact-filters-cleanup`  
**Date**: 2026-11-15  
**Spec**: [spec.md](./spec.md)

---

## 1. Compact Filter Toolbar Architecture

### Context & Challenge
The legacy `FilterDrawer` component spans up to ~240px vertically, presenting a multi-column grid with redundant controls (e.g. seniority buttons repeated both in the drawer and above the vacancy list, free-text region input repeated next to the search bar). This displaces the vacancy feed below the fold on standard desktop viewports and creates excessive cognitive load.

### Decision
1. **Unified Single-Row Toolbar (`FilterToolbar.tsx`)**:
   - Replace `FilterDrawer.tsx` with a streamlined ~44px horizontal toolbar.
   - Layout sequence:
     1. **Seniority Segmented Pill Group**: Contiguous segmented control `[ Todos | Primer Empleo Real | Pasantía | Junior | Mid | Senior ]` with live counts.
     2. **Date Popover Pill**: Compact dropdown pill showing active selection (e.g. "Fecha" / "Últimos 7 días") opening a floating popover with options (`Hoy`, `3 días`, `7 días`, `14 días`, `30 días`, `Todas`) and real-time matching vacancy counters.
     3. **Modalidad Dropdown Pill**: Dropdown pill for work arrangement (`Todas`, `Remoto`, `Híbrido`, `Presencial`).
     4. **Ubicación / Estado Dropdown Pill**: Dropdown pill populated with Mexican states (`Toda la República`, `CDMX`, `Jalisco`, `Nuevo León`, `Querétaro`, `Puebla`, `Guanajuato`, `Yucatán`, `Baja California`, `100% Remoto`).
     5. **Ocultar Postuladas Toggle**: Unobtrusive toggle/pill with live counter of hidden applications.
     6. **Restablecer (Reset) Button**: Visible conditionally only when any toolbar filter is non-default, resetting all toolbar filters while leaving search keywords intact.
2. **Mobile Viewport Optimization (<768px)**:
   - Implement single-row horizontal scrolling via `overflow-x-auto scrollbar-none flex-nowrap shrink-0` with `-webkit-overflow-scrolling: touch`.
   - Apply subtle horizontal edge fade mask via CSS `mask-image: linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)` to indicate scrollability without vertical height inflation.
3. **Popover Interaction Architecture**:
   - Lightweight, zero-dependency popover primitives using React refs, `useEffect` click-outside listeners, and `Escape` key handlers.
   - Styled with `bg-white border border-slate-200/90 rounded-2xl shadow-xl z-30` conforming to Emil Kowalski design principles (tight padding, clear active states, subtle borders).

### Alternatives Considered
- *Native HTML `<select>` elements*: Visually inconsistent across OSs, cannot render real-time secondary counter badges cleanly, and lacks modern aesthetic.
- *Heavy UI popover libraries (e.g. Radix / Headless UI)*: Adds external dependency weight for basic dropdowns that are cleanly managed with 25 lines of accessible React code.

---

## 2. Redundancy Elimination & Search Bar Streamlining

### Context & Challenge
Previously, geographic location was entered both via a text input in `SearchBar.tsx` and via a select dropdown in `FilterDrawer.tsx`. Furthermore, `VacancyList.tsx` rendered a secondary row of seniority pills immediately above the job cards, duplicating the seniority controls.

### Decision
1. **Streamline `SearchBar.tsx`**:
   - Remove the location input container (`sm:w-56 flex items-center border-l...`).
   - The search bar exclusively receives query keywords (e.g. `"Python Junior"`, `"React Becario"`), with keyboard shortcut `/` and submit action.
   - Location filtering is consolidated 100% into the `FilterToolbar` Mexican States dropdown.
2. **Purge Duplicate Controls from `VacancyList.tsx`**:
   - Remove `quickSeniorityOptions` row (`flex items-center gap-1.5 overflow-x-auto...`).
   - The toolbar's segmented control is the single canonical seniority selector.
   - Clean up unused callbacks in `VacancyListProps` (`onSelectSeniority`, `onClearSeniorityFilter`).

### Alternatives Considered
- *Keep free-text location as optional fallback in search bar*: Rejected because users were confused by which location control took precedence, and Mexican states dropdown provides consistent geographical normalization.

---

## 3. Structured Job Description Parser & Visual Hierarchy

### Context & Challenge
Scraped job descriptions from Computrabajo, Indeed, and OCC arrive as raw text blobs with inconsistent newline formatting, unbulleted dashes, or dense blocks. This slows candidate review times and causes cognitive fatigue.

### Decision
1. **Client-Side Deterministic Parser (`job_description_parser.ts`)**:
   - Pure function parsing text into structured sections:
     - `overview`: Introductory text, company background, and summary.
     - `responsibilities`: Primary functions, daily duties, activities.
     - `requirements`: Required experience, technologies, education, knowledge.
     - `benefits`: Prestaciones de ley / superiores, perks, insurance, schedule flexibility.
     - `conditions`: Logistics, work schedule, contract type, physical location.
   - Section header regex patterns calibrated for Mexican job postings:
     - Responsibilities: `/^(responsabilidades|funciones|actividades|tareas|lo que har[aá]s|tu rol|principales funciones)[\s:]*$/i`
     - Requirements: `/^(requisitos|perfil|conocimientos|qu[eé] buscamos|habilidades|experiencia requerida|competencias)[\s:]*$/i`
     - Benefits: `/^(beneficios|ofrecemos|prestaciones|qu[eé] ofrecemos|compensaci[oó]n|paquete de compensaciones)[\s:]*$/i`
     - Conditions: `/^(condiciones|horario|jornada|lugar de trabajo|ubicaci[oó]n|tipo de contrato)[\s:]*$/i`
2. **Bullet & Paragraph Tokenization**:
   - Lines prefixed with `[-*•▪▫–—]|\d+[\.\)]` are parsed into clean list items (`<li>` with custom emerald or slate bullet dot).
   - Paragraph text without list markers is rendered in comfortable `<p>` blocks with line-height relaxed (`leading-relaxed text-slate-700 text-xs`).
3. **Card Container Presentation**:
   - Each non-empty section is rendered as an independent white card (`bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs`):
     - Section Header: Icon (`Briefcase`, `ListChecks`, `CheckCircle2`, `Gift`, `MapPin`) + title uppercase tracking-wider.
     - Content: Scannable list or formatted paragraphs.
4. **Defensive Fallback & Sanitization**:
   - If no standard section headers are detected (e.g. short, freeform, or English descriptions), the parser returns all content under `overview` and renders a clean, single overview card.
   - All parsed content is sanitized via `DOMPurify` before DOM insertion to strictly prevent XSS.

### Alternatives Considered
- *Backend LLM extraction during scraping*: Rejected because LLM calls on every vacancy introduce latency (1-3s), API costs, and failure points. A deterministic client regex parses instantaneously (<2ms) and runs offline.

---

## 4. De-Cluttering & Technical Boilerplate Purge

### Context & Challenge
The UI accumulated engineering jargon, version indicators, and bracketed labels that add noise without user value.

### Decision
1. **Header Navigation (`Header.tsx`)**:
   - Remove `v0.1.0 • MX Jr Live` badge.
   - Refactor tab labels to concise, clean terms:
     - `"Búsqueda en Vivo"` → `"Vacantes"`
     - `"Mi Pipeline"` → `"Postulaciones"`
     - `"Mis CVs"` → `"CVs"`
     - `"Perfil Maestro"` → `"Perfil"`
2. **Postulaciones Pipeline (`PipelineView.tsx`)**:
   - Remove `"Almacenamiento Local (IndexedDB)"` badge.
   - Simplify header to `Postulaciones ({count})`.
3. **Resume Library (`ResumeLibraryView.tsx`)**:
   - Remove promotional paragraph `"Currículums adaptados a vacantes y por roles técnicos generados en tu navegador con cero servidores."`
   - Replace bracketed badge strings:
     - `[VACANTE: {company}]` → `{company}` (with subtle building icon or cyan badge)
     - `[ROL: {role}]` → `{role}` (with purple badge)
4. **Master Profile Editor (`MasterProfileEditor.tsx`)**:
   - Remove `(Master Career Knowledge Base)` secondary subtitle.
   - Replace bracketed validation badges:
     - `[ESTRUCTURA VÁLIDA]` → `Estructura válida`
     - `[ERROR EN LÍNEA ...]` → `Error en línea ...`
5. **Deduplication Notification (`App.tsx` & `VacancyList.tsx`)**:
   - Remove prominent extraction banner `⚡ Se combinaron N vacantes duplicadas...`.
   - Replace with subtle inline counter in the results count line: e.g. `42 vacantes • 12 combinadas`.

---

## 5. Emil Kowalski Design Engineering & Performance Guidelines

1. **Composite-Only Transitions**: Dropdown popovers and active pill transitions animate exclusively via `opacity` and `transform: scale(...)` inside the 60fps frame budget (`transition-all duration-150 ease-out`).
2. **Tactile Press States**: Interactive pills and buttons incorporate `active:scale-[0.98]` micro-interactions.
3. **Zero Layout Shifts (CLS)**: Toolbar maintains fixed height; popovers use absolute positioning with high z-index without displacing siblings.
4. **Accessible Keyboard & Focus**: Popovers close on `Escape`; Tab navigation cycles through toolbar controls in logical visual order.
