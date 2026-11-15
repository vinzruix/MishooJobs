# Phase 0 Research: Modern Split-View Jobs Layout & Clean UI Redesign

**Feature Branch**: `007-modern-jobs-ui`  
**Date**: 2026-11-15  
**Spec Reference**: `specs/007-modern-jobs-ui/spec.md`  

---

## 1. Master-Detail Responsive Layout & Sticky Split Ratios

### Research Context & Problem
The current desktop UI displays a single-column vacancy feed (`VacancyList`) where clicking a card opens an overlay modal dialog (`VacancyDetailModal`). Inspecting a vacancy requires opening and closing a modal repeatedly, causing interaction fatigue and context switching. The reference design and specification mandate a side-by-side 40/60 master-detail desktop layout (breakpoint $\ge$ 1024px `lg:`), where the left column (40% width) scrolls independently while the right detail pane (60% width, min-w 420px) remains pinned in viewport.

### Decision
- **Desktop Layout Structure**:
  - Main container: `grid grid-cols-1 lg:grid-cols-12 gap-6 items-start`.
  - Left column (Master list): `lg:col-span-5` ($\approx 41.6\%$) with infinite/long list scroll, containing header result count (e.g., "29 vacantes encontradas"), active vacancy cards, and clean pagination/empty states.
  - Right column (Detail pane): `lg:col-span-7` ($\approx 58.3\%$) with `sticky top-20` and `max-h-[calc(100vh-6rem)] overflow-y-auto`, ensuring minimum rendered width $\ge 420\text{px}$ on standard 1024px+ viewports.
- **Scroll Synchronization**:
  - Independent scroll container for the right detail pane so deep job descriptions can be read without scrolling the left list away.
  - When the user navigates cards via keyboard (`j`/`k`, $\uparrow$/$\downarrow$), the active card in the left list automatically scrolls into view (`scrollIntoView({ block: 'nearest', behavior: 'smooth' })`).

### Rationale
- Standard CSS grid with Tailwind `lg:col-span-5` and `lg:col-span-7` provides native responsive flexibility without fixed pixel hacks.
- `sticky top-20` ensures the detail pane remains pinned alongside the viewport while browsing hundreds of vacancies.
- Meets SC-001 (0 modal clicks to inspect vacancies on desktop) and SC-002 (<50ms selection switch).

### Alternatives Considered
- *Fixed pixel widths (e.g., 400px fixed left, remaining right)*: Rejected because it does not adapt well between standard 1080p, 1440p, and Ultrawide displays.
- *Flexbox with percentage width*: Viable, but Tailwind's 12-column grid (`col-span-5` / `col-span-7`) is cleaner, handles gaps consistently, and avoids box-sizing rounding jitter.

---

## 2. Modern Light Visual Design System & Pastel Metric Cards

### Research Context & Problem
The legacy UI utilized a dark monochrome style (`bg-zinc-950`, `text-zinc-100`, green pixel accents). The user explicitly requested adopting the clean light visual aesthetic of the reference design (`media_1794723669457_37b7b425.jpg`): an off-white/light-neutral canvas, crisp white container cards with generous rounded corners (`rounded-2xl` to `rounded-3xl`), subtle borders, high-contrast dark accent pills, and 4 distinct pastel metric blocks.

### Decision
- **Color Palette & Visual Tokens**:
  - Canvas background: Soft light neutral/warm zinc (`bg-[#F8F9FA]` / `bg-slate-50`).
  - Container cards: Pure white (`bg-white`), border `border-slate-200/80`, shadow `shadow-xs shadow-slate-200/50`, radius `rounded-2xl` or `rounded-3xl`.
  - Typography: Clean sans-serif (`font-sans`), high-contrast slate text (`text-slate-900` for titles, `text-slate-600` for body, `text-slate-400` for secondary metadata).
  - Accent pills & primary buttons: Deep charcoal/black (`bg-slate-900 text-white hover:bg-slate-800`), providing stark, authoritative contrast against pastel cards.
- **Pastel Metric Blocks (4-column grid in detail view)**:
  - **Salario (Salary)**:
    - Background: `bg-emerald-50` / `border-emerald-200`
    - Label & Icon: `text-emerald-700` / `DollarSign`
    - Value: `text-emerald-950 font-bold` (e.g., "$15,000 - $22,000 MXN/mes" or "A convenir")
  - **Modalidad (Work Arrangement)**:
    - Background: `bg-sky-50` / `border-sky-200`
    - Label & Icon: `text-sky-700` / `MapPin` or `Globe`
    - Value: `text-sky-950 font-bold` (e.g., "Remoto", "Híbrido", "Presencial")
  - **Experiencia / Compatibilidad**:
    - Background: `bg-amber-50` / `border-amber-200`
    - Label & Icon: `text-amber-700` / `Briefcase` or `Sparkles`
    - Value: `text-amber-950 font-bold` (e.g., "0 años" or "85% Match")
  - **Seniority (Nivel)**:
    - Background: `bg-purple-50` / `border-purple-200`
    - Label & Icon: `text-purple-700` / `Award`
    - Value: `text-purple-950 font-bold` (e.g., "Primer Empleo Real", "Junior", "Pasantía")
- **WCAG AA Compliance**: All pastel combinations use dark 900/950 text over 50-tint backgrounds, easily exceeding the 4.5:1 contrast requirement (achieving 8:1+ contrast).

### Rationale
- Directly mirrors the reference design layout and typography.
- Pastel blocks allow instant pre-attentive cognitive processing of salary, modality, experience, and seniority before reading long paragraphs.

### Alternatives Considered
- *Dark mode pastel cards*: Dimmed pastel cards in dark mode look muddy and reduce legibility. The project constitution and feature spec mandate transitioning to the modern light aesthetic.

---

## 3. Mobile (< 1024px) Detail Presentation via Gesture-Driven Bottom Sheet

### Research Context & Problem
On mobile screens and narrow tablets (< 1024px), displaying 40/60 side-by-side columns causes severe horizontal crowding and unreadable text. When a candidate taps a job card on mobile, the detail view must appear fluidly as a slide-up bottom sheet with gesture drag-to-dismiss and an explicit close button.

### Decision
- **Library Selection**: Use **Vaul** (`vaul@^1.1.2`), recommended by Emil Kowalski's `pick-ui-library` and `gestures` skills for production-grade bottom sheets.
- **Verification**: Verified offline npm compatibility; `vaul` installs with 0 peer dependency conflicts on React 19.
- **UX & Gesture Details**:
  - `Drawer.Root` with `Drawer.Portal`, `Drawer.Overlay` (semi-transparent backdrop fade), and `Drawer.Content`.
  - Handle bar: Subtle top pill handle (`w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-3`) for physical drag affordance.
  - Interruptible physical springs: 1:1 finger tracking with velocity-aware fling-to-dismiss or distance threshold release.
  - Sticky bottom action: The "Postularme ahora" button remains anchored at the bottom of the drawer content with `env(safe-area-inset-bottom)` padding for iOS devices.
  - Explicit close button (`X` icon) at top-right for desktop-like accessibility.
  - Responsive conditional: The desktop master-detail split renders `VacancyDetailPane` inline; on viewports < 1024px, card tap opens the `Vaul` drawer containing the exact same `VacancyDetailPane` component.

### Rationale
- Vaul handles complex mobile edge cases (momentum dragging, nested scroll locking, iOS rubber-banding, focus trap, Escape key) without hundreds of lines of fragile hand-rolled touch handlers.
- Unifies the detail view implementation: `VacancyDetailPane` is a single reusable presentational component used both in desktop split grid and in mobile Vaul drawer.

### Alternatives Considered
- *Standard modal pop-up on mobile*: Modals on mobile feel clumsy, detach from thumb reachability, and lack natural dismissal ergonomics.
- *Full-page route navigation*: Causes state loss, resets scroll position in the live SSE stream, and breaks zero-refresh fluidity.

---

## 4. Segmented Detail Tabs & Evaluation State Management

### Research Context & Problem
Each job vacancy contains extensive data: raw scraped job description, structured responsibilities, requirements, scam warnings, AI match score, matching skills, skill gaps, seniority audit reasoning, and CV tailoring actions. Displaying all of this simultaneously creates a towering vertical wall of text.

### Decision
- **2-Tab Segmented Switch**:
  - Container: `bg-slate-100 p-1 rounded-xl flex gap-1 w-fit`.
  - Tabs:
    1. **"Descripción"**: Renders scam alerts (if any), job summary, responsibilities, requirements (DOMPurified/sanitized), and desired skills.
    2. **"Evaluación AI"**: Renders deep AI compatibility score, matched vs. missing skills, seniority audit verdict (with discrepancy badges), and the "Adaptar mi CV" button.
  - Active Tab Styling: Solid dark pill (`bg-slate-900 text-white shadow-xs font-semibold px-4 py-1.5 rounded-lg text-xs transition-all duration-150`).
  - Inactive Tab Styling: Transparent hover pill (`text-slate-600 hover:text-slate-900 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors`).
- **State Synchronization & Cache Isolation**:
  - Tab state (`activeTab: "description" | "ai_eval"`) defaults to `"description"`.
  - `VacancyDetailPane` takes `key={vacancy.fingerprint}` or resets internal tab state when `vacancy.fingerprint` changes, ensuring an evaluation tab selection does not leak into an un-evaluated newly selected vacancy.
  - AI evaluation cache (`evalCache: Record<string, AIEvaluation>`) is passed down so previously computed evaluations load instantaneously (<10ms).

### Rationale
- Keeps the detail pane compact and focused.
- Allows candidates who only want to read the job description to do so immediately, while providing one-click access to deep AI matching without layout shifting.

---

## 5. Slop Text & Marketing Boilerplate Purge Inventory

### Research Context & Problem
The user explicitly demanded:
> "DELETE THE TEXT UNECESSARY THAT DOES NOT PROVIDE ANY VALUE TO THE APP TEXT LIKE: 'FILTROS MEXICANOS' 'MISHOOJOBS DESARROLLADO PARA JR' ALL THAT SLOP TEXT THAT IS NOT USEFUL"

### Audit & Elimination Inventory

| File | Exact Deprecated Text / Slogan | Replacement / Action |
| --- | --- | --- |
| `frontend/src/components/FilterDrawer.tsx:124` | `Filtros Mexicanos (Nivel de Experiencia, Modalidad & Fecha)` | Replace with clean, functional header: `Filtros` or remove header bar altogether in favor of sleek compact filter pills. |
| `frontend/src/App.tsx:624` | `MishooJobs • Desarrollado para juniors y estudiantes en México • Moneda MXN ($)` | Delete footer boilerplate. Replace with minimal copyright / version tag (`MishooJobs • MXN ($)`) or remove entirely. |
| `frontend/src/App.tsx:420-431` | `100% Búsqueda en Vivo: Concurrencia directa contra Computrabajo, Indeed y OCC. Sin base de datos estática ni registros previos. / Sin cuenta • Privacidad en tu navegador` | Eliminate verbose green banner. Replace with subtle, unobtrusive portal status dots in the search bar or header. |
| `frontend/src/components/VacancyList.tsx:64` | `Consultando bolsas de empleo mexicanas en vivo... / Verificando enlaces directos vía HTTP HEAD en tiempo real.` | Simplify to clean, concise loading copy: `Buscando vacantes...` |
| `frontend/src/components/VacancyList.tsx:77-83` | `¡Te has postulado a todas las vacantes encontradas para este criterio! Has completado la postulación...` | Retain empty state but simplify copy to concise status: `Todas las vacantes visibles han sido postuladas.` |
| `frontend/src/components/VacancyCard.tsx:94` | `0 Exp Preliminar — Requiere auditoría` | Replace verbose tooltips with clean concise tag: `[ 0 EXP ]` and `[ ✓ 0 EXP ]`. |

### Rationale
Eliminating self-congratulatory marketing copy, unprompted disclaimers, and redundant slogans produces an authoritative, distraction-free product interface.

---

## 6. First-Item Auto-Selection, Skeleton States & Keyboard Navigation

### Research Context & Problem
In a master-detail split layout, if no card is selected initially, the right detail pane appears empty and broken. Additionally, when searching, there is an in-flight streaming phase before the first vacancy arrives from Computrabajo, Indeed, or OCC.

### Decision
- **Auto-Selection on Stream Arrival**:
  - Maintain `selectedVacancy: JobVacancy | null` in `App.tsx`.
  - When the vacancy list updates from empty to non-empty (e.g. `vacancies.length > 0 && (!selectedVacancy || !vacancies.some(v => v.fingerprint === selectedVacancy.fingerprint))`), automatically select `vacancies[0]`.
- **Skeleton Loaders During In-Flight Streaming**:
  - While `isSearching && vacancies.length === 0`, render:
    - Left column: 4 pastel/slate skeleton cards with shimmering pulse effect (`animate-pulse bg-slate-200/60 rounded-2xl`).
    - Right column: Full-height skeleton detail pane with placeholder squircle, title bar, 4 pastel metric block skeletons, and paragraph shimmer lines.
- **Keyboard Navigation Preservation**:
  - `j` / `↓`: Select next card, scroll into view, update detail pane.
  - `k` / `↑`: Select previous card, scroll into view, update detail pane.
  - `Enter` / `Space`: Toggle between `Descripción` and `Evaluación AI` tabs or trigger primary application action.
  - `s`: Bookmark / Save active vacancy.
  - `a`: Mark active vacancy as applied.
  - `Esc`: Close mobile bottom sheet (if open) or deselect.

### Rationale
- Zero-click immediate detail inspection.
- Prevents layout jump when SSE chunks stream in.
- Preserves full accessibility and keyboard ergonomics.

---

## Summary of Decisions

1. **Master-Detail Layout**: 12-column responsive grid (`lg:col-span-5` / `lg:col-span-7`), sticky right pane, min-w 420px.
2. **Visual System**: Modern light theme (`#F8F9FA` canvas, white `rounded-2xl` cards, slate-900 accent pills).
3. **Pastel Metrics**: 4 semantic pastel blocks (Green = Salary, Blue = Modality, Amber = Experience, Purple = Seniority).
4. **Mobile Bottom Sheet**: Vaul drawer with drag-to-dismiss, touch physics, and explicit close button for < 1024px.
5. **Segmented Tabs**: 2 pill tabs (`Descripción` and `Evaluación AI`) with strict fingerprint-keyed cache isolation.
6. **Slop Text Elimination**: 100% removal of "Filtros Mexicanos", "Desarrollado para juniors", verbose banners, and redundant marketing text.
7. **Keyboard & Streaming UX**: Auto-select first vacancy on arrival, shimmering pastel skeletons, and full `j`/`k`/`s`/`a` shortcut support.
