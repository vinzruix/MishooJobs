# Implementation Plan: Specific Experience Requirement Display on Vacancy Cards

**Branch**: `006-vacancy-card-experience` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-vacancy-card-experience/spec.md`

## Summary

Enhance each search feed vacancy card (`VacancyCard.tsx`) to display the specific number of years of commercial experience required directly in its primary metadata row alongside Location, Salary, and Publication Date. This eliminates the need for candidates to open the details modal simply to check experience eligibility. The display features a `Briefcase` icon and localized Mexican Spanish grammar (`0 años de exp`, `1 año de exp`, `N años de exp`), operating purely on the client-side using existing `years_required_min` attributes without backend changes, adhering strictly to the user's *"DO NOT DO ANYTHING ELSE"* constraint.

## Technical Context

**Language/Version**: TypeScript 5.5+ (Strict Mode)  
**Primary Dependencies**: React 19, Tailwind CSS 3.4+, Lucide React (`Briefcase`), Vitest + React Testing Library  
**Storage**: N/A (Client-side UI presentation of existing streamed/cached vacancy attributes)  
**Testing**: Vitest (`frontend/tests/components/VacancyCard.test.tsx`) with 100% offline unit execution  
**Target Platform**: Modern Web Browsers (Chrome, Firefox, Safari, Edge; mobile 360px+ to desktop 4K)  
**Project Type**: Web Application (React frontend UI component enhancement)  
**Performance Goals**: Zero impact on rendering performance ($< 1$ ms render time per card), 0 layout shifts  
**Constraints**: Midudev-inspired dark mode aesthetic (`zinc-950`/`zinc-900`/`zinc-800`), Geist Mono typography, WCAG AA contrast ratio ($> 4.5:1$), strictly no modifications outside search feed vacancy cards  
**Scale/Scope**: Applied across all rendered vacancy cards in search feeds  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Compliance Analysis | Status |
|------------------|---------------------|--------|
| **I. Privacy & Zero Friction** | Purely client-side UI presentation of public vacancy data. Zero candidate PII collected, processed, or stored. | **PASS** |
| **II. Mexican Labor Market Calibration** | Formatted strictly in Mexican Spanish with proper grammatical agreement (`0 años de exp`, `1 año de exp`, `N años de exp`). | **PASS** |
| **III. Zero Scope Creep & Anti-Bloat** | Strictly bounded to displaying the experience requirement on `VacancyCard.tsx`. Excludes `PipelineView`, filters, and backend changes. | **PASS** |
| **IV. Midudev-Inspired Aesthetic & Technical Whitelist** | Uses `lucide-react` `Briefcase` with `zinc-500` icon, `zinc-300 font-mono text-xs` typography, conforming to the existing dark mode design tokens. | **PASS** |
| **V. Cost-Optimized AI & Scraping** | Uses pre-extracted `years_required_min` attribute from existing vacancy payloads. Zero new API calls or LLM queries. | **PASS** |
| **VI. Visual Transparency Against Predatory Postings** | Directly surfaces qualification requirements upfront, empowering early-career job-seekers to quickly verify 0-experience opportunities. | **PASS** |

## Project Structure

### Documentation (this feature)

```text
specs/006-vacancy-card-experience/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0 research & architectural decisions
├── data-model.md        # Phase 1 presentation data model
├── quickstart.md        # Phase 1 quickstart validation guide
├── contracts/           # Phase 1 UI contract specifications
│   └── ui-contracts.md  # Detailed component markup and visual states
├── checklists/          # Quality validation checklists
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 task breakdown (created by /speckit-tasks)
```

### Source Code (affected paths)

```text
frontend/
├── src/
│   ├── components/
│   │   └── VacancyCard.tsx          # Metadata row experience item integration
│   └── services/
│       └── date_utils.ts            # (or formatters.ts) formatExperienceRequired helper
└── tests/
    └── components/
        └── VacancyCard.test.tsx     # Unit tests for 0, 1, and N years formatting
```

**Structure Decision**: Standard web application frontend component update with localized helper function and dedicated Vitest component tests.

## Complexity Tracking

> **Constitution check fully passed with zero violations. No deviations to justify.**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *None* | *N/A* | *N/A* |

---

## Planned Implementation Phases

### Phase 1: Preparation & Formatting Utility
- Implement pure helper `formatExperienceRequired(years: number): string` enforcing proper singular/plural Spanish rules (`0 años de exp`, `1 año de exp`, `${years} años de exp`).
- Export and verify utility unit tests.

### Phase 2: VacancyCard Integration
- Import `Briefcase` from `lucide-react` into `VacancyCard.tsx`.
- Render the experience requirement indicator in the card metadata row between Salary and Relative Time.
- Verify responsive layout wrapping on narrow mobile screens (360px).

### Phase 3: Automated Testing & Verification
- Update `frontend/tests/components/VacancyCard.test.tsx` to assert that `0 años de exp`, `1 año de exp`, and `N años de exp` render as expected.
- Run complete frontend test suite offline to ensure zero regressions.

### Phase 4: Maintenance & Architectural Decision Logging
- **Mandatory Documentation Step**: Update [`GEMINI.md`](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/GEMINI.md) Section 7 (Architectural Decisions & Conventions Log) with key convention:
  - `[006] Surface numerical years_required_min on VacancyCard metadata row with localized Mexican Spanish agreement (0 años, 1 año, N años) and Briefcase icon without modal inspection.`
