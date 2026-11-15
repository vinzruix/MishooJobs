# Data Model: Compact Filters, Content De-Cluttering & Structured Job Descriptions

**Feature Branch**: `008-compact-filters-cleanup`  
**Date**: 2026-11-15  
**Spec**: [spec.md](./spec.md)

---

## 1. Filter Entities & State Types

### `FilterState`
Represents the active filter state managed by `App.tsx` and manipulated via `FilterToolbar.tsx`:

```typescript
import type { SeniorityFilter, TimeframeId } from "../types/job";

export interface FilterState {
  /** Active seniority level or "all" */
  seniority: SeniorityFilter;
  /** Active publication date timeframes (single-select or "all") */
  timeframes: TimeframeId[];
  /** Active work modality: "all" | "remoto" | "hibrido" | "presencial" */
  modality: string;
  /** Active Mexican state code or target: "México" (all) | "CDMX" | "JAL" | "NL" | ... */
  location: string;
}
```

### `MexicanStateOption`
Defines regional target options for the canonical location dropdown:

```typescript
export interface MexicanStateOption {
  code: string;       // e.g. "México", "CDMX", "JAL", "NL", "REMOTO"
  label: string;      // Short label for pill: e.g. "CDMX", "Jalisco", "Toda la República"
  fullName: string;   // Full name for dropdown list: e.g. "Jalisco (Guadalajara / Zapopan)"
}
```

### `SeniorityOption`
Defines experience tiers for the segmented control:

```typescript
export interface SeniorityOption {
  id: SeniorityFilter;
  label: string;
  shortLabel?: string;
  isHighlight?: boolean; // For Primer Empleo Real (emerald accent)
}
```

### `FilterToolbarProps`
Interface contract between `App.tsx` and `FilterToolbar.tsx`:

```typescript
export interface FilterToolbarProps {
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

---

## 2. Structured Job Description Entities

### `StructuredJobSectionId`
Identifies the semantic category of a section in a job description:

```typescript
export type StructuredJobSectionId =
  | "overview"
  | "responsibilities"
  | "requirements"
  | "benefits"
  | "conditions";
```

### `ParsedJobSection`
Represents a parsed semantic section with its title, icon type, and list of content items:

```typescript
export interface ParsedJobSection {
  id: StructuredJobSectionId;
  title: string;
  iconName: "Briefcase" | "ListChecks" | "CheckCircle2" | "Gift" | "MapPin";
  items: string[]; // Formatted bullet items or distinct paragraphs
}
```

### `StructuredJobDescription`
Output of the client-side parser:

```typescript
export interface StructuredJobDescription {
  hasStructuredSections: boolean;
  sections: ParsedJobSection[];
  rawText: string;
}
```

---

## 3. UI De-Cluttering Data Contracts

### Navigation Tab Enum / Type
Refactored concise tab IDs and labels:

```typescript
export type NavigationTab = "search" | "pipeline" | "resumes";

export interface NavigationTabItem {
  id: NavigationTab;
  label: string; // "Vacantes" | "Postulaciones" | "CVs"
  icon: string;
  badgeCount?: number;
}
```

### Clean Resume Card Badges
Replaces raw bracket strings with typed metadata tags:

```typescript
export interface ResumeBadgeInfo {
  label: string;          // Company name (e.g. "Mercado Libre") or Role (e.g. "Frontend Junior")
  type: "vacancy" | "role";
  colorClass: string;     // Tailwind classes without bracket styling
}
```
