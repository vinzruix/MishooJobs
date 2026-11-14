# Feature Specification: Specific Experience Requirement Display on Vacancy Cards

**Feature Branch**: `006-vacancy-card-experience`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "When a user is watching the vacancy cards, has to see the details to know the years of experiencie required, ADD IN EACH CARD THE SPECIFIC NUMBER OF EXPERIENCIE REQUIRED. DO NOT DO ANYTHING ELSE"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Instant Visibility of Required Experience on Every Vacancy Card (Priority: P1)

As a candidate scanning through job search results, I want each vacancy card to explicitly show the exact minimum number of years of experience required (e.g., 0 años, 1 año, 2 años, 5 años) directly in the card preview, so that I can immediately determine whether I qualify for the role without having to open the details modal for every listing.

**Why this priority**: Core value proposition and the explicit goal requested by the user. Opening modals to check experience requirements creates significant friction and slows down candidate review. Displaying the exact number directly on each card provides immediate clarity and high-efficiency scanning.

**Independent Test**: Conduct a search or browse the vacancy feed. Inspect the visible vacancy cards on screen without clicking on any of them. Verify that each card displays its specific numerical experience requirement (e.g., "0 años de exp", "1 año de exp", "3 años de exp") in its metadata row or badge area.

**Acceptance Scenarios**:

1. **Given** a feed of active vacancy cards with varying experience levels, **When** the candidate views the search results, **Then** every single vacancy card visibly displays the specific minimum years of experience required.
2. **Given** a vacancy requiring zero years of commercial experience (such as first-job or internship listings), **When** rendered on the card, **Then** the card explicitly displays "0 años de exp" (or "0 años exp").
3. **Given** a vacancy requiring exactly 1 year of commercial experience, **When** rendered on the card, **Then** the card displays "1 año de exp" (singular, grammatically correct).
4. **Given** a vacancy requiring 2 or more years of commercial experience, **When** rendered on the card, **Then** the card displays the specific number followed by the plural label (e.g., "2 años de exp", "3 años de exp", "5+ años de exp").
5. **Given** a candidate browsing results, **When** looking strictly at the closed card, **Then** the candidate can identify the experience requirement without opening the vacancy detail modal or performing hover interactions.

---

### User Story 2 - Grammatically Correct Mexican Spanish Localization (Priority: P2)

As a Mexican job seeker, I want the experience requirement text on each card to follow natural, grammatically correct Spanish phrasing tailored to the Mexican labor context, so that the information feels cohesive with the rest of the interface and easy to read at a glance.

**Why this priority**: Maintains linguistic standards and UI clarity. Numbers must align with proper Spanish grammar (singular "año" for 1, plural "años" for 0 and 2+), preventing jarring machine-translated artifacts.

**Independent Test**: Review vacancy cards across all seniority levels (0, 1, 2, 3, 5+). Verify that 1 year is labeled with "año" (singular) and all other numbers use "años" (plural), localized in Mexican Spanish.

**Acceptance Scenarios**:

1. **Given** a requirement of 1 year of experience, **When** formatted for display, **Then** the text reads "1 año de exp" (singular) and never "1 años".
2. **Given** a requirement of 0 years of experience, **When** formatted for display, **Then** the text reads "0 años de exp".
3. **Given** a requirement of 3 years of experience, **When** formatted for display, **Then** the text reads "3 años de exp" (plural).
4. **Given** any numerical experience requirement, **When** displayed, **Then** no raw unformatted backend data keys or untranslated English strings appear.

---

### User Story 3 - Visual Density and Layout Integrity Across Viewports (Priority: P2)

As a user browsing on mobile or desktop devices, I want the experience requirement indicator to integrate cleanly into the vacancy card layout without causing button clipping, awkward text wrapping, or visual clutter, so that the high-density reading experience remains fluid.

**Why this priority**: Preserves user experience quality across screen sizes. Adding new data points to high-density cards must not break existing UI balance or overflow action buttons.

**Independent Test**: View vacancy cards on both mobile (360px-400px width) and desktop (1280px+ width) viewports. Verify that the experience text and icon fit comfortably within the card metadata row alongside location, salary, and publication time without vertical displacement or truncated buttons.

**Acceptance Scenarios**:

1. **Given** a mobile viewport (360px wide), **When** vacancy cards are displayed with their experience requirement, **Then** the metadata row wraps gracefully without overlapping footer action buttons or overflowing horizontally.
2. **Given** a card with long title, company name, and salary text, **When** the experience requirement is rendered, **Then** all information remains fully readable and properly spaced.
3. **Given** high-density dark mode styling, **When** the experience indicator is shown, **Then** it harmonizes visually with the existing typography and monochrome color hierarchy.

---

### Edge Cases

- **Zero Experience (0 años)**: Positions explicitly accepting candidates with no prior commercial experience must display "0 años de exp" clearly so early-career candidates immediately recognize accessible roles.
- **Single Year (1 año)**: Must strictly use the singular noun form ("año") rather than plural ("años").
- **Senior Roles with High Experience (5+ / 10+ años)**: Must display the exact number (e.g., "5 años de exp" or "10 años de exp") without truncation or ellipsis breaking the number.
- **Updated Requirement After AI Audit**: If an in-depth audit adjusts the evaluated minimum years of experience, the corresponding card must dynamically reflect the updated number.
- **Narrow Mobile Screens**: On compact mobile screens, the indicator text must remain legible without pushing action buttons outside card boundaries.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every vacancy card rendered in the search results and job feeds MUST visibly display the specific minimum number of years of commercial work experience required.
- **FR-002**: The experience requirement MUST display the exact numeric figure (e.g., 0, 1, 2, 3, 5) directly in the card view, requiring zero click or hover interactions.
- **FR-003**: The experience requirement indicator MUST be accompanied by an intuitive visual icon and concise, localized Spanish text adhering to correct grammatical agreement ("0 años de exp", "1 año de exp", "N años de exp").
- **FR-004**: The experience requirement MUST be positioned consistently across all vacancy cards within the primary metadata section (alongside location, salary, and publication date).
- **FR-005**: When a vacancy's experience requirement is updated via inspection or background verification, the displayed card MUST reflect the audited value in real time.
- **FR-006**: In strict compliance with the project instruction ("DO NOT DO ANYTHING ELSE"), this feature MUST NOT introduce new filter dropdowns, navigation sidebars, candidate profile modifications, or unrelated redesigns.

### Key Entities

- **Vacancy Card**: The primary visual preview unit displaying key role attributes (title, company, location, salary, publication time, modality, seniority, and required experience) in the job feed.
- **Experience Requirement**: The specific integer value representing the minimum commercial years of experience demanded for a vacancy, rendered as a localized label.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of rendered vacancy cards in the job feed display the specific numerical years of experience required in their default preview state.
- **SC-002**: Zero user clicks or modal openings are needed to discover the required years of experience for any vacancy in the search feed.
- **SC-003**: Time required for candidates to filter and evaluate suitability of 10 vacancies during list scanning decreases by at least 70% compared to having to open individual details modals.
- **SC-004**: 100% of rendered experience labels maintain proper grammatical singular/plural agreement ("1 año" vs "0/N años") in Mexican Spanish with 0 localization errors.
- **SC-005**: Zero visual layout regressions, horizontal overflows, or card action button truncations across mobile (360px+), tablet, and desktop viewports.

## Assumptions

- Each vacancy record already contains an extracted non-negative integer representing the minimum years of required experience (`years_required_min >= 0`).
- The experience requirement will be rendered in the vacancy card metadata row accompanied by a subtle icon, maintaining the established zinc-mono aesthetic.
- No backend database schema changes or scraping contract changes are required, as the numerical field is already populated by existing classifiers.
- The scope is strictly limited to adding the specific experience requirement to each vacancy card, without modifying unrelated components or user flows.
