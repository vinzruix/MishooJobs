# Phase 1 Data Model: Modern Split-View Jobs Layout & Clean UI Redesign

**Feature Branch**: `007-modern-jobs-ui`  
**Date**: 2026-11-15  
**Spec Reference**: `specs/007-modern-jobs-ui/spec.md`  

---

## 1. Core UI Entities & Data Models

### 1.1 JobVacancy (Extended UI Projection)
The existing canonical `JobVacancy` interface remains the backbone entity, augmented with clean visual projections for master card badges and detail rendering.

```typescript
export interface JobVacancy {
  fingerprint: string;                  // Unique composite hash (title + company + location)
  title: string;                        // Job title (e.g. "Desarrollador Python Jr")
  company_name: string;                 // Employer name or "Empresa Confidencial"
  location_state: string;               // Normalized Mexican state or "REMOTO"
  modality: "remoto" | "hibrido" | "presencial"; // Work arrangement
  seniority_level: "primer_empleo" | "pasantia" | "junior" | "mid" | "senior";
  years_required_min: number;           // Explicit minimum years (0 for authentic first jobs)
  is_real_first_job: boolean;           // True if authentic 0-exp job
  audit_status: "preliminary" | "verified" | "rejected";
  reasoning: string;                    // Audit or scam explanation
  has_discrepancy: boolean;             // True if titled Jr but requires 2+ years
  currency: string;                     // Default: "MXN"
  salary_min?: number | null;           // Monthly minimum salary in MXN
  salary_max?: number | null;           // Monthly maximum salary in MXN
  salary_period?: string | null;        // "mes", "quincena", "hora"
  description: string;                  // Scraped HTML/text description (DOMPurified)
  skills: string[];                     // Extracted technical skills
  published_at?: string | null;         // ISO UTC datetime string
  external_links: VacancyLink[];        // Verified portal links (Computrabajo, Indeed, OCC)
  is_scam?: boolean;                    // True if predatory posting detected
  scam_flags?: string[];                // ["mlm", "candidate_fee", "commission_only"]
  last_verified_at?: string | null;     // ISO timestamp of HTTP HEAD check
}

export interface VacancyLink {
  portal_name: "computrabajo" | "indeed" | "occ" | string;
  direct_url: string;                   // Verified external application URL
  is_active: boolean;                   // Verified via HTTP HEAD (200/302/WAF 403)
}
```

---

### 1.2 PastelMetricConfig & Semantic Themes
Represents the visual and semantic configuration of the four pastel metric blocks displayed in the right detail pane.

```typescript
export type PastelTheme = "emerald" | "sky" | "amber" | "purple";

export interface PastelMetricItem {
  id: "salary" | "modality" | "experience" | "seniority";
  theme: PastelTheme;
  label: string;                        // e.g. "Salario", "Modalidad", "Experiencia", "Nivel"
  value: string;                        // e.g. "$18,000 MXN/mes", "Remoto", "0 años", "Primer Empleo"
  subtext?: string;                     // e.g. "Estimado", "100% Home Office", "Auditado"
  icon: string;                         // Lucide icon identifier ("DollarSign", "MapPin", "Briefcase", "Award")
  badgeStyle: {
    bgClass: string;                    // e.g. "bg-emerald-50"
    borderClass: string;                // e.g. "border-emerald-200"
    textClass: string;                  // e.g. "text-emerald-950"
    labelClass: string;                 // e.g. "text-emerald-700"
    iconClass: string;                  // e.g. "text-emerald-600"
  };
}
```

#### Validation & Mapping Rules
- **Salary (`theme: emerald`)**:
  - If `salary_min` and `salary_max` exist: `"$X - $Y MXN/mes"`.
  - If single amount exists: `"$X MXN/mes"`.
  - If missing/null: `"A convenir"`, subtext `"Sueldo no publicado"`.
- **Modality (`theme: sky`)**:
  - Capitalized Mexican modality (`"Remoto"`, `"Híbrido"`, `"Presencial"`).
- **Experience / Match (`theme: amber`)**:
  - If candidate profile/skills active: Displays match score percentage (e.g., `"85% Match"`).
  - Otherwise: Displays normalized years (e.g., `"0 años"`, `"1 año"`, `"N años"`, or `"Sin especificar"`).
- **Seniority (`theme: purple`)**:
  - Maps `seniority_level` to human-readable Mexican tier:
    - `primer_empleo` $\rightarrow$ `"Primer Empleo Real"`
    - `pasantia` $\rightarrow$ `"Pasantía / Prácticas"`
    - `junior` $\rightarrow$ `"Junior"`
    - `mid` $\rightarrow$ `"Mid-Level"`
    - `senior` $\rightarrow$ `"Senior"`

---

### 1.3 ActiveSelectionState
Encapsulates user selection, current detail tab, and responsive presentation mode.

```typescript
export type DetailTab = "description" | "ai_eval";

export interface MasterDetailSelectionState {
  selectedFingerprint: string | null;   // Fingerprint of active vacancy
  activeTab: DetailTab;                 // "description" | "ai_eval"
  isMobileDrawerOpen: boolean;          // True when mobile bottom sheet is visible (< 1024px)
  scrollTargetFingerprint?: string;     // Active card to keep centered during keyboard nav
}
```

---

### 1.4 FilterState (Clean Mexican Localization)
Retains core filtering capabilities while purging marketing slogans and slop labels.

```typescript
export interface FilterState {
  modality: "all" | "remoto" | "hibrido" | "presencial";
  seniority: "all" | "primer_empleo" | "pasantia" | "junior" | "mid" | "senior";
  location: string;                     // e.g. "México", "CDMX", "JAL", "NL", "REMOTO"
  timeframes: TimeframeId[];            // ["all"] or ["24h"], ["3d"], etc.
}
```

---

## 2. State Transitions & Lifecycle

```
[SSE Stream Ingestion]
        │
        ▼ (first batch arrives)
[Auto-Select First Vacancy] ────► [Update Detail Pane State]
        │
   ┌────┴───────────────────────────┐
   ▼ (User clicks card)             ▼ (User presses 'j'/'k')
[Select Target Card]         [Select Next/Prev Card]
   │                                │
   └─────────────┬──────────────────┘
                 │
                 ▼
      [Device Viewport Check]
       ├── Desktop (≥ 1024px) ──► Instant Detail Pane Update in Right Column (<50ms)
       └── Mobile (< 1024px)   ──► Slide-Up Vaul Bottom Sheet with Drag Handle
                 │
                 ▼
      [Detail Pane Actions]
       ├── Switch Tab ──────────► Toggle "Descripción" ↔ "Evaluación AI"
       ├── Postularme ahora ────► Open Verified External URL in New Tab
       ├── Guardar (s) ─────────► Dexie.js Local Pipeline ("saved")
       └── Postulado (a) ───────► Dexie.js Local Pipeline ("applied")
```

### Transition Invariants
1. **Cache Isolation**: Selecting a new vacancy MUST instantiate a clean evaluation view or load that specific vacancy's cached evaluation. No state from vacancy $A$ may bleed into vacancy $B$.
2. **Keyboard Focus Clamping**: Pressing `j`/`k` beyond the bounds of `displayedVacancies` clamps to `[0, displayedVacancies.length - 1]` without throwing or deselecting.
3. **Responsive Consistency**: Resizing the window across the 1024px boundary preserves `selectedFingerprint` so the candidate never loses their active vacancy.
