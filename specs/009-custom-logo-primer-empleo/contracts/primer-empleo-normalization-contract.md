# Contract: "Primer Empleo" Label Standardization & Cached Text Normalization

**Feature**: `009-custom-logo-primer-empleo`  
**Scope**: `FilterToolbar.tsx`, `PastelMetricGrid.tsx`, `VacancyDetailPane.tsx`, `text_normalizer.ts`, `agy_ai_client.py`, `routes/vacancies.py`

## 1. UI Label Contracts

### `FilterToolbar.tsx` (`SENIORITY_OPTIONS`)
- Option with `id: "primer_empleo"` MUST expose `label: "Primer Empleo"` and `isHighlight: true`.
- Clicking the `"Primer Empleo"` button MUST continue emitting `filters.seniority === "primer_empleo"` (and toggle back to `"all"` if already active), preserving `?seniority=primer_empleo` URL sync and live counter synchronization.

### `PastelMetricGrid.tsx` (`buildPastelMetrics`)
- For `vacancy.seniority_level === "primer_empleo"`:
  - `value` MUST equal `"Primer Empleo"`.
  - `subtext` MUST remain `"0 años verificados"`.
  - `theme` MUST remain `"purple"`.

## 2. AI Prompt & Response Normalization Contracts

### Backend Normalization (`mishoojobs.services.agy_ai_client`)
- `AgyAIClient.AUDIT_PROMPT_TEMPLATE` MUST reference `'Primer Empleo (0 Exp)'` instead of `'Primer Empleo Real (0 Exp)'`.
- Helper `normalize_primer_empleo_text(text: str) -> str`:
  - Replaces any case-insensitive match of `\bprimer\s+empleo\s+real\b` with `"Primer Empleo"`.
  - Applied in:
    - `AgyAIClient.clean_json_output` (`role_readiness_summary`, `actionable_advice`)
    - `AgyAIClient.clean_seniority_audit_output` (`reasoning`)
    - `POST /api/v1/vacancies/evaluate` (`AIEvaluationResponse` on both PostgreSQL cache hit and fresh `agy` output, including `seniority_audit.reasoning`)
    - `POST /api/v1/vacancies/{fingerprint}/audit` (`SeniorityAuditResponse` on both cached `verified` DB rows and fresh audit output)

### Frontend Display Normalization (`frontend/src/services/text_normalizer.ts` & `VacancyDetailPane.tsx`)
- Helper `normalizeSeniorityDisplayText(text?: string | null): string`:
  - Returns `""` when input is null/undefined/empty; otherwise replaces `/\bprimer\s+empleo\s+real\b/gi` with `"Primer Empleo"`.
  - Applied in `VacancyDetailPane.tsx` when rendering:
    - `auditResult?.reasoning || vacancy.reasoning`
    - `evaluation.role_readiness_summary`
    - `evaluation.actionable_advice`

## 3. Backwards Compatibility Invariant (FR-008)
- Internal enums (`SeniorityLevelEnum.PRIMER_EMPLEO = "primer_empleo"`), database enum values, URL query parameter values (`?seniority=primer_empleo`), heuristic scoring keys, and `is_real_first_job` boolean flags MUST remain completely unchanged.
