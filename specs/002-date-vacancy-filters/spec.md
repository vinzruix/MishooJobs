# Feature Specification: Date-Relevant Vacancy Filters (MishooJobs)

**Feature Branch**: `002-date-vacancy-filters`

**Created**: 2026-11-06

**Status**: Draft

**Input**: User description: "Feature: Date-relevant vacancy filters. Goal: Allow candidates to easily find freshly published jobs by filtering vacancies by publication date. Key Behaviors: Filter options (multy select): Cualquier fecha (default), Última hora (past 60 minutes), Últimas 24 horas (past 1 day), Últimos 3 días (past 3 day), Última semana (past 7 days), Último mes (past 30 days), Más de 1 mes (past 30+ days)... Display relative timestamps on vacancy cards... Add a 'Nueva' badge to any vacancy published within the last 48 hours... Display the count of available jobs next to each filter option... Sync the filter in the URL query params (?published_within=24h)... If no vacancies exist, display friendly message suggesting to expand to 'Última semana'... Include quick 'Limpiar filtro' button..."

## Clarifications

### Session 2026-11-06
- Q: Should the date filter options represent cumulative thresholds or mutually exclusive time buckets? (FR-001) → A: Cumulative thresholds (≤ 1h, ≤ 24h, ≤ 3d, ≤ 7d, ≤ 30d, > 30d) where count badges reflect total vacancies within each window and multi-selection evaluates to an inclusive union.
- Q: How should the platform handle vacancies from external portals that have missing or unparseable publication dates? (FR-006) → A: Vacancies with unparseable or missing dates must have published_at set to null, display relative timestamp "Fecha no especificada", be excluded from all specific time-window filters and the "Nueva" badge, and only appear under "Cualquier fecha".
- Q: What sorting control and options should be available so candidates can explicitly choose or override the sorting order? (FR-009) → A: Add a visible sorting dropdown in the results header with options: "Más recientes primero", "Mayor compatibilidad (Fit Score)", and "Relevancia por defecto". Selecting ≤ 3 days automatically sets the sorting dropdown to "Más recientes primero" unless the user has explicitly changed it.
- Q: Where should the publication date filter controls be positioned in the interface? (FR-001) → A: Inside the existing FilterDrawer as a dedicated section alongside Modality, Academic Format, and Mexican Region for unified filtering.
- Q: Should relative timestamps and "Nueva" badges on rendered job cards update automatically in the background as time elapses? (FR-006) → A: Implement an automatic 60-second client-side background interval ticker that updates relative time strings and reassesses "Nueva" badge status in real time without requiring network requests or full list re-renders.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Instant Filtering by Publication Date Preserving Search Context (Priority: P1)

As an early-career candidate searching for entry-level tech roles in Mexico, I want to filter live vacancies by how recently they were posted (from "Última hora" to "Más de 1 mes"), so that I can focus my applications on the freshest opportunities without losing my active search terms, location, or other filters.

**Why this priority**: Core user need. Job seekers have higher response and interview rates when applying to newly published listings. If filtering by date erases keywords or requires full-page reloads, users face high friction.

**Independent Test**: Conduct a search with existing keywords (e.g., "Frontend") and location (e.g., "Ciudad de México"), then apply different date filter options ("Últimas 24 horas", "Última semana"). Verify that results update immediately, pagination resets to page 1, and the active keyword and location criteria remain intact.

**Acceptance Scenarios**:

1. **Given** a candidate with active keyword or location filters viewing vacancy results, **When** they select a date filter option (e.g., "Últimas 24 horas"), **Then** the vacancy list immediately refreshes to display only jobs published within that window, resets pagination to page 1, and retains all existing search keywords and filters.
2. **Given** an active date filter, **When** the candidate selects "Cualquier fecha", **Then** the date constraint is removed, and all matching vacancies regardless of publication date are displayed.
3. **Given** multi-select filter options, **When** the candidate toggles multiple non-overlapping date buckets, **Then** the result set reflects the inclusive union of the selected time windows.
4. **Given** an active date filter on page 3 of results, **When** the candidate switches the date filter to another timeframe, **Then** the active page number automatically resets to page 1.

---

### User Story 2 - Visual Freshness Badges & Relative Timestamps on Vacancy Cards (Priority: P1)

As a candidate scanning multiple job listings, I want to see human-friendly relative publication timestamps (e.g., "Hace 2 horas", "Hace 3 días") and a distinct "Nueva" badge on listings published in the last 48 hours, so that I can quickly spot and prioritize fresh opportunities without calculating dates manually.

**Why this priority**: Visual hierarchy and fast cognitive scanning. Candidates review dozens of listings rapidly; prominent badges and localized relative times dramatically reduce scanning effort.

**Independent Test**: View a list of vacancies with various publication dates. Confirm that every card displays a localized relative timestamp, and vacancies published within the past 48 hours display a prominent "Nueva" badge, while older postings do not.

**Acceptance Scenarios**:

1. **Given** a vacancy published 3 hours ago, **When** displayed in the results list, **Then** it presents the relative timestamp "Hace 3 horas" and a prominent "Nueva" visual badge.
2. **Given** a vacancy published 36 hours ago (within the 48-hour threshold), **When** displayed, **Then** it presents the relative timestamp "Hace 1 día" (or "Hace 36 horas") and the "Nueva" visual badge.
3. **Given** a vacancy published 5 days ago, **When** displayed, **Then** it presents the relative timestamp "Hace 5 días" and does NOT display the "Nueva" badge.
4. **Given** a vacancy published less than 1 minute ago, **When** displayed, **Then** it displays "Hace unos momentos" along with the "Nueva" badge.

---

### User Story 3 - Available Job Counts & Smart Recency Ordering (Priority: P2)

As a candidate evaluating how many fresh jobs are available, I want to see the count of matching jobs next to each date filter option, and have results automatically sort by "Más recientes primero" when selecting tight timeframes (<= 3 days), so that I understand job availability at a glance and view the newest positions first.

**Why this priority**: Improves discovery efficiency by indicating posting volume upfront and automatically aligning sorting order with candidate intent when focusing on very fresh listings.

**Independent Test**: Perform a search and inspect the date filter options. Verify that each option displays an accurate badge count of matching vacancies. Select "Últimos 3 días" and verify the result sorting defaults to "Más recientes primero".

**Acceptance Scenarios**:

1. **Given** a set of discovered vacancies, **When** the filter panel is viewed, **Then** each date filter option displays the exact count of vacancies matching that timeframe for the current search context (e.g., "Últimas 24 horas (12)").
2. **Given** a candidate selects a timeframe of 3 days or less ("Última hora", "Últimas 24 horas", or "Últimos 3 días"), **When** the results update, **Then** the sorting selector automatically switches to "Más recientes primero", ordering listings newest to oldest.
3. **Given** a candidate who has explicitly set a custom sorting preference via the sorting selector (e.g., "Mayor compatibilidad (Fit Score)" or "Relevancia por defecto"), **When** they change date filters, **Then** their explicit sorting preference is preserved without unwanted overrides.

---

### User Story 4 - Shareable & Bookmarkable URL Synchronization (Priority: P2)

As a candidate who bookmarks searches or shares listings with friends and study groups, I want the selected date filter to be reflected in the URL query parameters (e.g., `?published_within=24h`), so that opening or sharing the link recreates the exact filtered view.

**Why this priority**: Essential for collaboration, bookmarking, and seamless browser navigation without requiring user accounts or backend session tracking.

**Independent Test**: Select "Últimas 24 horas", copy the browser URL, open it in an incognito or new window, and verify that the date filter is pre-selected and the corresponding vacancies are displayed. Use the browser back/forward buttons to verify state transitions.

**Acceptance Scenarios**:

1. **Given** a candidate selects a date filter option, **When** the results refresh, **Then** the URL query string updates to include the filter parameter (e.g., `?published_within=24h` or comma-separated tokens for multi-selection).
2. **Given** a user navigates directly to a URL with `?published_within=7d`, **When** the page loads, **Then** the "Última semana" filter is pre-selected and only vacancies published within the last 7 days are displayed.
3. **Given** a candidate navigates using browser Back and Forward buttons, **When** the URL changes, **Then** the active date filter and displayed vacancy list synchronize with the historical state.

---

### User Story 5 - Empty State Guidance & One-Click Filter Reset (Priority: P3)

As a candidate who selects a restrictive timeframe with no available listings, I want to receive a friendly suggestion to broaden my filter (e.g., to "Última semana") alongside a one-click "Limpiar filtro" button, so that I never get stuck on an empty screen and can easily resume browsing.

**Why this priority**: Prevents user drop-off and frustration when searching during low-activity hours or in niche job categories.

**Independent Test**: Apply a filter combination that yields 0 vacancies (such as "Última hora" in a small city). Confirm that an informative message suggests widening the filter to "Última semana", and clicking "Limpiar filtro" immediately resets the date filter to "Cualquier fecha".

**Acceptance Scenarios**:

1. **Given** a selected timeframe with zero matching vacancies (e.g., "Última hora"), **When** the empty state renders, **Then** it displays a friendly Spanish message suggesting to expand the filter to "Última semana" and provides a prominent "Limpiar filtro" button.
2. **Given** the empty state is displayed, **When** the user clicks "Limpiar filtro", **Then** the date filter resets to "Cualquier fecha", the URL query parameter is cleared, and all vacancies matching the active keywords are displayed.
3. **Given** the suggestion link "Ver vacantes de la última semana" within the empty state, **When** clicked, **Then** the filter immediately shifts to "Última semana" and displays matching results.

---

### Edge Cases

- **Postings with ambiguous or missing timestamps**: Vacancies where the external portal provides unparseable or missing publication dates have `published_at` set to null and display the relative label "Fecha no especificada". They are strictly included ONLY under "Cualquier fecha" and excluded from all specific time-bounded filter windows (including "Más de 1 mes") and are ineligible for the "Nueva" badge.
- **Clock skew and timezone offsets**: All relative timestamps must be computed against the Mexican standard timezone (UTC-6 / Central Time) to prevent negative timestamps (e.g., "Hace -10 minutos") or incorrect novelty badges due to client clock drift.
- **Listings published right at the 48-hour boundary**: Vacancies at exactly 48 hours and 0 minutes are considered "Nueva"; at 48 hours and 1 minute, the badge is omitted.
- **Combined multi-select with "Cualquier fecha"**: Selecting "Cualquier fecha" automatically deselects any specific timeframes; selecting any specific timeframe automatically unchecks "Cualquier fecha".
- **Invalid URL parameter values**: If a user navigates to a URL with an unrecognized `published_within` value (e.g., `?published_within=invalid_tier`), the system must gracefully fall back to "Cualquier fecha" without breaking the search interface.
- **Live SSE streaming during active date filter**: When live vacancies are actively arriving via Server-Sent Events, incoming listings that do not match the currently selected date filter must be retained in memory/cache but hidden from the active view, updating the filter option count badges in real time.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST integrate publication date filter options inside the existing `FilterDrawer` as a dedicated section alongside Modality, Academic Format, and Mexican Region, providing the following standardized options defined as cumulative age thresholds relative to the current time:
  - "Cualquier fecha" (default, unbounded)
  - "Última hora" (age ≤ 60 minutes)
  - "Últimas 24 horas" (age ≤ 24 hours, inclusive of ≤ 60 minutes)
  - "Últimos 3 días" (age ≤ 72 hours, inclusive of ≤ 24 hours)
  - "Última semana" (age ≤ 7 days, inclusive of ≤ 72 hours)
  - "Último mes" (age ≤ 30 days, inclusive of ≤ 7 days)
  - "Más de 1 mes" (age > 30 days)
- **FR-002**: System MUST allow candidates to select date filter options, supporting multi-selection evaluated as an inclusive union across chosen timeframes (e.g., selecting "Última hora" and "Últimos 3 días" encompasses all jobs posted within the last 3 days).
- **FR-003**: Selecting or deselecting any date filter option MUST immediately update the displayed vacancy results and reset the pagination index to page 1.
- **FR-004**: Updating the date filter MUST preserve all other active search filters, including keyword queries, location parameters, modality choices, and scam badge exclusions.
- **FR-005**: System MUST synchronize the active date filter with the browser URL query parameter using the key `published_within` (e.g., `?published_within=24h`), updating the browser history for seamless back/forward navigation and bookmarking.
- **FR-006**: System MUST render human-readable relative timestamps on all vacancy cards in Mexican Spanish (e.g., "Hace unos momentos", "Hace 2 horas", "Hace 1 día", "Hace 3 días", "Hace 2 semanas", "Hace más de 1 mes") and update them automatically via a 60-second client-side interval ticker without requiring full list re-renders.
- **FR-007**: System MUST display a high-contrast visual badge labeled "Nueva" on all vacancy cards whose publication timestamp is within 48 hours of the current time.
- **FR-008**: System MUST display the count of matching vacancies next to each date filter option based on current search query and remaining active filters, with each badge representing the total vacancy volume matching that cumulative threshold window.
- **FR-009**: System MUST provide a visible sorting control in the results toolbar with options: "Más recientes primero", "Mayor compatibilidad (Fit Score)", and "Relevancia por defecto". When a user selects a date filter of 3 days or less ("Última hora", "Últimas 24 horas", or "Últimos 3 días"), the system MUST default the sorting selector to "Más recientes primero", unless the user has explicitly selected an alternate sort preference in that session.
- **FR-010**: When a selected date filter yields zero matching vacancies, the system MUST display an empty state that suggests expanding the search to "Última semana" and provides a quick "Limpiar filtro" button.
- **FR-011**: Triggering the "Limpiar filtro" action MUST reset the date filter to "Cualquier fecha", clear the `published_within` parameter from the URL, and display all vacancies matching remaining search criteria.
- **FR-012**: The date filtering and relative timestamp calculations MUST execute without requiring candidate registration, logins, or storing candidate state on external servers.

### Key Entities

- **PublicationTimeframe**: Represents a date filter option, defined by a unique identifier (e.g., `1h`, `24h`, `3d`, `7d`, `30d`, `30d_plus`, `all`), a localized display label ("Últimas 24 horas"), minimum and maximum age duration limits (evaluating as cumulative thresholds), and the cumulative count of available matching vacancies.
- **VacancyDateMetadata**: Publication timing attributes associated with a job posting, including the original publication timestamp (`published_at`: Optional ISO 8601 UTC, null if missing/unparseable), the calculated relative time string for UI display ("Hace 2 horas" or "Fecha no especificada"), and a boolean flag indicating eligibility for the "Nueva" badge (true only when `published_at` exists and age ≤ 48 hours).
- **SearchFilterState**: The cohesive state of the candidate's active search, comprising textual keywords, geographic location, active date timeframe selections, sorting order (`sort_order`: "recent" | "compatibility" | "relevance"), and pagination parameters, serializable to URL query parameters.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Applying or switching a date filter updates the visible vacancy list and resets pagination in under 300 milliseconds on the client interface.
- **SC-002**: 100% of vacancy cards display localized Mexican Spanish relative timestamps updated automatically every 60 seconds, and 100% of postings published ≤ 48 hours ago display the "Nueva" badge.
- **SC-003**: 100% of date filter changes preserve all existing keyword, location, and category filters without loss of search context.
- **SC-004**: 100% of URLs copied or bookmarked with `published_within` parameters accurately restore the corresponding date filter and filtered result set when opened in a new session.
- **SC-005**: When filtering results by ≤ 3 days, 100% of searches automatically default to "Más recientes primero" sorting unless an explicit override was chosen by the user.
- **SC-006**: In 100% of empty state occurrences resulting from date filtering, candidates are presented with a recommendation to expand to "Última semana" and an operative "Limpiar filtro" action.
- **SC-007**: Available vacancy counts displayed alongside date filter options match the actual number of filterable results with 100% accuracy.

## Assumptions

- External job boards (Computrabajo, Indeed, OCC) provide reliable publication date indicators (relative text or absolute timestamps) that can be parsed into ISO 8601 timestamps during ingestion.
- In multi-select mode, if multiple timeframe options are checked, they are evaluated as an inclusive union (e.g., selecting "Última hora" and "Últimos 3 días" encompasses jobs meeting either condition, resulting in all jobs posted within the last 3 days).
- When a candidate selects "Cualquier fecha", it serves as a master reset for date filtering, deselecting all specific timeframe options.
- The reference time used for calculating relative timestamps and the 48-hour "Nueva" badge eligibility is evaluated on the client machine against standard Mexican time zones (UTC-6) to ensure real-time accuracy.
- Custom date picker calendars (selecting arbitrary start and end dates) and saved search email alerts are explicitly out of scope for this version.
