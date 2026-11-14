# Data Model: Specific Experience Requirement Display on Vacancy Cards

**Feature**: `006-vacancy-card-experience`  
**Date**: 2026-11-13  
**Status**: Complete  

---

## 1. Existing Entity Attributes

The feature leverages the existing `years_required_min` attribute on the client-side `JobVacancy` interface without requiring database schema changes or new backend migrations.

### `JobVacancy` (Frontend TypeScript Interface)

Located in `frontend/src/types/job.ts`:

```typescript
export interface JobVacancy {
  id?: number;
  fingerprint: string;
  portal: PortalName;
  external_id: string;
  title: string;
  company_name: string;
  location_city: string;
  location_state: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: SalaryPeriod;
  currency: string;
  modality: Modality;
  seniority_level: SeniorityLevel;
  years_required_min: number; // Evaluated non-negative integer (0, 1, 2, 3, 5, etc.)
  audit_status?: AuditStatus;
  is_real_first_job?: boolean;
  reasoning?: string;
  has_discrepancy?: boolean;
  published_at?: string | null;
  scam_report?: ScamReport | null;
  skills?: string[];
  external_links?: ExternalLink[];
}
```

---

## 2. Formatting & Presentation Model

### Experience Formatting Contract

```typescript
/**
 * Formats a numerical years-of-experience requirement into localized Mexican Spanish.
 * 
 * @param years - Minimum commercial years of experience required (int >= 0)
 * @returns Localized, grammatically correct string:
 *   - years <= 0: "0 años de exp"
 *   - years === 1: "1 año de exp"
 *   - years >= 2: "${years} años de exp"
 */
export function formatExperienceRequired(years: number): string;
```

### State Transitions & Data Flow

```text
[Backend Scrapers / Fast-pass Heuristics]
                   │
                   ▼ (Fast-pass: preliminary years_required_min)
             [SSE Stream]
                   │
                   ▼
           [JobVacancy State] ────────────────────────┐
                   │                                  │
                   ▼                                  ▼
      [VacancyCard Metadata Row]           [VacancyDetailModal]
      (Displays: "X años de exp")                     │
                   ▲                                  ▼
                   │                           [On-Demand AI Audit]
                   │                                  │
                   └──────────────────────────────────┘
                 (Real-time update if audited value changes)
```

---

## 3. Validation Rules

1. **Non-Negative Integer Enforcement**: `years_required_min` is strictly an integer $\ge 0$. Any negative or undefined value gracefully defaults to `0`.
2. **Singular Agreement for 1**: When `years_required_min === 1`, output MUST be `"1 año de exp"`.
3. **Plural Agreement for 0 and $\ge 2$**: When `years_required_min === 0` or $\ge 2$, output MUST be `"X años de exp"`.
4. **Zero-PII Guarantee**: No candidate data is read, transformed, or stored during the rendering of the experience indicator.
