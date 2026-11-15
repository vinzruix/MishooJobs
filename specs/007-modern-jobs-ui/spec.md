# Feature Specification: Modern Split-View Jobs Layout & Clean UI Redesign

**Feature Branch**: `007-modern-jobs-ui`

**Created**: 2026-11-15

**Status**: Clarified

**Input**: User description: "I do really like this design and structure for the jobs, copy it but include the things that we have done, BUT WITH THAT STYLE AND COLORS. ALSO PLEASE DELETE THE TEXT UNECESSARY THAT DOES NOT PROVIDE ANY VALUE TO THE APP TEXT LIKE: 'FILTROS MEXICANOS' 'MISHOOJOBS DESARROLLADO PARA JR' ALL THAT SLOP TEXT THAT IS NOT USEFUL"

## Clarifications

### Session 2026-11-15
- Q: How should the content in the right-hand job detail pane be organized across the segmented pill tabs? → A: Two segmented tabs: `Descripción` (job overview, responsibilities, requirements, and scam alerts) and `Evaluación AI` (compatibility match score, matched skills, missing skill gaps, seniority audit reasoning, and CV tailoring action).
- Q: What desktop split-view column proportion should be used for the master-detail layout? → A: 40% width for the left vacancy list (`lg:col-span-5` in a standard 12-column grid) and 60% width for the sticky right detail pane (`lg:col-span-7`), maintaining a minimum width of 420px for the detail pane on viewports ≥ 1024px to ensure the 4-column pastel metric grid renders comfortably without wrapping.
- Q: How should the detail view adapt on mobile and small viewports (< 1024px)? → A: Slide-up bottom sheet with gesture drag-to-dismiss and an explicit close button, keeping the fixed "Postularme ahora" action accessible at the bottom.
- Q: What is the initial selection behavior when searching or streaming results? → A: Automatically select the first vacancy as soon as the first stream batch arrives; while streaming initial results before first arrival, render a clean skeleton state in both list and detail pane with pastel placeholders.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Desktop Master-Detail Split-View Exploration (Priority: P1)

A job seeker on desktop searches for software opportunities and browses listings in a side-by-side 40/60 master-detail layout. The left column (40% width) presents a scrollable list of clean, elevated job cards accompanied by a header indicating the total search results count (e.g., "29 vacantes encontradas"). Clicking or keyboard-navigating to any job card immediately updates the dedicated right-hand detail pane (60% width, min-w 420px) with full job specifications, requirements, and actions without opening a separate modal dialog.

**Why this priority**: The master-detail layout is the core structural paradigm from the reference design. Eliminating modal dialogs on desktop allows rapid scanning and reading of vacancies with zero modal opening/closing overhead.

**Independent Test**: A candidate enters a search query, views the left column populated with vacancy cards and the right column showing the currently selected job's full details, and navigates between cards observing immediate detail updates in the right pane.

**Acceptance Scenarios**:

1. **Given** a populated search results list on a desktop viewport (≥ 1024px), **When** the page loads and the first stream batch arrives, **Then** the first vacancy is selected by default and its full details render in the right pane.
2. **Given** the master-detail view on desktop, **When** the candidate clicks any card in the left list or presses `j`/`k` / arrow keys, **Then** the selected card receives active visual styling and the right panel immediately reflects that vacancy's details.
3. **Given** a long list of vacancies in the left column, **When** the user scrolls through the list, **Then** the right detail panel remains pinned and visible within the viewport.
4. **Given** a mobile or small viewport (< 1024px), **When** the user selects a job card, **Then** the application gracefully presents the full detail view as a focused slide-up bottom sheet with swipe-to-dismiss gesture and an explicit close button, preserving all detail functionality.

---

### User Story 2 - Modern Light Visual Design System & Pastel Metric Cards (Priority: P2)

A job seeker experiences a modern, clean, light-themed aesthetic inspired by the reference design. The canvas uses a soft light neutral background with crisp white cards (`rounded-2xl` / `rounded-3xl`), subtle borders, and high-contrast dark accent pills. In the detail pane, four distinct pastel metric blocks immediately summarize key job parameters at a glance:
- **Salario (Salary)**: Soft green pastel card showing compensation details or "A convenir".
- **Modalidad (Job Type)**: Soft sky/cyan pastel card showing work arrangement (Remoto, Híbrido, Presencial).
- **Experiencia / Compatibilidad**: Soft peach/amber pastel card showing minimum required experience (e.g., "0 años") or profile match percentage.
- **Seniority (Nivel)**: Soft violet/purple pastel card displaying the classified seniority level (Primer Empleo Real, Pasantía, Junior, Mid, Senior).

Job cards in the left feed mirror this visual polish with company brand squircle icons, bold titles, clean attribute pills, requirements excerpts, verification badges, and relative publication timestamps.

**Why this priority**: Visual hierarchy, color palette, and pastel data cards are the defining aesthetic characteristics requested by the user, providing immediate readability and high visual appeal.

**Independent Test**: Render any job card and detail pane to verify that colors, typography, border radii, and the 4 pastel metric blocks strictly follow the reference aesthetic and maintain accessible contrast ratios.

**Acceptance Scenarios**:

1. **Given** an open vacancy in the detail view, **When** rendered, **Then** four horizontal pastel cards (Green for Salary, Blue for Modality, Orange for Experience/Match, Purple for Seniority) display with appropriate background tints, dark legible text, and distinct parameter labels without layout collision.
2. **Given** job cards in the left column, **When** rendered, **Then** each card features a rounded company brand squircle, clear title hierarchy, clean pill badges, a requirements snippet, verification status, and relative publication time (e.g., "hace 1 hora").
3. **Given** the overall layout, **When** viewed on screen, **Then** styling uses a light canvas with dark charcoal/black accent pills for active headers, active tabs, and primary action buttons.

---

### User Story 3 - Segmented Detail View Tabs & Streamlined Application Flow (Priority: P3)

In the right detail pane, a candidate seamlessly toggles between vacancy content using a pill-shaped segmented switch:
- **"Descripción"**: Displays the full job summary, detailed responsibilities, formatted requirements with XSS-sanitized content, and scam shield alerts.
- **"Evaluación AI"**: Displays deep AI compatibility scores, skill matches and missing gaps, seniority audit reasoning, and one-click quick actions to tailor a targeted CV.

At the bottom of the detail pane, a high-contrast full-width black pill button ("Postularme ahora" / Apply Now) allows the candidate to open the verified direct application link on the host job portal, accompanied by secondary actions to bookmark/save the job or mark it as applied.

**Why this priority**: Clean tab switching keeps extensive job descriptions and deep AI evaluation data structured and readable without vertical bloat, while the prominent sticky application button provides immediate utility.

**Independent Test**: Navigate between the "Descripción" and "Evaluación AI" tabs in the detail panel, verify tab state transitions, and click "Postularme ahora" to confirm it triggers the verified portal link in a new window.

**Acceptance Scenarios**:

1. **Given** a vacancy with both description and AI evaluation capabilities, **When** the candidate switches between "Descripción" and "Evaluación AI", **Then** the active tab displays as a solid dark pill and the panel content swaps smoothly without reloading.
2. **Given** an active vacancy with verified application links, **When** the candidate clicks "Postularme ahora", **Then** the verified direct URL opens in a new secure window and an option to record the application in the local pipeline is made available.
3. **Given** an active vacancy, **When** the candidate clicks the bookmark icon in either the card or detail header, **Then** the vacancy is instantly saved to local storage with visual confirmation.

---

### User Story 4 - Slop Text Elimination & Clean Mexican Job Localization (Priority: P4)

A job seeker interacts with a streamlined, professional UI entirely free of marketing slogans, redundant badges, and cringe text. Jargon and clutter such as "FILTROS MEXICANOS (Nivel de Experiencia, Modalidad & Fecha)", "MishooJobs • Desarrollado para juniors y estudiantes en México • Moneda MXN ($)", and verbose boilerplate banners are completely removed. The interface presents only functional, high-signal Mexican labor terminology (e.g., *Primer Empleo*, *Pasantía*, *Becario*, *Remoto / Híbrido / Presencial*, *MXN*, *0 años*) in a clean, modern, and confident tone.

**Why this priority**: The user explicitly demanded the purge of all non-value-adding text and slop to elevate the application to a polished, professional product.

**Independent Test**: Inspect all text strings across the header, search area, filter drawer, vacancy cards, detail panel, status bars, empty states, and footer to ensure zero marketing fluff or deprecated slogans remain.

**Acceptance Scenarios**:

1. **Given** the filter options and controls, **When** displayed, **Then** headings and labels are concise (e.g., "Nivel", "Modalidad", "Fecha") without "Filtros Mexicanos" or promotional text.
2. **Given** the page header and footer, **When** rendered, **Then** promotional boilerplate like "Desarrollado para juniors y estudiantes en México" is omitted, maintaining a clean aesthetic with only essential navigation and status indicators.
3. **Given** empty states or loading indicators, **When** visible, **Then** descriptions are direct, helpful, and concise without verbose disclaimers.

---

### Edge Cases

- **Zero search results**: When no jobs match the query or active filters, the left column presents a clean minimalist empty state with suggestions to broaden filters; the right detail panel displays an inviting placeholder guiding the user to adjust criteria.
- **Single job result**: If exactly one vacancy is returned, it is automatically selected and rendered in the detail panel without requiring an extra click.
- **In-flight live streaming**: While results are actively streaming from portals and before the first vacancy arrives, clean pastel skeleton cards render in both list and detail panes to prevent layout shift.
- **Missing or undisclosed salary**: The green pastel card displays "A convenir" or "Sueldo no publicado" cleanly without collapsing or breaking the 4-column layout.
- **Missing experience requirements**: The orange pastel card displays "No especificado" or falls back to the preliminary seniority tier without layout disruption.
- **Extremely long company names or job titles**: Titles truncate gracefully with ellipsis after 2 lines on cards, and wrap naturally with balanced leading in the detail view.
- **Confidential employer postings**: Anonymous company listings ("Empresa Confidencial") display a neutral company icon with generic initials and preserve unique fingerprint selection without collision.
- **Rapid keyboard navigation**: When navigating quickly with `j`/`k` or arrow keys, list scrolling automatically keeps the active card centered in view, and the detail view updates with responsive, debounce-free smoothness.
- **On-demand AI evaluation failure or timeout**: If local `agy` CLI evaluation encounters an error or timeout while inspecting Tab 2 ("Evaluación AI"), a clean card with a retry button ("Reintentar evaluación") and fallback heuristic match score is presented without crashing the detail pane.
- **Window resizing**: Transitioning between desktop (split view) and mobile (single column) viewports smoothly preserves the currently selected vacancy without state loss.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render a master-detail split layout on desktop viewports (≥ 1024px) utilizing a 40% width column for the job feed (`lg:col-span-5` in a 12-column grid) and a 60% width sticky column (`lg:col-span-7`, minimum 420px width) for the full detail pane.
- **FR-002**: The system MUST automatically select the first job in the results list as soon as the initial stream batch arrives and display its contents in the right detail panel, displaying clean pastel skeleton loaders while initial results stream.
- **FR-003**: The system MUST implement a modern light visual theme with an off-white/light-neutral canvas, crisp white container cards with generous rounded corners (`rounded-2xl` to `rounded-3xl`), and high-contrast charcoal/black accent pills.
- **FR-004**: The system MUST display four distinct horizontal pastel metric cards in the detail view:
  - Green pastel card for Salary (amount, frequency, currency, or "A convenir").
  - Blue/Cyan pastel card for Modality (Remoto, Híbrido, Presencial).
  - Orange/Peach pastel card for Experience / Match Score (years required or profile fit percentage).
  - Purple/Violet pastel card for Seniority Level (Primer Empleo Real, Pasantía, Junior, Mid, Senior).
- **FR-005**: Job cards in the left feed MUST include: rounded squircle company logo badge, company name, bold job title, location and modality, compact attribute pills, requirements preview excerpt, verification status badge, relative publication timestamp, and save/bookmark toggle.
- **FR-006**: The right detail pane MUST provide a segmented 2-tab switch between "Descripción" (overview, responsibilities, requirements, scam shields) and "Evaluación AI" (deep match score, matched skills, skill gaps, audit reasoning, CV tailoring), where the active tab is highlighted with a solid dark pill.
- **FR-007**: The detail view MUST feature a full-width, high-contrast dark action button ("Postularme ahora") anchored at the bottom of the pane, opening the verified direct application link in a new tab.
- **FR-008**: The system MUST purge all non-value-adding marketing text, slogans, and promotional boilerplate, specifically eliminating "FILTROS MEXICANOS", "MishooJobs desarrollado para Jr", and verbose footer disclaimers.
- **FR-009**: The system MUST preserve all existing core platform capabilities:
  - Live multi-portal SSE job stream (Computrabajo, Indeed, OCC Mundial).
  - 5-tier seniority classification with emerald 0-experience badge and deceptive requirement alerts.
  - Scam and predatory posting detection shields (MLM, candidate fee, 100% commission, unpaid work).
  - Active URL verification via HTTP HEAD checks.
  - Client-side IndexedDB local persistence (Master Profile, targeted CVs, saved pipeline, hide-applied state).
  - On-demand AI evaluation and CV tailoring workflows.
  - Full keyboard navigation (`/` to focus search, `j`/`k` to navigate vacancies, `Space` to cycle detail tabs, `Enter` to open application link, `s` to save, `a` to mark applied, `Esc` to dismiss mobile sheet).
- **FR-010**: On mobile and narrow viewports (< 1024px), the system MUST adapt the master-detail layout into a responsive single-column list with a dedicated slide-up bottom sheet with gesture drag-to-dismiss and explicit close button for the detail view upon selecting a card.

### Key Entities

- **Job Listing Feed Item**: Represents the summary view of a vacancy rendered in the left master column, containing identifiers, company metadata, compensation summary, location, primary tags, and verification flags.
- **Job Detail View Model**: Represents the full comprehensive state of the currently active vacancy rendered in the right detail column, including full description, segmented tabs, pastel metrics, seniority audit results, scam analysis, and external application links.
- **Pastel Metric Card**: Visual data entity containing a categorized label, formatted value, semantic pastel theme (green, blue, orange, purple), and optional tooltip or click interaction.
- **Search & Filter Parameters**: Encapsulates active query, seniority filter, timeframe selection, modality filter, and sort preference driving the job feed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of desktop users (viewports ≥ 1024px) can review full vacancy descriptions and requirements without opening a separate popup modal dialog, reducing the interaction cost of inspecting a job from 2 actions (open modal + close modal) to 0 additional clicks.
- **SC-002**: Switching between active vacancies in the master-detail view updates the detail panel with a perceived latency of less than 50 milliseconds.
- **SC-003**: 0 occurrences of deprecated promotional or slop text ("Filtros Mexicanos", "MishooJobs desarrollado para Jr", etc.) remain across any user-facing screen or component.
- **SC-004**: 100% of existing functional features (live streaming, seniority pills, scam shield badges, verified links, hide applied, CV tailoring, keyboard shortcuts) remain fully operable and accessible in the redesigned layout.
- **SC-005**: All text elements on cards and pastel blocks meet or exceed WCAG AA contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text).
- **SC-006**: On mobile viewports (< 1024px), transitioning between list and detail views via the slide-up sheet takes less than 200 milliseconds with an intuitive drag-to-dismiss gesture.
- **SC-007**: The 4-column horizontal pastel metric block renders without text clipping or squishing across all standard desktop viewports (1024px to 1920px).

## Assumptions

- **Color Palette & Visual Reference**: The design language, card corner radii, pill shapes, and pastel block colors are derived directly from the provided reference mockup (`media_1794723669457_37b7b425.jpg`).
- **Zero Candidate PII Backend**: All profile data, targeted resumes, and application tracking continue to reside exclusively in client-side IndexedDB with zero candidate personal data sent to backend databases.
- **Local AI Execution**: Deep job evaluations and CV tailoring workflows continue to execute via the local `agy` CLI integration without requiring external paid API keys.
- **Localization**: UI text remains in Mexican Spanish with Mexican labor context and default MXN currency, but with concise, modern, and professional phrasing.
- **Responsive Breakpoint**: Desktop split-view layout activates at 1024px width (standard Tailwind `lg:` breakpoint). Viewports below 1024px use a mobile-optimized stack with slide-up sheet.
