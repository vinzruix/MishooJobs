# Feature Specification: Compact Filter Toolbar, Redundancy Elimination, Content De-Cluttering & Structured Job Descriptions

**Feature Branch**: `008-compact-filters-cleanup`

**Created**: 2026-11-15

**Status**: Draft

**Input**: User description: "Currently i don like the filters structure in our application, we have buttons of the sames filters everywhere and filtesrs seccion is giant. 1.-Create the specifications to copy the visual look of the filter in the image. 2.- We need just 1 filter per thing, DELETE REPEAT FILTERS 3.- WE DONT NEED THE FILTER OF REGION NEXT TO THE SEARCH BAR DELETE IT 4.- DELETE THE LABELS AND TEXT THAT DOES NOT PROVIDE ANY VALUE IN ALL THE PAGES MI CV, POSTULACIONES DASHBOARD 5.- THE DESCRIPTION OF THE JOBS IS JSUT THE PLAIN TEXT WITH ANY SORT, PLEASE GIVE IT A VISUAL STRUCTURE. CREATE A SPECIFY OF ALL THIS."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compact Horizontal Filter Toolbar (Priority: P1)

As an early-career candidate searching for vacancies,
I want a clean, unified, single-row filter toolbar matching the compact layout of modern data dashboards (with dropdown pills, segmented buttons, and live counters),
So that I can quickly refine job results without an oversized filter section pushing listings off the screen.

**Why this priority**: The current filter section is overly large and occupies excessive vertical space. Consolidating all filters into a sleek, horizontal toolbar provides immediate visual access to job listings while maintaining full filtering power.

**Independent Test**: Can be tested by navigating to the main vacancies feed, viewing the compact single-row toolbar, and toggling timeframe, seniority, and modality options from their respective compact controls to verify that listings update immediately without layout jumps.

**Acceptance Scenarios**:

1. **Given** the candidate is on the main job search screen, **When** the page renders, **Then** all filter controls are presented in a unified horizontal toolbar with dropdown pills and segmented controls instead of a multi-row stacked box.
2. **Given** the filter toolbar, **When** the candidate clicks the Date dropdown pill (e.g. "Últimos 7 días"), **Then** a compact popover menu opens displaying time options (Hoy, 3 días, 7 días, 14 días, 30 días, Todas) along with the real-time vacancy count for each option.
3. **Given** the filter toolbar, **When** the candidate views experience levels, **Then** experience tiers are presented as a contiguous segmented pill group (e.g., `[ Todos 42 | Primer Empleo 8 | Pasantías 5 | Junior 18 | Mid 7 | Senior 4 ]`) where clicking an item filters the results instantly and updates the active highlighted state.
4. **Given** the candidate selects one or more non-default filters, **Then** an unobtrusive "Restablecer" (Reset) button appears in the toolbar to clear all active filters in a single click.

---

### User Story 2 - Elimination of Redundant Filters & Region Input Removal (Priority: P1)

As a candidate navigating job search,
I want each filter criterion to exist in exactly ONE obvious place and the region input removed from the search bar,
So that I am not confused by duplicate controls competing for attention on the same page.

**Why this priority**: Having duplicate buttons for the same filter (e.g. seniority buttons both in a top drawer and repeated above the listings feed) creates cognitive clutter, increases maintenance complexity, and degrades usability. Removing the separate region box simplifies the primary search action.

**Independent Test**: Can be verified by auditing the entire search interface to confirm that seniority, timeframe, modality, and hide-applied filters appear only once in the toolbar, and that the search bar contains solely the keyword input and submit action without any region text input.

**Acceptance Scenarios**:

1. **Given** the search bar, **When** viewed on any device, **Then** there is no separate region or location text field next to the search input; candidates enter their search keywords (e.g. "Python Junior", "React Remoto") into a single streamlined search bar.
2. **Given** the vacancy results feed, **When** listings are displayed, **Then** the secondary horizontal seniority pill row previously rendered above the vacancy list is gone, leaving the toolbar's segmented control as the sole seniority selector.
3. **Given** the date and hide-applied controls, **When** inspecting the interface, **Then** each exists as exactly one interactive element in the toolbar without duplicate counterparts in other containers.

---

### User Story 3 - Structured Visual Hierarchy for Job Descriptions (Priority: P2)

As a candidate reading a vacancy's details,
I want the job description formatted into clear, structured visual sections (Overview, Responsibilities, Requirements, Benefits, Conditions) with scannable bullet points and badges,
So that I can quickly assess whether I qualify without reading a dense, unformatted block of plain text.

**Why this priority**: Scraped job postings frequently arrive as raw text blobs with inconsistent line breaks. Structuring this content into scannable visual sections drastically improves candidate reading speed, comprehension, and decision quality.

**Independent Test**: Can be tested by opening any job listing in the detail panel or mobile sheet and verifying that plain-text descriptions are automatically parsed and displayed with distinct section headings, bulleted lists, and highlighted requirement badges rather than a single monolithic text block.

**Acceptance Scenarios**:

1. **Given** a job vacancy with unstructured text, **When** the candidate views the description tab, **Then** the content is presented with clean visual hierarchy: distinct section cards or headings for "Resumen del Puesto", "Responsabilidades y Funciones", "Requisitos y Conocimientos", and "Beneficios y Prestaciones" when detected.
2. **Given** a job description containing list items (e.g., lines prefixed with dashes, asterisks, or numbers), **When** rendered, **Then** each item is displayed as a styled bullet point with comfortable spacing and readable line height.
3. **Given** a job description with technical requirements or skill keywords, **When** rendered, **Then** these requirements are visually highlighted or tagged so candidates can immediately spot required tools and languages.
4. **Given** a brief or minimally structured description that lacks explicit section headings, **When** rendered, **Then** the system gracefully presents the content as an elegant, formatted overview card without generating empty or misleading placeholder sections.

---

### User Story 4 - Purge of Low-Value Text & Technical Boilerplate Across All Views (Priority: P2)

As a job seeker using the application,
I want all screens (Dashboard/Search, Postulaciones, and Mi CV) free of verbose promotional explanations, technical implementation badges, and redundant labels,
So that the interface feels professional, fast, focused, and respectfully quiet.

**Why this priority**: Technical badges (like "IndexedDB Local Storage", "v0.1.0 • MX Jr Live"), promotional phrases ("con cero servidores", "en tiempo real"), and bracket prefixes (`[VACANTE: ...]`, `[ROL: ...]`) add visual clutter without helping candidates find or apply for jobs.

**Independent Test**: Can be verified by reviewing all screens (Header, Dashboard, Postulaciones, Mi CV, and Modal dialogs) to ensure all technical implementation jargon, redundant explanatory paragraphs, and bracket tags have been replaced with concise, human-centered labels.

**Acceptance Scenarios**:

1. **Given** the top navigation bar, **When** viewed by a user, **Then** technical build labels (such as "v0.1.0 • MX Jr Live") are removed, and navigation items use concise terms: "Vacantes", "Postulaciones", "CVs", and "Perfil".
2. **Given** the Postulaciones (Pipeline) view, **When** rendered, **Then** implementation badges such as "Almacenamiento Local (IndexedDB)" are removed, presenting a clean title and status tabs.
3. **Given** the Mi CV (Resume Library) view, **When** rendered, **Then** long explanatory text ("Currículums adaptados a vacantes y por roles técnicos generados en tu navegador con cero servidores") is removed, and resume badges display clean labels without bracket wrappers (e.g. "Mercado Libre" instead of "[VACANTE: Mercado Libre]").
4. **Given** the Master Profile Editor, **When** opened, **Then** internal database explanations regarding local browser persistence are removed, keeping only actionable form guidance.
5. **Given** the search feed, **When** deduplication occurs, **Then** intrusive technical extraction banners ("⚡ Se combinaron N vacantes duplicadas...") are replaced with a subtle, non-disruptive counter or removed entirely.

---

### Edge Cases

- **Mobile Viewports (<768px)**: When the horizontal toolbar cannot fit all segmented options side-by-side, it must scroll horizontally with smooth touch momentum or collapse secondary filters into a clean dropdown without wrapping into an unsightly multi-line block.
- **Unstructured / Foreign Language Descriptions**: When a job description does not use standard Spanish section keywords (e.g., an all-English posting or freeform text), the visual formatter must preserve the text faithfully with clean typography, paragraphs, and list formatting without dropping content.
- **Rapid Filter Toggling**: When the user quickly switches between seniority pills or dates, vacancy counters and list items must update smoothly without flicker or stale counts.
- **Zero Results State**: When a filter combination yields zero matches, the empty state must display a single-sentence explanation and a one-click button to reset filters.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render all vacancy filters within a unified, compact, horizontal toolbar above the vacancy feed.
- **FR-002**: The filter toolbar MUST incorporate a Date filter dropdown pill displaying the active selection and opening a popover with timeframe options and live matching counts.
- **FR-003**: The filter toolbar MUST incorporate a Seniority segmented control with live vacancy counters for each experience tier (Todos, Primer Empleo Real, Pasantía, Junior, Mid, Senior).
- **FR-004**: The filter toolbar MUST provide a Modality filter dropdown (Todas, Remoto, Híbrido, Presencial).
- **FR-005**: The filter toolbar MUST provide a Hide Applied toggle or pill with the count of currently hidden applications.
- **FR-006**: The system MUST provide exactly ONE control per filter criterion across the entire search interface, removing all duplicate seniority and date controls from the vacancy list and secondary drawers.
- **FR-007**: The system MUST remove the region/location text input from the search bar, leaving only the keyword input and search trigger.
- **FR-008**: The system MUST remove the legacy multi-row expandable FilterDrawer container in favor of the compact toolbar.
- **FR-009**: The system MUST parse unstructured job descriptions into scannable semantic visual sections (Summary, Responsibilities, Requirements, Benefits, Conditions) whenever corresponding content patterns are detected.
- **FR-010**: The system MUST format raw bullet lines (dashes, asterisks, numbers) in job descriptions into styled, readable list elements with comfortable line spacing.
- **FR-011**: The system MUST sanitize all formatted job description content against XSS vulnerabilities prior to rendering.
- **FR-012**: The system MUST eliminate all technical implementation badges (e.g. "IndexedDB", version tags) and promotional marketing boilerplate across Header, Dashboard, Postulaciones, and Mi CV screens.
- **FR-013**: The system MUST replace bracketed tags (`[VACANTE: ...]`, `[ROL: ...]`) in the CV library with modern, bracket-free badge designs.
- **FR-014**: The system MUST provide an instant "Restablecer" (Reset) action whenever one or more non-default filters are active.

### Key Entities

- **FilterState**: Represents the active filter combination selected by the candidate:
  - `timeframe`: Active timeframe selection (e.g., all, 24h, 3d, 7d, 14d, 30d).
  - `seniority`: Active seniority tier (e.g., all, primer_empleo, pasantia, junior, mid, senior).
  - `modality`: Active work modality (e.g., all, remoto, hibrido, presencial).
  - `hide_applied`: Boolean indicating whether applied vacancies are filtered out.
- **StructuredJobDescription**: Represents the visually organized representation of a job vacancy:
  - `overview`: Introductory summary or company context.
  - `responsibilities`: List of primary duties and daily tasks.
  - `requirements`: List of mandatory qualifications, skills, and experience prerequisites.
  - `benefits`: List of perks, legal benefits (*prestaciones de ley/superiores*), and compensation elements.
  - `logistics`: Additional working conditions (work schedule, contract type, on-site location).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The vertical space consumed by filter controls on desktop screens is reduced by at least 65% (from an average of ~240px tall drawer to a ~48px single-row toolbar).
- **SC-002**: Redundant filter controls are reduced from 2-3 duplicate instances per criterion down to exactly 1 canonical control per criterion.
- **SC-003**: 100% of technical implementation boilerplate (e.g., "IndexedDB", build version tags) and bracket-prefixed badge text is eliminated across all main views.
- **SC-004**: Candidates can scan and identify key requirements and responsibilities in job descriptions in under 10 seconds due to structured sectioning.
- **SC-005**: Filter state changes update the displayed vacancy feed and counter badges in under 50 milliseconds.
- **SC-006**: The horizontal toolbar adapts responsively across mobile, tablet, and desktop viewports without horizontal layout breakage or visual clipping.

## Assumptions

- **Location Filtering**: Removing the explicit region input next to the search bar is intended to streamline the primary search flow; candidates desiring a specific city or remote modality can include it in their search query (e.g., "React Guadalajara", "Python Remoto") or use the Modality filter pill in the toolbar.
- **Job Description Parsing**: Parsing is performed deterministically on client-side text using robust regex pattern recognition (matching common Spanish job posting section headers and list markers) to maintain instant zero-latency rendering without incurring additional server calls.
- **Zero Candidate Data Impact**: These UI/UX improvements do not alter the underlying candidate privacy model or IndexedDB storage schema.
