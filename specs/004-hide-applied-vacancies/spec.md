# Feature Specification: Hide Applied Vacancies & Search Feed Clean-Up

**Feature Branch**: `004-hide-applied-vacancies`

**Created**: 2026-11-08

**Status**: Draft

**Input**: User description: "Feature: Hide Applied Vacancies & Search Feed Clean-Up. Goal: Provide candidates with a fast, keyboard-accessible, client-side toggle to exclude job vacancies they have already applied to. This eliminates visual noise during repeat searches, keeps candidate attention strictly focused on fresh opportunities, and operates 100% locally via browser storage (IndexedDB via Dexie.js + localStorage) with zero candidate data sent to the backend."

## Clarifications

### Session 2026-11-08
- Q: Should the faceted counter badges on the seniority pills and timeframe filters update dynamically to reflect only visible (unapplied) vacancies when the hide-applied toggle is active? → A: Dynamic Net Counts: Seniority and timeframe badges count only visible (unapplied) vacancies when the toggle is active, matching the exact number of cards rendered in the feed.
- Q: Should the hide-applied filter state be synchronized with the browser URL query parameters (e.g., ?hide_applied=true), or remain strictly isolated to local browser storage (localStorage)? → A: Strictly Local Storage: The preference is stored exclusively in localStorage and omitted from the URL query string, keeping shared links clean and device-specific.
- Q: Should the "Ocultar postuladas" filter control also be exposed inside the mobile FilterDrawer panel, or exist exclusively in the search results header toolbar? → A: Both Toolbar and FilterDrawer: Render the toggle pill in the search header and also include a toggle switch inside FilterDrawer, keeping both synchronized.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Instant Hiding of Applied Vacancies via Toolbar Toggle (Priority: P1)

As a candidate conducting repeated job searches across Mexican tech portals, I want a quick, one-click toggle in the results toolbar to hide all vacancies I have already submitted applications for, so that I can immediately focus on new and uncontacted opportunities without repetitive visual clutter.

**Why this priority**: Fundamental value proposition of the feature. Candidates applying to multiple jobs per week waste substantial time and mental energy reviewing listings they already applied to. Hiding applied postings provides an immediate, clean view of fresh opportunities.

**Independent Test**: Conduct a search where some vacancies have status `applied`, `interviewing`, `rejected`, or `offer`. Click the "Ocultar postuladas" toolbar pill. Verify that all vacancies with post-application statuses immediately vanish from the feed, the hidden counter displays the exact count of hidden listings, and vacancies with status `saved` or no application record remain visible.

**Acceptance Scenarios**:

1. **Given** a feed of active vacancies containing a mix of new, saved, and already applied listings, **When** the candidate activates the "Ocultar postuladas" toggle, **Then** all vacancies with post-application statuses (`applied`, `interviewing`, `rejected`, `offer`) are instantly excluded from the visible list.
2. **Given** vacancies saved to the candidate's pipeline for future review (`saved`) or untracked vacancies (`new`), **When** the filter is active, **Then** these listings remain visible in the feed.
3. **Given** an active "Ocultar postuladas" filter, **When** the candidate deactivates the toggle (switching to inactive "Ocultar postuladas"), **Then** all previously hidden vacancies reappear in their original sorted positions without requiring a network refetch.
4. **Given** active search parameters (keywords, location, modality, experience tier, date timeframe, and sort order), **When** the candidate toggles the filter on or off, **Then** all active search parameters and sort orders are preserved without reset or page refresh.
5. **Given** an active "Ocultar postuladas" filter, **When** reviewing faceted filter badges (seniority pills and timeframe options), **Then** all counter badges reflect only visible (unapplied) vacancies matching each facet.
6. **Given** a candidate on a mobile viewport, **When** opening the FilterDrawer, **Then** a dedicated "Ocultar postuladas" toggle switch is displayed, bidirectionally synchronized with the search header toggle.

---

### User Story 2 - Real-Time Feed Clean-Up on In-Flight Application (Priority: P1)

As a candidate actively working through my search results, I want listings to disappear from view the moment I mark them as applied, so that my feed continuously reflects only the jobs remaining to be evaluated or contacted.

**Why this priority**: Core workflow ergonomics. When a user marks a job as applied while filtering out applied jobs, keeping the card visible breaks user expectations. Immediate in-flight removal keeps the candidate in a continuous flow state.

**Independent Test**: With "Ocultar postuladas" active, navigate to a visible vacancy card and mark it as applied (via the card action button or keyboard shortcut `a`). Verify that the card immediately disappears from the feed, the total visible count decrements by 1, and the hidden count badge increments by 1.

**Acceptance Scenarios**:

1. **Given** the "Ocultar postuladas" filter is active, **When** the candidate marks a vacancy as applied from the card action or vacancy detail view, **Then** that vacancy card immediately collapses and disappears from the search feed.
2. **Given** an in-flight removal of an applied vacancy, **When** the feed updates, **Then** the visible vacancy count updates and the hidden count badge increments by exactly 1.
3. **Given** keyboard focus was on the card just marked as applied, **When** the card disappears, **Then** keyboard focus seamlessly shifts to the next visible card in the feed.

---

### User Story 3 - Keyboard-First Toggle Navigation (Priority: P2)

As a power user navigating search results primarily with the keyboard, I want a dedicated keyboard shortcut (`h`) to toggle the hide-applied filter on and off instantly without touching the mouse, so that I can quickly audit what was hidden and resume fast browsing.

**Why this priority**: Aligns with the platform's keyboard-first productivity ethos. Enables effortless toggling between "focus mode" (hidden applied) and "review mode" (showing all).

**Independent Test**: Press `h` while viewing search results to toggle the filter on and off. Focus the search input field or notes textarea and press `h` to confirm the character types normally and does not trigger the toggle.

**Acceptance Scenarios**:

1. **Given** the candidate is browsing the vacancy feed outside of text inputs, **When** the candidate presses the `h` or `H` key, **Then** the hide-applied filter toggles between active and inactive states.
2. **Given** the candidate is typing into a search box, notes textarea, or modal input field, **When** the candidate presses `h`, **Then** the character "h" is typed into the input and the filter toggle is not triggered.
3. **Given** a modal dialog (such as vacancy details or candidate profile) is open, **When** the candidate presses `h`, **Then** the toggle shortcut is ignored.

---

### User Story 4 - Persistent Filter Preference Across Sessions (Priority: P2)

As a returning candidate, I want my preferred toggle state (active "Ocultando postuladas" or inactive "Ocultar postuladas") to persist across page reloads and browser sessions, so that I do not have to re-enable my preferred workflow every time I open the application.

**Why this priority**: Eliminates repetitive friction for regular users and preserves personalization without requiring server-side accounts.

**Independent Test**: Activate "Ocultar postuladas", refresh the browser tab or open the application in a new tab, and verify that the filter remains active and applied vacancies remain hidden.

**Acceptance Scenarios**:

1. **Given** a candidate sets the toggle to active ("Ocultar postuladas"), **When** the page is reloaded or revisited in a future session, **Then** the toggle remains active by default.
2. **Given** a candidate sets the toggle to inactive ("Ocultar postuladas"), **When** the page is reloaded, **Then** the toggle remains inactive.
3. **Given** a first-time visitor with no prior stored preference, **When** the application loads, **Then** the toggle defaults to inactive ("Ocultar postuladas").
4. **Given** a candidate activates or deactivates the toggle, **When** inspecting the browser URL address bar, **Then** the URL query string remains untouched with zero application or filter parameters leaked.

---

### User Story 5 - Cross-Portal Deduplication & Synchronized State (Priority: P2)

As a candidate applying to multi-portal job postings, I want an application submitted to a listing from one portal (e.g., Computrabajo) to automatically hide duplicate postings of the same vacancy from other portals (e.g., OCC or Indeed), so that redundant cross-portal listings never clutter my feed.

**Why this priority**: Scraped aggregation inherently encounters identical jobs reposted across multiple Mexican job boards. Application tracking must operate on canonical job identities rather than portal-specific URLs.

**Independent Test**: Mark a vacancy originally found on OCC as applied. Perform a search or observe the feed where the same role appears from Indeed or Computrabajo with matching canonical fingerprint. Verify that the duplicate card is also excluded when the filter is active.

**Acceptance Scenarios**:

1. **Given** two vacancies from different portals sharing the same canonical job fingerprint, **When** the candidate marks one of them as applied, **Then** both listings are treated as applied and hidden when the filter is active.
2. **Given** an application status is modified or removed in the Pipeline View ("Mis Postulaciones"), **When** the candidate switches back to the Search tab, **Then** the search feed and hidden counter reflect the updated application status immediately.

---

### User Story 6 - Dedicated Empty State for 100% Applied Results (Priority: P3)

As a candidate who has diligently applied to every matching opportunity in a specific search, I want a clear, congratulatory empty state rather than a confusing "no results found" message, along with a one-click button to view my applied postings, so that I know my search was successful and can easily review what I applied to.

**Why this priority**: Prevents false perception of system failure or zero job availability when the candidate has actually exhausted current matches. Provides immediate positive feedback and recovery actions.

**Independent Test**: Conduct a search where every returned vacancy has already been applied to and the filter is active. Verify that the dedicated empty state renders with the checkmark icon, positive messaging, and a "Mostrar vacantes postuladas" button that instantly deactivates the filter upon click.

**Acceptance Scenarios**:

1. **Given** a search query yields matching vacancies, but 100% of those matches have an applied status, **When** the filter is active, **Then** the system displays a dedicated empty state with an emerald check icon, the message "Te has postulado a todas las vacantes encontradas para este criterio (N ocultas)", and a prominent button "Mostrar vacantes postuladas".
2. **Given** the 100% applied empty state is rendered, **When** the candidate clicks "Mostrar vacantes postuladas", **Then** the filter is turned off and all applied vacancies are revealed immediately.
3. **Given** a search query yields zero matches regardless of application status, **When** the feed renders, **Then** the standard search empty state is shown rather than the 100% applied state.

---

### Edge Cases

- **Accidental Application Marking**: If a candidate accidentally presses `a` on a card, they can immediately press `h` to reveal the card, click into the vacancy details or Pipeline View, and restore its status.
- **Anonymous Employers ("Empresa Confidencial")**: Distinct job postings from confidential employers that share the generic name "Empresa Confidencial" use URL-aware canonical fingerprinting so that applying to one confidential posting does not accidentally hide unrelated confidential postings from other companies.
- **Rapid Keyboard Toggling**: Rapid repeated pressing of the `h` key smoothly toggles state without race conditions, UI flashing, or inconsistent count values.
- **Zero Applications in Storage**: When the candidate has zero application records in local storage, activating the toggle shows `(0)` hidden and leaves the full feed visible without errors.
- **Corrupted or Cleared Local Storage**: If browser storage is cleared or unavailable, the toggle gracefully defaults to inactive without throwing errors or blocking search functionality.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a client-side toggle to switch between displaying all vacancies (`all`) and hiding applied vacancies (`hide_applied`).
- **FR-002**: When the filter is set to `hide_applied`, system MUST exclude vacancies whose locally tracked status is `applied`, `interviewing`, `rejected`, or `offer`.
- **FR-003**: System MUST keep visible all vacancies with status `saved` or untracked vacancies (`new` / no application record) when `hide_applied` is active.
- **FR-004**: Vacancies marked with status `ignored` MUST remain excluded globally from the feed regardless of the toggle state.
- **FR-005**: All filtering operations MUST execute entirely client-side using local browser storage with zero candidate identifiers or application history transmitted to the backend server.
- **FR-006**: When a candidate marks a vacancy as applied while `hide_applied` is active, the system MUST immediately remove the vacancy from the visible feed in real time without requiring a manual refresh.
- **FR-007**: System MUST provide a toolbar toggle pill positioned in the search results header and a synchronized toggle switch inside FilterDrawer, each displaying the active/inactive state and the live count of hidden vacancies `(N)`.
- **FR-008**: The toolbar toggle pill MUST visually distinguish between its active state (high-contrast emerald styling) and inactive state (subtle zinc styling).
- **FR-009**: The toolbar toggle pill MUST display a tooltip indicating its purpose and keyboard shortcut: `"Ocultar vacantes con postulación enviada (Atajo: H)"`.
- **FR-010**: System MUST update the search results summary text to reflect both visible and hidden counts (e.g., `"Mostrando 14 vacantes verificadas en vivo (4 postuladas ocultas)"`).
- **FR-011**: System MUST provide a dedicated keyboard shortcut `h` / `H` to toggle the filter on and off when focus is not inside an input, textarea, select, or modal window.
- **FR-012**: System MUST persist the candidate's chosen toggle state in local browser storage under the key `mishoojobs_hide_applied` across page reloads and browser sessions, and MUST NOT synchronize or expose this state in the URL query string.
- **FR-013**: Toggling the filter MUST preserve all existing search parameters, including keyword query, location, modality, experience tier, publication timeframe, and active sort order.
- **FR-014**: System MUST match applications by canonical vacancy fingerprint so that applying to a vacancy on one portal automatically hides duplicate postings of that vacancy from other portals.
- **FR-015**: Status updates performed in the application pipeline view or vacancy detail modal MUST immediately synchronize with the search feed upon returning to the search view.
- **FR-016**: When all matching vacancies for a search query are hidden by the filter, system MUST render a dedicated positive empty state indicating that all matching positions have been applied to, with a one-click action to reveal them.
- **FR-017**: Postings from anonymous employers ("Empresa Confidencial") MUST utilize distinct canonical fingerprints to prevent unintended cross-post hiding of unrelated jobs.
- **FR-018**: When the hide-applied toggle is active, faceted counter badges on horizontal seniority pills and FilterDrawer timeframe filters MUST dynamically display contextual net visible counts (excluding hidden applied vacancies) so that badge numbers match the exact count of cards rendered upon selection.

### Key Entities *(include if feature involves data)*

- **ApplicationRecord**: Represents a locally stored candidate application state in browser storage (`IndexedDB`), containing `vacancy_fingerprint`, `title`, `company_name`, `status` (`saved` | `applied` | `interviewing` | `rejected` | `offer` | `ignored`), `direct_url`, and timestamps.
- **AppliedFilterPreference**: A locally persisted boolean setting in browser storage (`localStorage` key `mishoojobs_hide_applied`) representing whether applied vacancies should be hidden from the search feed.
- **VacancyFeedSummary**: The aggregated count and visibility metrics for the active search session, including total verified vacancies, count of visible vacancies, and count of hidden applied vacancies.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Candidates can toggle between showing and hiding applied vacancies in under 50 milliseconds without page reload or backend network requests.
- **SC-002**: 100% of candidate application records, statuses, and filter preferences remain strictly local to the user's browser, with zero candidate data transmitted to backend databases or remote endpoints.
- **SC-003**: Marking a vacancy as applied while the filter is active removes the card from view within 1 animation frame (< 16ms), preventing visual lingering.
- **SC-004**: The hidden vacancy counter and feed summary text accurately reflect the exact number of excluded applied postings matching the active search query 100% of the time.
- **SC-005**: 100% of duplicate multi-portal postings sharing a canonical fingerprint are excluded simultaneously when one instance is marked as applied.
- **SC-006**: Candidates who have applied to all matching jobs in a query reach a recovery action ("Mostrar vacantes postuladas") in a single click, with zero dead-end screens.
- **SC-007**: Keyboard shortcut `h` responds reliably in under 50ms while maintaining 0% false triggers during text entry in input fields or notes.
- **SC-008**: Faceted filter badges for seniority and timeframe categories match 100% of the rendered card counts for those categories when the hide-applied filter is active.

## Assumptions

- Candidates have a modern browser supporting client-side storage (`IndexedDB` and `localStorage`).
- The existing canonical vacancy fingerprinting mechanism correctly distinguishes identical postings across portals while disambiguating generic "Empresa Confidencial" listings.
- Status `saved` is intentionally preserved in the feed because saving a job represents an intent to review and apply later, not an existing application submission.
- Vacancies marked as `ignored` remain hidden globally across all views as established by the platform's existing discard behavior.
- The default toggle state for new candidates who have never set a preference is inactive (`false`, displaying "Ocultar postuladas"), ensuring no vacancies are hidden unexpectedly.
- The hide-applied toggle preference is intentionally excluded from URL query parameters to protect candidate privacy and ensure shared job search URLs do not impose local application filters on other recipients.
