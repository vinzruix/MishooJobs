# Data Model: Custom Brand Logo & "Primer Empleo" Label Standardization

**Feature**: `009-custom-logo-primer-empleo`  
**Date**: 2026-11-27  
**Spec**: [spec.md](./spec.md)

## Overview

This feature introduces zero PostgreSQL schema migrations and zero IndexedDB schema upgrades. It updates UI presentation metadata, static brand assets, AI prompt wording, and output/display text normalization while strictly preserving internal seniority identifiers (`"primer_empleo"`, `is_real_first_job`) and existing cache keys.

---

## 1. Brand Visual Assets (Static Frontend Resources)

| Asset | Location | Format & Dimensions | Visual Spec |
|-------|----------|---------------------|-------------|
| **Header Mascot Logo** | `frontend/src/assets/mishoojobs-logo.png` | Transparent RGBA PNG, 1:1 square (`256x256` or `512x512`) | Isolated suited black/dark-grey cat mascot with yellow eyes, white collar, suit lapels; zero checkerboard, zero floating UI pill, reconstructed right ear tip. |
| **Primary Browser Favicon** | `frontend/public/favicon.svg` | SVG (`viewBox="0 0 64 64"`) with embedded cleaned PNG data URI | Light rounded-square backing badge (`#FFFFFF`/`#F8FAFC`, `rx="14"`, subtle `1.5px` `#E2E8F0` border) framing the centered cat mascot for high contrast on both light and dark browser tabs. |
| **Fallback PNG Favicon** | `frontend/public/favicon.png` | RGBA PNG (`64x64`) | Identical light rounded-square backing badge + centered cat mascot for environments preferring raster favicons. |

---

## 2. Seniority Tier Display Model (Preserving Canonical Keys)

Internal enum and URL parameter identifiers remain immutable (`"primer_empleo"`), while all user-facing labels standardize to `"Primer Empleo"`:

| Layer / Field | Canonical Internal Key | Previous Display Value | Standardized Display Value | Preserved Subtext / Behavior |
|---------------|------------------------|------------------------|----------------------------|------------------------------|
| `FilterToolbar.tsx` (`SENIORITY_OPTIONS`) | `"primer_empleo"` | `"Primer Empleo Real"` | `"Primer Empleo"` | `isHighlight: true`, emerald pill styling, live facet counter, `?seniority=primer_empleo` URL sync |
| `PastelMetricGrid.tsx` (`buildPastelMetrics`) | `vacancy.seniority_level === "primer_empleo"` | `"Primer Empleo Real"` | `"Primer Empleo"` | `subtext: "0 años verificados"`, purple metric card theme |
| `VacancyCard.tsx` (compact card badge) | `vacancy.seniority_level === "primer_empleo"` | `"[ ✓ 0 EXP ]"` / `"[ 0 EXP ]"` | Unchanged (`"[ ✓ 0 EXP ]"` / `"[ 0 EXP ]"`) | Emerald verified zero-experience badge |
| `agy_ai_client.py` (`AUDIT_PROMPT_TEMPLATE`) | `"primer_empleo"` | `'Primer Empleo Real (0 Exp)'` | `'Primer Empleo (0 Exp)'` | Prompt classification instructions for `seniority_level` and `is_real_first_job` |

---

## 3. Cached Text Normalization Mapping

Applies to user-facing string fields returned from PostgreSQL caches or rendered in `VacancyDetailPane`:

- **Target Entities & Fields**:
  - `AIEvaluationResponse` (from `AIEvaluationCache` or fresh `agy` output):
    - `role_readiness_summary: string`
    - `actionable_advice: string`
    - `seniority_audit.reasoning: string` (when present)
  - `SeniorityAuditResponse` (from `JobVacancy` cache or fresh `agy` audit):
    - `reasoning: string`
  - `JobVacancy` (client-side display in `VacancyDetailPane.tsx`):
    - `vacancy.reasoning: string`
    - `auditResult.reasoning: string`
    - `evaluation.role_readiness_summary: string`
    - `evaluation.actionable_advice: string`

- **Transformation Rule**:
  - Pattern: `/\bprimer\s+empleo\s+real\b/gi` (Python: `re.sub(r"\bprimer\s+empleo\s+real\b", "Primer Empleo", text, flags=re.IGNORECASE)`)
  - Replacement: `"Primer Empleo"`
  - Idempotency: `f(f(x)) == f(x)`
  - Non-mutating: Cached PostgreSQL rows are normalized at response serialization / UI render time so cache keys and existing records remain intact.
