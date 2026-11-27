# Feature Specification: Custom Brand Logo & "Primer Empleo" Label Standardization

**Feature Branch**: `009-custom-logo-primer-empleo`

**Created**: 2026-11-27

**Status**: Draft

**Input**: User description: "1.- want to add a personalized logo which will be the floowing one: [suited black cat mascot image] 2.- Change all the labels 'Primer empleo real' to 'Primer empleo'"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Personalized MishooJobs Mascot Logo (Priority: P1)

As a visitor or early-career job seeker opening MishooJobs,
I want to see the custom MishooJobs suited black cat mascot logo in the primary navigation header and browser tab icon instead of generic placeholder icons,
So that the platform has a memorable, trustworthy, and cohesive brand identity from the first glance.

**Why this priority**: Replacing generic placeholder icons with the brand's custom mascot establishes immediate visual identity and polish across every page of the application.

**Independent Test**: Can be verified by loading any page of MishooJobs on desktop and mobile viewports and confirming that the cleaned suited cat mascot appears crisply beside the "MishooJobs" brand name in the navigation header and as the browser tab icon, with no checkerboard background or screenshot toolbar artifacts visible.

**Acceptance Scenarios**:

1. **Given** a candidate visits any screen of MishooJobs (Vacantes, Postulaciones, or CVs), **When** the top navigation bar renders, **Then** the custom suited dark cat mascot with yellow eyes appears cleanly beside the "MishooJobs" brand title, replacing the generic briefcase icon.
2. **Given** the custom logo is displayed on the light navigation header background, **When** inspected visually at normal and high-DPI display scales, **Then** the mascot illustration has a clean transparent or seamlessly integrated background with zero checkerboard pattern and zero floating preview/download overlay artifacts from the original reference image.
3. **Given** a candidate opens MishooJobs in a web browser, **When** looking at the browser tab, **Then** the tab displays the same custom cat mascot as its favicon instead of a generic framework icon, and the mascot remains recognizable at small tab dimensions.
4. **Given** a candidate views the application on narrow mobile screens (<768px) as well as wide desktop screens, **When** the header renders, **Then** the logo maintains its aspect ratio without clipping, overlapping navigation buttons, or pushing header controls onto extra lines.

---

### User Story 2 - Standardize "Primer Empleo" Labels Across All Views (Priority: P1)

As an early-career candidate browsing and filtering entry-level jobs,
I want every filter pill, metric card, and status label previously reading "Primer Empleo Real" (in any capitalization) to consistently read "Primer Empleo",
So that the interface uses concise, natural, and uniform terminology without redundant qualifiers.

**Why this priority**: Consistent, concise labeling improves scanability in the compact filter bar and detail views, aligning the desktop and mobile experience around a single clear term.

**Independent Test**: Can be verified by navigating through the search filter bar, opening a zero-experience vacancy's detail panel or mobile sheet, and inspecting all UI badges and summaries to confirm zero user-facing occurrences of "Primer Empleo Real" remain and all corresponding controls display "Primer Empleo".

**Acceptance Scenarios**:

1. **Given** a candidate views the seniority filter controls on desktop or mobile, **When** looking at the zero-experience filter option, **Then** the button reads "Primer Empleo" (with its live matching vacancy counter) rather than "Primer Empleo Real".
2. **Given** a candidate selects and inspects a vacancy classified as zero-experience entry-level, **When** viewing the vacancy's metric summary grid in the detail pane or mobile bottom sheet, **Then** the seniority metric card displays "Primer Empleo" as its primary label while preserving its verified zero-experience subtext.
3. **Given** automated evaluations or AI-assisted vacancy audits describe zero-experience entry-level roles, **When** user-facing terminology is generated or displayed, **Then** it refers to the tier as "Primer Empleo" consistently without "Real" appended.
4. **Given** existing filtering, sorting, and zero-experience verification behavior, **When** the label changes to "Primer Empleo", **Then** all matching rules, default sorting behavior, and verified zero-experience indicators continue working identically.

---

### Edge Cases

- **Source Reference Artifacts**: The provided reference image contains a checkered transparency grid and a floating preview action bar in the upper-right corner; the published brand asset MUST cleanly isolate only the cat mascot illustration (including reconstructing or cleanly cropping any occluded ear tip if needed) so no screenshot UI elements appear anywhere in production.
- **Small Icon Legibility**: At compact sizes (such as the browser tab icon or compact header badge), the cat mascot must remain visually balanced, centered, and distinct against both light and dark browser tab themes.
- **Responsive Filter Spacing**: Shortening "Primer Empleo Real" to "Primer Empleo" must preserve clean spacing, active state highlighting, and live counter alignment across both desktop and narrow mobile viewports.
- **Case Variations**: Any case variation of the phrase in user-visible text ("Primer Empleo Real", "Primer empleo real", "PRIMER EMPLEO REAL") must be covered so no stale wording remains visible to users.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The platform MUST display the personalized suited black cat mascot logo (sourced from the user-provided mascot reference) in the primary navigation header adjacent to the "MishooJobs" brand wordmark across all views.
- **FR-002**: The published logo asset MUST isolate the cat mascot cleanly without any checkerboard background pattern or floating copy/download/share UI overlay artifacts from the reference screenshot.
- **FR-003**: The platform MUST replace the generic header briefcase icon and generic browser tab icon (favicon) with the personalized MishooJobs cat mascot for unified brand recognition.
- **FR-004**: The header logo MUST scale proportionally on both desktop and mobile screens without distorting its aspect ratio, clipping, or displacing adjacent navigation controls.
- **FR-005**: All user-facing filter options for the zero-experience entry-level tier MUST display the label "Primer Empleo" instead of "Primer Empleo Real".
- **FR-006**: All user-facing vacancy detail metric cards and badges that previously displayed "Primer Empleo Real" MUST display "Primer Empleo" while preserving existing subtext (such as verified zero-experience status).
- **FR-007**: User-facing AI audit prompts and explanatory labels referencing this tier MUST use "Primer Empleo" consistently so newly generated explanations match the UI terminology.
- **FR-008**: Changing the display label from "Primer Empleo Real" to "Primer Empleo" MUST NOT alter the underlying classification rules, filtering accuracy, shareable filter links, or saved user preferences.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of views displaying the application header and browser tab present the custom cat mascot logo cleanly, with zero occurrences of the legacy briefcase brand icon or framework default favicon.
- **SC-002**: Visual inspection of the rendered logo confirms 0% visibility of checkerboard grid artifacts or screenshot overlay controls across light and dark browser contexts.
- **SC-003**: A full audit of all user-facing screens, filter controls, metric cards, and user-facing messages shows 0 occurrences of "Primer Empleo Real" (case-insensitive), with 100% standardized to "Primer Empleo".
- **SC-004**: All existing vacancy filtering, sorting, and detail inspection flows for zero-experience jobs remain 100% functional after the label update, with zero broken filter counts or mismatches.

## Assumptions

- **Logo Clean-up**: Because the provided image is a screenshot showing a transparency checkerboard and a system preview toolbar in the top-right corner, the brand asset will be cleanly extracted/prepared with a true transparent background and complete silhouette before inclusion.
- **Scope Boundary**: Only user-visible labels and user-facing explanatory prompts are renamed from "Primer Empleo Real" to "Primer Empleo"; internal category identifiers and historical project documentation remain untouched to preserve backwards compatibility with existing cached data and shared links.
- **Brand Placement**: Placing the custom mascot in the persistent top navigation bar (shared across Vacantes, Postulaciones, and CVs) and in the browser tab icon provides complete brand coverage without adding promotional banners or visual clutter.
