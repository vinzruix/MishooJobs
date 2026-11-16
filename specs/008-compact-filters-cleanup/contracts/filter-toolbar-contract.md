# Contract: Filter Toolbar & Search Bar Interaction Contract

**Feature Branch**: `008-compact-filters-cleanup`  
**Date**: 2026-11-15  
**Spec**: [spec.md](../spec.md)

---

## 1. `SearchBar` Contract

### Props
```typescript
interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
  initialQuery?: string;
}
```

### Invariants & Behaviors
1. **Zero Location Input**: The search bar contains ONLY the keyword text input, the keyboard shortcut indicator (`/`), and the search submit button.
2. **Keyboard Navigation**: Pressing `/` while outside any text input immediately focuses and selects the search input.
3. **Submission**: Submitting the form (via Enter or button click) trims whitespace and invokes `onSearch(query.trim())`. Empty queries are prevented.

---

## 2. `FilterToolbar` Contract

### Props
```typescript
interface FilterToolbarProps {
  filters: FilterState;
  seniorityCounts: Record<SeniorityFilter, number>;
  timeframeCounts?: Record<TimeframeId, number>;
  hideApplied: boolean;
  hiddenAppliedCount: number;
  totalResultsCount: number;
  duplicatesMergedCount?: number;
  onFilterChange: (filters: FilterState) => void;
  onToggleHideApplied: () => void;
  onResetFilters: () => void;
}
```

### Component Structure & Visual Contract
```
[ Seniority Segmented Control ] | [ Date Dropdown ] [ Modality Dropdown ] [ State Dropdown ] | [ Hide Applied Toggle ] | [ Reset Button ]
```

1. **Seniority Segmented Control**:
   - Contiguous pill container: `[ Todos 42 | Primer Empleo 8 | Pasantías 5 | Junior 18 | Mid 7 | Senior 4 ]`.
   - Single-select: Clicking an active tier (other than "Todos") toggles back to "Todos".
   - Active state: `bg-slate-900 text-white font-semibold shadow-xs`.
   - Inactive state: `text-slate-600 hover:text-slate-900 hover:bg-slate-100`.
   - Emerald highlight indicator for `primer_empleo`.
2. **Date Dropdown Popover**:
   - Trigger Button: Displays active timeframe label (e.g. "Cualquier fecha" vs "Últimos 7 días") with chevron icon and active badge indicator.
   - Popover Menu:
     - Absolute positioned popover (`bg-white border border-slate-200/90 rounded-2xl shadow-xl p-2 z-30`).
     - Options: `Hoy (24h)`, `3 días`, `7 días`, `14 días`, `30 días`, `Todas`.
     - Each item displays label and dynamic vacancy count.
     - Click outside or `Escape` closes the popover immediately.
3. **Modality Dropdown Popover**:
   - Trigger Button: Shows active modality ("Todas", "Remoto", "Híbrido", "Presencial").
   - Popover Menu: List of 4 modalities. Clicking an item updates `filters.modality` and closes popover.
4. **State / Location Dropdown Popover**:
   - Canonical regional selector for Mexico.
   - Options include: `Toda la República (México)`, `CDMX`, `Jalisco (GDL)`, `Nuevo León (MTY)`, `Querétaro`, `Puebla`, `Guanajuato`, `Yucatán`, `Baja California`, `100% Remoto`.
   - Trigger shows selected short state name.
5. **Hide Applied Toggle**:
   - Toggle button with `Eye` / `EyeOff` icon and count (e.g. "Ocultar postuladas (3)").
   - Active state styles button with subtle emerald accent.
6. **Reset Button ("Restablecer")**:
   - Appears ONLY when at least one filter criterion is non-default:
     - `seniority !== "all"` OR
     - `modality !== "all"` OR
     - `location !== "México"` OR
     - `timeframes !== ["all"]` OR
     - `hideApplied === true`
   - Clicking invokes `onResetFilters()`.
   - Crucial requirement: Resets ONLY toolbar filters; preserves current query string in `SearchBar`.

### Responsiveness Contract (<768px Mobile)
- Single horizontal row container:
  ```css
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  ```
- No multi-row wrapping or expansion.
- Mask indicator on edges: `mask-image: linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)`.
