# Feature Specification: Smart Seniority Classification & "First REAL Job" Detection

**Feature Branch**: `003-smart-seniority-classification`

**Created**: 2026-11-07

**Status**: Draft

**Input**: User description: "Feature: Smart Seniority Classification & 'First REAL Job' Detection. Goal: Replace the redundant, verbose student tags (residencias, dualidad, servicio_social, intern, becario) with a clean, streamlined 5-tier experience filter: Pasantía (Internship), First REAL Job (0 Exp), Junior, Mid, and Senior. Leverage AI (orchestrated via the local agy CLI) to classify and audit each vacancy, ensuring the First REAL Job filter strictly surfaces authentic formal employment offers that require zero previous commercial work experience."

## Clarifications

### Session 2026-11-07

- Q: When should the Step 2 (Deep AI Audit) be executed within the vacancy processing lifecycle? (FR-002) → A: Option A (On-Demand & Modal Inspection): Live streaming uses deterministic fast-pass; the deep AI audit runs when a candidate opens vacancy details or requests an evaluation, permanently caching results in PostgreSQL by fingerprint hash.
- Q: How should the new 5-tier experience filter replace the existing `category` ("Todos los formatos", "Becario", "Prácticas", etc.) filter across the UI and data layer? (FR-001) → A: Option B (Full-Stack Purge): Delete `category` entirely from PostgreSQL, backend DTOs, scrapers, and frontend types, migrating the entire codebase exclusively to `seniority_level`.
- Q: How should the system distinguish between a preliminary fast-pass classification and a confirmed AI audit on vacancy cards and in sorting? (FR-011, FR-012) → A: Option A (Explicit audit_status: preliminary / verified): Track audit state with an enum (`preliminary` | `verified`); prioritize verified listings at the top of the "Primer Empleo Real" feed and display an emerald verification indicator on verified cards.
- Q: What provisional tier should the Step 1 fast-pass assign to vacancies with neutral titles and descriptions that lack any mention of years of experience or seniority keywords? (FR-014) → A: Option A (Default to junior): Provisional tier defaults to `junior` with `preliminary` status, reflecting the early-career developer baseline until refined by deep AI audit upon modal inspection.
- Q: How should the system verify "formal compensated employment" for "Primer Empleo Real" when a vacancy omits explicit numerical salary figures (e.g., states "Sueldo no mostrado" or "A convenir")? (FR-001, FR-006) → A: Option A (Presumed Paid Unless Flagged): Postings with undisclosed or negotiable salaries qualify as `primer_empleo` if they require 0 years of experience, represent commercial employment, and pass the Anti-Scam Shield with zero unpaid labor / fee flags.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authentic "First REAL Job" (0 Exp) Discovery & Verification (Priority: P1)

As a fresh graduate, bootcamper, or self-taught developer in Mexico with no commercial work history, I want to filter vacancies specifically for authentic "First Real Job" positions requiring strictly 0 years of experience, so that I can apply with confidence to formal paid employment offers without wasting time on fake junior positions that secretly demand 1-3 years of production experience.

**Why this priority**: Core value proposition of the platform. Early-career developers face intense application fatigue and rejection from deceptive "entry-level" postings. Delivering a guaranteed 0-experience filter solves the biggest pain point in junior job hunting.

**Independent Test**: Conduct a search (e.g., "Frontend Developer" or "Python Junior") and click the "Primer Empleo Real (0 Exp)" filter pill. Inspect each displayed card to verify that it displays the high-contrast emerald `[ PRIMER EMPLEO REAL ]` badge, requires strictly 0 years of prior commercial work experience, represents formal paid employment, and excludes any position demanding 1 or more years of verifiable experience.

**Acceptance Scenarios**:

1. **Given** a feed of live vacancies, **When** the candidate activates the "Primer Empleo Real (0 Exp)" filter, **Then** only vacancies audited and confirmed to require strictly 0 years of commercial work experience and representing formal paid employment are displayed.
2. **Given** a vacancy requiring 0 years of experience and formal compensation, **When** rendered on screen, **Then** it prominently displays a high-contrast emerald badge `[ PRIMER EMPLEO REAL ]` with an explanatory tooltip or subtitle stating "0 años de experiencia requerida — Empleo formal remunerado".
3. **Given** a vacancy titled "Junior Developer" whose description mandates "mínimo 1 a 2 años de experiencia comprobable en producción", **When** the candidate applies the "Primer Empleo Real" filter, **Then** this vacancy is excluded from the results.
4. **Given** a vacancy titled "Trainee / Becario" that offers paid onboarding and explicitly welcomes applicants without prior commercial experience, **When** evaluated, **Then** it is surfaced under "Primer Empleo Real" as long as it constitutes a formal employment contract rather than an unpaid academic credit assignment.

---

### User Story 2 - Streamlined 5-Tier Experience Filtering with Real-Time Counts (Priority: P1)

As a job seeker exploring the Mexican tech market, I want to filter vacancies across five standardized experience tiers (Pasantía, Primer Empleo Real, Junior, Mid, Senior) or view all levels, with live vacancy counters beside each option, so that I can quickly assess the market distribution and navigate to the right opportunities for my career stage.

**Why this priority**: Essential information architecture improvement. Replaces fragmented academic subcategories with an intuitive, standardized experience hierarchy while maintaining complete search context.

**Independent Test**: Open the filter controls, observe live vacancy count badges next to each of the 5 tiers plus "Todos los niveles", select different tiers (e.g., "Junior (1–2 años)" then "Pasantía / Prácticas"), and verify that results update immediately, active search terms and location are preserved, and pagination resets to page 1.

**Acceptance Scenarios**:

1. **Given** the filter drawer and quick filter bar, **When** viewed by the candidate, **Then** five mutually exclusive experience tiers are offered: "Pasantía / Prácticas", "Primer Empleo Real (0 Exp)", "Junior (1–2 años)", "Mid (2–4 años)", and "Senior (5+ años)", plus the default "Todos los niveles".
2. **Given** live search results, **When** the candidate views the filter options, **Then** each tier displays a real-time count of matching vacancies currently available in the active search context.
3. **Given** active search terms, location, or publication date filters, **When** the candidate selects any experience tier, **Then** the vacancy list refreshes immediately, retains all other active search parameters, and resets the pagination view to page 1.
4. **Given** an active experience filter, **When** the URL changes, **Then** the selected tier is synchronized to the query parameter `?seniority=<tier>` (e.g., `?seniority=primer_empleo`), allowing direct bookmarking and shareable URLs.

---

### User Story 3 - "Fake Junior" Shield & Visual Discrepancy Indicators (Priority: P2)

As a candidate reviewing search results, I want the system to flag deceptive listings whose titles claim to be entry-level ("Becario" or "Junior") but whose body requirements mandate 2 or more years of commercial experience, so that I am not misled by predatory or mislabeled job postings.

**Why this priority**: Candidate protection and visual transparency. Postings frequently mislabel intermediate roles as junior to suppress compensation or inflate applicant pools. Exposing this discrepancy safeguards candidate trust.

**Independent Test**: Find or supply a job listing titled "Junior React Developer" that requires "3 años de experiencia en proyectos reales". Verify that the system reclassifies its experience tier to "Mid" and displays a visible discrepancy warning tag explaining that the actual requirements exceed entry-level expectations.

**Acceptance Scenarios**:

1. **Given** a listing titled "Becario" or "Junior" whose text requirements mandate 2 or more years of verifiable experience, **When** the vacancy is classified and displayed, **Then** it is reclassified to "Mid" (or "Senior" if ≥ 5 years) and displays a visible discrepancy alert tag (e.g., `[ REQUISITOS DISCREPANTES: 2+ AÑOS ]`).
2. **Given** a candidate filtering by "Primer Empleo Real" or "Junior", **When** a mislabeled "Fake Junior" listing exists in the pool, **Then** that listing is excluded from the entry-level results and only appears under its audited tier ("Mid" or "Senior").
3. **Given** an inspected vacancy with a discrepancy flag, **When** the candidate views the vacancy details modal, **Then** the AI audit reasoning explains why the listing was reclassified away from its nominal title.

---

### User Story 4 - Visual Seniority Badges & Default Sorting for First Jobs (Priority: P2)

As a candidate scanning the vacancy feed, I want each card to feature distinct, color-coded seniority badges and, when filtering by "Primer Empleo Real", have results automatically ordered by the highest confidence of zero-experience requirements, so that I can quickly parse roles and prioritize the safest, most accessible applications first.

**Why this priority**: Enhances visual scanning speed and discovery relevance. Distinct styling provides cognitive shortcuts across high-density listings.

**Independent Test**: View a mixed list of vacancies across different seniority tiers and verify that each card renders its respective color-coded badge. Activate the "Primer Empleo Real" filter and verify that vacancies with explicit zero-experience guarantees and comprehensive onboarding appear at the top.

**Acceptance Scenarios**:

1. **Given** a list of vacancies, **When** rendered on screen, **Then** each card displays a standardized, color-coded badge corresponding to its audited tier:
   - `[ PASANTÍA ]` in cyan/blue tones.
   - `[ PRIMER EMPLEO REAL ]` in high-contrast emerald tones.
   - `[ JR ]` in violet/indigo tones.
   - `[ MID ]` in amber tones.
   - `[ SR ]` in orange/red tones.
2. **Given** a candidate selects the "Primer Empleo Real" filter, **When** results are displayed, **Then** the list sorts by default to prioritize listings with the highest audit confidence of zero commercial experience.
3. **Given** a candidate changes the sorting dropdown manually (e.g., to "Más recientes primero"), **When** the sort option is changed, **Then** the user's explicit sorting selection is respected and preserved.

---

### User Story 5 - Handling Ambiguous Requirements & Helpful Empty State (Priority: P3)

As a candidate searching within a specialized niche where some postings do not state numerical years of experience, or where no vacancies match a strict seniority filter, I want the system to intelligently infer the experience level from context and provide a helpful empty state with recovery actions when zero listings match, so that I am never left at a dead end.

**Why this priority**: Robustness and graceful degradation. Real-world job descriptions are often incomplete; intelligent defaults and clear empty states keep users engaged and informed.

**Independent Test**: Conduct a search where a posting lacks numerical years of experience, confirming it receives an audited tier based on responsibilities and mentorship mentions. Filter by a tier with 0 matches and verify that an empty state appears with suggestions to expand to "Pasantía" or "Junior" along with a one-click reset button.

**Acceptance Scenarios**:

1. **Given** a vacancy with no explicit numerical years of experience, **When** audited by the classification engine, **Then** the system infers the most appropriate tier by evaluating responsibility scope, tool complexity, and mentions of mentorship or onboarding.
2. **Given** an employer posting disguised as a "First Job" that demands uncompensated work or applicant fees (exams, uniforms), **When** audited, **Then** the system triggers the Anti-Scam Shield with a high-contrast fraud alert badge (`[POSIBLE FRAUDE / TRABAJO NO REMUNERADO]`) and disqualifies it from "Primer Empleo Real".
3. **Given** a seniority filter that yields zero matching vacancies, **When** displayed, **Then** an informative empty state appears explaining that no listings match the selected level, recommending broadening the filter to "Pasantía" or "Junior", and providing a prominent "Limpiar filtro de experiencia" button.
4. **Given** an invalid or unknown seniority parameter in the URL (e.g., `?seniority=invalid_value`), **When** the page loads, **Then** the system gracefully falls back to "Todos los niveles" without breaking navigation or crashing the view.

---

### Edge Cases

- What happens when a posting states "0 to 1 years of experience" or "experiencia deseable pero no indispensable"?
  - If 0 years is explicitly accepted and training/mentorship is provided, the listing qualifies for "Primer Empleo Real". If verifiable experience is strictly mandatory for consideration, it is assigned to "Junior".
- What happens when a listing mentions conflicting requirements (e.g., "Puesto Junior" in the introduction but "3 años de experiencia en React" in the bullet list)?
  - The requirements section takes precedence: the system classifies the role as "Mid" and activates the "Fake Junior" discrepancy indicator.
- What happens when a job requires academic credentials (e.g., "Carta de pasante o título universitario") but specifies zero years of commercial work experience?
  - It qualifies as "Primer Empleo Real" because academic degree requirements do not constitute commercial work experience, provided the employment is formal and paid.
- What happens when a posting states 0 years of experience but omits numerical salary figures (e.g., "Sueldo a convenir" or "No mostrado")?
  - It qualifies as "Primer Empleo Real" provided it represents commercial employment and the Anti-Scam Shield raises zero unpaid labor or recruitment fee flags.
- What happens when an external portal provides minimal or stub text during live streaming?
  - The deterministic fast-pass assigns a provisional category from title and visible summary keywords; upon on-demand inspection or background enrichment, the deep audit refines the classification and updates the cached fingerprint record.
- What happens when a user navigates browser history (Back / Forward) across different seniority filters?
  - The application listens to navigation history events, updates the active seniority filter state to match the URL query parameter, and refreshes the displayed list without full page reloads.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST replace legacy verbose student tags (`residencias`, `dualidad`, `servicio_social`, `intern`, `becario`) and the legacy `category` attribute completely across the full stack (PostgreSQL `JobVacancy` table, Pydantic DTOs, scrapers, and TypeScript types), migrating exclusively to a unified 5-tier experience taxonomy:
  - `pasantia`: Internship, student placement, or academic credit fulfillment (*becarios*, *prácticas profesionales*, *residencias*, *servicio social*, *formación dual*).
  - `primer_empleo`: Authentic first commercial job requiring strictly 0 years of experience, offering formal paid employment (*nómina* or professional contract).
  - `junior`: Early-career positions requiring between 1 and 2 years of verifiable professional experience.
  - `mid`: Intermediate positions requiring between 2 and 4 years of professional experience and technical autonomy.
  - `senior`: Advanced positions requiring 5 or more years of experience, technical leadership, or architectural ownership.
- **FR-002**: The system MUST execute a two-step hybrid classification workflow:
  1. *Step 1 (Deterministic Fast-Pass)*: Fast keyword and pattern-based pre-classification applied immediately during live multi-portal data streaming to instantly render vacancy cards and populate filter counts without blocking the SSE stream.
  2. *Step 2 (Deep AI Audit)*: Comprehensive semantic evaluation of job title, full description, and requirement clauses executed on-demand via the local `agy` CLI when a candidate opens the vacancy details modal or requests compatibility evaluation, verifying actual years of experience required, formal employment status, and classification reasoning, with results permanently cached in PostgreSQL by fingerprint hash.
- **FR-003**: The classification workflow MUST produce structured classification attributes for each vacancy:
  - `seniority_level`: The assigned tier (`pasantia`, `primer_empleo`, `junior`, `mid`, `senior`).
  - `years_required_min`: The exact minimum years of verifiable commercial experience required (e.g., `0`, `1`, `2`, `5`).
  - `is_real_first_job`: A boolean flag that evaluates to `true` strictly when `years_required_min == 0` and the position represents formal compensated employment.
  - `audit_status`: Classification lifecycle status (`preliminary` when generated by Step 1 fast-pass pattern matching; `verified` once audited and confirmed by Step 2 deep AI evaluation).
  - `reasoning`: A concise, 1-sentence human-readable explanation in Mexican Spanish justifying the assigned tier.
  - `has_discrepancy`: A boolean flag indicating whether the nominal title (e.g., "Junior", "Becario") contradicts the audited experience requirement.
- **FR-004**: The system MUST cache all deep audit classification results indexed by vacancy fingerprint hash to eliminate redundant evaluation processing for previously analyzed postings.
- **FR-005**: The system MUST implement a "Fake Junior & Deceptive Posting Shield" that automatically reclassifies any posting whose title claims entry-level status ("Becario", "Junior", "Trainee") but whose body text demands 2 or more years of commercial experience to "Mid" (or "Senior" if ≥ 5 years), appending a visible discrepancy indicator.
- **FR-006**: The system MUST ensure that listings identified as unpaid labor, volunteer work disguised as employment, or scams requiring candidate payments (uniforms, exams, placement fees) are flagged by the Anti-Scam Shield and disqualified from the "Primer Empleo Real" tier. Conversely, vacancies with undisclosed or negotiable salaries ("A convenir", "Sueldo no mostrado") that mandate 0 years of commercial experience MUST qualify for "Primer Empleo Real" provided they are free of scam/unpaid flags and represent commercial employment rather than academic service credit.
- **FR-007**: The system MUST provide streamlined experience filter controls in both the collapsible FilterDrawer and as prominent quick filter pills above the vacancy list.
- **FR-008**: The filter controls MUST include the following selectable options with real-time matching vacancy counters:
  - "Todos los niveles" (All levels — default).
  - "Primer Empleo Real (0 Exp)" (visually highlighted as a high-intent primary option).
  - "Pasantía / Prácticas".
  - "Junior (1–2 años)".
  - "Mid (2–4 años)".
  - "Senior (5+ años)".
- **FR-009**: Selecting any experience filter option MUST immediately update the displayed vacancy list, preserve active search query keywords, location selections, and date filters, and reset the active pagination to page 1.
- **FR-010**: The active experience filter MUST be persisted to the browser URL query string via `?seniority=<value>` (e.g., `?seniority=primer_empleo`), supporting browser back/forward navigation and direct URL sharing.
- **FR-011**: When the candidate filters by "Primer Empleo Real", the system MUST sort results by default to prioritize verified zero-experience listings (`audit_status == 'verified'`) first, followed by preliminary listings (`audit_status == 'preliminary'`), ordered by most recent publication date within each group, while allowing the candidate to manually override the sorting order.
- **FR-012**: The system MUST render distinct, standardized visual badges on each vacancy card corresponding to its audited seniority tier:
  - `[ PRIMER EMPLEO REAL ]`: High-contrast emerald styling (`emerald-500/20 text-emerald-400 border-emerald-500/30`) with an emerald verification indicator when `audit_status == 'verified'` and standard preliminary badge styling when `audit_status == 'preliminary'`.
  - `[ PASANTÍA ]`: Cyan/blue badge styling.
  - `[ JR ]`: Violet/indigo badge styling.
  - `[ MID ]`: Amber badge styling.
  - `[ SR ]`: Orange/red badge styling.
- **FR-013**: If a vacancy exhibits an experience discrepancy between title and audited requirements, the vacancy card and detail view MUST render an alert badge (e.g., `[ REQUISITOS DISCREPANTES ]`) and display the audit reasoning.
- **FR-014**: If an employer description omits explicit numerical years of experience, the Step 1 fast-pass MUST provisionally default to the `junior` tier with `audit_status == 'preliminary'`; upon candidate inspection, the Step 2 deep audit MUST infer the fairest tier based on the scope of responsibilities, technical complexity of the stack, and explicit mentions of mentorship, training, or supervision, updating the classification and cache accordingly.
- **FR-015**: When an experience filter produces zero matching vacancies, the system MUST render a dedicated empty state suggesting expanding the filter to "Pasantía" or "Junior", and provide a one-click "Limpiar filtro de experiencia" button that resets the filter to "Todos los niveles".

---

### Key Entities

- **Vacancy Experience Classification**:
  - `seniority_level`: Categorical tier (`pasantia`, `primer_empleo`, `junior`, `mid`, `senior`), completely replacing the legacy `category` field across PostgreSQL, DTOs, and frontend.
  - `years_required_min`: Non-negative integer representing the minimum years of commercial experience demanded.
  - `is_real_first_job`: Boolean indicator marking verified formal positions accepting 0 prior commercial experience.
  - `audit_status`: Lifecycle status (`preliminary`, `verified`) indicating whether the classification was produced by fast-pass pattern heuristics or confirmed by deep AI audit.
  - `reasoning`: Localized string explaining the classification rationale.
  - `has_discrepancy`: Boolean flag marking postings where the title misrepresents the actual experience tier.
- **Experience Filter State**:
  - `selected_seniority`: Currently active seniority tier (`all`, `pasantia`, `primer_empleo`, `junior`, `mid`, `senior`).
  - `tier_counts`: Map of each experience tier to the number of matching vacancies currently in the active search context.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of vacancies displayed under the "Primer Empleo Real (0 Exp)" filter require strictly zero years of prior commercial work experience.
- **SC-002**: Zero (0%) deceptive "Fake Junior" postings (listings demanding 2 or more years of verifiable experience) appear under "Primer Empleo Real" or "Pasantía".
- **SC-003**: Candidates can filter and re-filter vacancies by any experience tier with UI response under 100 milliseconds without triggering full page reloads.
- **SC-004**: 100% of classified vacancy cards display their corresponding standardized seniority badge, with the "Primer Empleo Real" badge styled in high-contrast emerald.
- **SC-005**: 100% of URL links containing `?seniority=<tier>` correctly restore the corresponding filter state and displayed results upon page load and browser history navigation.
- **SC-006**: Candidates navigating to an experience filter with zero matching listings receive a actionable empty state with a recovery action that restores the full feed in a single click.

---

## Assumptions

- **Mexican Labor Context**: Terminology and contract expectations align with Mexican labor standards (e.g., distinction between university credit clearance programs like *servicio social* / *prácticas* and formal employment contracts under *nómina* or professional honorarios).
- **Zero Candidate Tracking**: Classification data and audit results are associated strictly with vacancy fingerprints, preserving complete candidate anonymity with zero candidate PII stored or required.
- **Single-Select Experience Filtering**: Experience filtering follows a single-select model (one tier or "All levels") to prevent count ambiguities and ensure clean, shareable URL query parameters.
- **Graceful Fallback**: If a vacancy cannot be audited immediately via deep AI analysis, it relies on deterministic regex pre-classification until audited, ensuring streaming results are never blocked.
- **Complementary Anti-Scam Shield**: The experience classification engine operates in tandem with the existing Anti-Scam Shield, ensuring fraudulent offers (such as unpaid work disguised as entry-level jobs) trigger high-contrast scam alerts.
