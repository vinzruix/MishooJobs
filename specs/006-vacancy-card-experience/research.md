# Research: Specific Experience Requirement Display on Vacancy Cards

**Feature**: `006-vacancy-card-experience`  
**Date**: 2026-11-13  
**Scope**: Card metadata layout integration, Mexican Spanish experience formatting rules, icon selection, responsive flex wrapping, and strict scope boundary enforcement.

---

## 1. Card Metadata Row Layout Integration

### Decision
Render the required years of experience as a dedicated flex item inside the existing location/salary/date metadata row (`<div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-zinc-400 mb-3">`) in `VacancyCard.tsx`.

### Placement Order
`[MapPin: Ubicación] • [DollarSign: Sueldo] • [Briefcase: Experiencia] • [Clock: Tiempo relativo]`

### Rationale
1. **Natural Visual Scanning (Spec Clarification 1)**: Candidates scanning job listings evaluate four primary qualification criteria before diving into skills: Where is it? How much does it pay? How much experience is required? When was it published? Placing the experience requirement directly beside Location and Salary keeps primary decision factors clustered logically together.
2. **Avoids Status Badge Clutter**: The top badge row already hosts Modality (`REMOTO`), Seniority tier (`[ JR ]`, `[ MID ]`, `[ 0 EXP ]`), Discrepancy warning (`[ REQ. DISCREPANTES ]`), `Nueva`, and Scam badges. Adding numerical experience text to the badge row causes badge stacking and horizontal overflow on narrow mobile viewports.
3. **Responsive Flex Wrapping**: The metadata row uses `flex-wrap gap-y-1 gap-x-3`. When viewed on narrow mobile screens (360px), items wrap cleanly to a second line without clipping buttons or causing layout shifts.

### Alternatives Considered
- **Inside Top Seniority Badge (e.g. `[ JR • 1 AÑO ]`)**: Rejected during clarification (Option B) because it increases badge width and creates visual redundancy for `primer_empleo` which already displays `[ 0 EXP ]`.
- **Card Footer / Actions Bar**: Rejected because footer space is reserved for action buttons (`Guardar`, `Descartar`, `Postularme`, `Detalles`) and primary portal links.

---

## 2. Mexican Spanish Number Formatting & Linguistic Agreement

### Decision
Implement a pure, deterministic helper function `formatExperienceRequired(years: number): string` that enforces grammatical number-noun agreement tailored to Mexican professional listings:

```typescript
export function formatExperienceRequired(years: number): string {
  if (years <= 0) {
    return "0 años de exp";
  }
  if (years === 1) {
    return "1 año de exp";
  }
  return `${years} años de exp`;
}
```

### Rationale
1. **Grammatical Agreement (Spec FR-003, SC-004)**: In Spanish, the noun `año` is strictly singular when the quantity is 1 ("1 año de exp"), and plural for 0 and all integers $\ge 2$ ("0 años de exp", "2 años de exp"). Machine translation often erroneously outputs "1 años", which damages platform credibility.
2. **Explicit Numerical Clarity ("SPECIFIC NUMBER")**: The user explicitly demanded "ADD IN EACH CARD THE SPECIFIC NUMBER OF EXPERIENCIE REQUIRED". Using "0 años de exp" rather than purely textual "Sin experiencia" guarantees that the number "0" is unmistakably visible on every entry-level card.
3. **Compact Monospace Density**: Appending `de exp` provides sufficient clarity while saving critical horizontal space compared to `de experiencia laboral requerida`.

### Alternatives Considered
- **"Sin experiencia" for 0 years**: Rejected because the user specifically requested the numerical figure ("THE SPECIFIC NUMBER OF EXPERIENCIE REQUIRED"). Displaying `0 años de exp` satisfies both the numerical requirement and clear linguistic comprehension.
- **Range Formatting (e.g. "2-4 años")**: Rejected because `years_required_min` represents the deterministic minimum threshold demanded for candidate qualification.

---

## 3. Icon Selection & Aesthetic Harmonization

### Decision
Use `Briefcase` from `lucide-react` with icon dimensions `w-3.5 h-3.5 text-zinc-500`, paired with `text-zinc-300 font-normal` or `text-zinc-400 font-mono` typography, matching the visual weight of `MapPin`, `DollarSign`, and `Clock`.

### Rationale
1. **Visual Consistency (Midudev Aesthetic & Constitution Principle IV)**: The metadata row already uses `MapPin` (`text-zinc-500`), `DollarSign` (`text-emerald-500`), and `Clock` (`text-zinc-500`). `Briefcase` is the universal, unambiguous symbol for employment and work experience in developer tooling.
2. **Color Palette Harmony**: Keeping the icon in `text-zinc-500` and text in `text-zinc-300` ensures it does not compete visually with the emerald salary highlight or amber/rose warning badges, preserving clear visual hierarchy.

---

## 4. Strict Scope Boundary Enforcement ("DO NOT DO ANYTHING ELSE")

### Decision
Scope of changes is strictly restricted to:
1. `frontend/src/services/formatters.ts` (or `date_utils.ts` / dedicated utility): Add `formatExperienceRequired(years: number)`.
2. `frontend/src/components/VacancyCard.tsx`: Import `Briefcase` from `lucide-react` and render the formatted experience indicator in the metadata row.
3. `frontend/tests/components/VacancyCard.test.tsx`: Add unit test assertions verifying that `0 años de exp`, `1 año de exp`, and `N años de exp` render accurately.

### Explicitly Excluded (Out of Scope)
- No modifications to `PipelineView.tsx` (confirmed in Clarification 2).
- No modifications to `FilterDrawer.tsx` or search filters.
- No modifications to backend models, database migrations, or scrapers (as `years_required_min` is already supplied in `JobVacancy`).
- No redesigns of modal dialogs or candidate profiles.
