# Bug Fix: Vacancies with Unspecified Experience Default to 0 Years and Lack Unknown Experience Tag

- **Slug**: experiencie-error
- **Fixed**: 2026-11-17T12:50:00Z
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Differentiated unstated or omitted experience requirements from explicit 0-experience requirements across the backend classification pipeline and frontend UI. Ambiguous vacancies with neutral titles and no experience stated now return `years_required_min: None`, render `[ EXP. NO ESPECIFICADA ]` badges on `VacancyCard` and `VacancyDetailPane`, and display `Exp. no especificada` in metadata and `Sin especificar` / `No detallada en vacante` in the detail pastel grid.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `backend/src/mishoojobs/services/seniority_classifier.py` | modified | Rule 11 returns `years_required_min: None` instead of `0` when experience is omitted. |
| `backend/src/mishoojobs/schemas/job.py` | modified | Allowed `years_required_min: Optional[int] = Field(default=None, ge=0)`. |
| `backend/src/mishoojobs/schemas/evaluation.py` | modified | Allowed `years_required_min: Optional[int] = Field(default=None, ge=0)`. |
| `backend/src/mishoojobs/models/vacancy.py` | modified | `years_required_min` mapped as nullable with updated check constraint. |
| `backend/src/mishoojobs/services/agy_ai_client.py` | modified | Updated audit prompt and output cleaner to parse nullable `years_required_min`. |
| `backend/alembic/versions/006_allow_nullable_years_required_min.py` | added | Migration altering `years_required_min` to nullable with check constraint update. |
| `backend/tests/fixtures/seniority_fixtures.json` | modified | Ambiguous fixture expectation updated to `null`. |
| `backend/tests/unit/test_seniority_classifier.py` | modified | Added tests for unstated experience on OCC Fullstack vacancy. |
| `frontend/src/types/job.ts` | modified | Updated `years_required_min?: number | null`. |
| `frontend/src/services/date_utils.ts` | modified | `formatExperienceRequired` returns `Exp. no especificada` for null/undefined/negative values. |
| `frontend/src/components/VacancyCard.tsx` | modified | Added `[ EXP. NO ESPECIFICADA ]` badge and `Exp. no especificada` metadata text. |
| `frontend/src/components/PastelMetricGrid.tsx` | modified | Displays `Sin especificar` / `No detallada en vacante` and `Requisitos abiertos` for unstated experience. |
| `frontend/src/components/VacancyDetailPane.tsx` | modified | Surfaces `[ EXP. NO ESPECIFICADA ]` badge in detail header. |
| `frontend/tests/services/date_utils.test.ts` | modified | Added test for `formatExperienceRequired(null/undefined/-1)`. |
| `frontend/tests/components/VacancyCard.test.tsx` | modified | Added test for `[ EXP. NO ESPECIFICADA ]` badge and unstated text. |
| `frontend/tests/components/PastelMetricGrid.test.tsx` | modified | Added test for unstated experience in pastel grid. |
| `GEMINI.md` | modified | Documented `[experiencie-error]` convention in Section 7. |

## Diff Highlights

```python
# backend/src/mishoojobs/services/seniority_classifier.py
         # 11. Ambiguous / Neutral Default (FR-014)
         return {
             "seniority_level": SeniorityLevelEnum.JUNIOR,
-            "years_required_min": 0,
+            "years_required_min": None,
             "is_real_first_job": False,
             "audit_status": AuditStatusEnum.PRELIMINARY,
             "reasoning": "Posición con requisitos abiertos sin años especificados; asignada preliminarmente a Junior.",
```

```typescript
// frontend/src/services/date_utils.ts
 export function formatExperienceRequired(years?: number | null): string {
+  if (years == null || isNaN(years) || years < 0) {
+    return "Exp. no especificada";
+  }
+  const normalizedYears = Math.floor(years);
   if (normalizedYears === 0) {
     return "0 años de exp";
   }
```

## Tests Added or Updated

- `backend/tests/unit/test_seniority_classifier.py::test_ambiguous_defaults_to_junior_preliminary` — asserts `years_required_min is None`.
- `backend/tests/unit/test_seniority_classifier.py::test_unstated_experience_vacancy_fullstack` — pins down the exact OCC Fullstack Java+Angular vacancy from user report.
- `frontend/tests/services/date_utils.test.ts::formatExperienceRequired` — tests `null`, `undefined`, and `-1` formatting.
- `frontend/tests/components/VacancyCard.test.tsx` — tests rendering of `[ EXP. NO ESPECIFICADA ]` and `"Exp. no especificada"`.
- `frontend/tests/components/PastelMetricGrid.test.tsx` — tests `"Sin especificar"` and `"No detallada en vacante"`.

## Local Verification

- Commands run:
  - `.venv/bin/pytest backend/tests/ -v` → 61 passed in 9.43s.
  - `npm --prefix frontend test -- --run` → 174 passed across 25 test files in 3.41s.
  - `cd backend && ../.venv/bin/alembic upgrade head` → Applied `006_nullable_years_min`.
- Manual checks:
  - Verified OCC Fullstack vacancy payload returns `years_required_min: null` and renders `[ EXP. NO ESPECIFICADA ]`.

## Deviations from Assessment

None. The implementation followed the preferred remediation outlined in `assessment.md`.

## Follow-ups

- Monitor scrapers to verify whether newly ingested vacancies with unstated requirements seamlessly persist `null` in PostgreSQL.
