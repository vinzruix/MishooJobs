# UI Contracts: Specific Experience Requirement on Vacancy Cards

**Feature**: `006-vacancy-card-experience`  
**Date**: 2026-11-13  
**Status**: Complete  

---

## 1. Vacancy Card Metadata Row Item Contract

### Location
Rendered in `frontend/src/components/VacancyCard.tsx`, directly inside the metadata row container:
```tsx
<div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-zinc-400 mb-3">
  {/* 1. Location */}
  {/* 2. Salary */}
  {/* 3. Experience Required (NEW) */}
  {/* 4. Relative Time */}
</div>
```

### Component Markup & Classes

```tsx
<div className="flex items-center gap-1 text-zinc-300 font-mono text-xs">
  <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
  <span>{formatExperienceRequired(vacancy.years_required_min)}</span>
</div>
```

---

## 2. Visual States & Formatting Specifications

### State 1: Zero Experience Required (`years_required_min === 0`)
- **Icon**: `Briefcase` (`w-3.5 h-3.5 text-zinc-500`)
- **Label**: `0 años de exp`
- **Rendered Output**:
  ```html
  <div class="flex items-center gap-1 text-zinc-300 font-mono text-xs">
    <svg class="lucide lucide-briefcase w-3.5 h-3.5 text-zinc-500" ...></svg>
    <span>0 años de exp</span>
  </div>
  ```

### State 2: Exactly 1 Year Required (`years_required_min === 1`)
- **Icon**: `Briefcase` (`w-3.5 h-3.5 text-zinc-500`)
- **Label**: `1 año de exp`
- **Rendered Output**:
  ```html
  <div class="flex items-center gap-1 text-zinc-300 font-mono text-xs">
    <svg class="lucide lucide-briefcase w-3.5 h-3.5 text-zinc-500" ...></svg>
    <span>1 año de exp</span>
  </div>
  ```

### State 3: Multiple Years Required (`years_required_min >= 2`)
- **Icon**: `Briefcase` (`w-3.5 h-3.5 text-zinc-500`)
- **Label**: `${years} años de exp` (e.g., `2 años de exp`, `3 años de exp`, `5 años de exp`)
- **Rendered Output**:
  ```html
  <div class="flex items-center gap-1 text-zinc-300 font-mono text-xs">
    <svg class="lucide lucide-briefcase w-3.5 h-3.5 text-zinc-500" ...></svg>
    <span>3 años de exp</span>
  </div>
  ```

---

## 3. Responsive Layout & Accessibility Contract

- **Wrapping Behavior**: Flex items within the metadata row must have `flex-shrink-0` or standard flex wrap without truncation. On mobile viewports $\le 380\text{px}$, the metadata flex container wraps naturally across 2 lines without horizontal scroll or button clipping.
- **Color Contrast**: Text is `text-zinc-300` on `bg-zinc-900/90` background, exceeding WCAG AA minimum contrast ratio ($> 4.5:1$).
- **Semantic Structure**: Rendered as a semantic text node readable by screen readers within the card's role preview context.
