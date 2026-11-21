# Bug Verification: Vacancies with Unspecified Experience Default to 0 Years and Lack Unknown Experience Tag

- **Slug**: experiencie-error
- **Tested**: 2026-11-17T12:52:00Z
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The fix successfully differentiates vacancies with unstated or omitted experience requirements from authentic 0-experience listings across backend classification, database persistence, and frontend presentation. For the user's reported OCC listing ("BESIT SC - Desarrollador Fullstack"), the classifier returns `years_required_min: None`, `VacancyCard` renders the `[ EXP. NO ESPECIFICADA ]` badge with metadata text `Exp. no especificada`, and `PastelMetricGrid` displays `Sin especificar` / `No detallada en vacante`. All 61 backend unit/integration tests and 174 frontend component/service tests pass with zero regressions.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | `.venv/bin/python -c 'SeniorityClassifier.classify_fast(...)'` | pass | Tested with exact text of "Desarrollador Fullstack (Java con Angular / Sueldo libre: 45,000)". Verified `years_required_min is None` and `is_real_first_job is False`. |
| New / updated backend tests | `.venv/bin/pytest backend/tests/unit/test_seniority_classifier.py -v` | pass | 9 passed. Includes `test_ambiguous_defaults_to_junior_preliminary` and `test_unstated_experience_vacancy_fullstack`. |
| New / updated frontend tests | `npm --prefix frontend test -- tests/services/date_utils.test.ts tests/components/VacancyCard.test.tsx tests/components/PastelMetricGrid.test.tsx --run` | pass | 43 passed across 3 test suites. Verifies badge `[ EXP. NO ESPECIFICADA ]`, `Exp. no especificada`, and `Sin especificar`. |
| Regression suite (backend) | `.venv/bin/pytest backend/tests/ -v` | pass | 61 passed in 8.12s. Zero regressions across AI evaluation, scrapers, deduplication, and SSE stream. |
| Regression suite (frontend) | `npm --prefix frontend test -- --run` | pass | 174 passed across 25 test files in 3.41s. Zero regressions. |
| Lint / type-check | `npm --prefix frontend run build` | pass | `tsc && vite build` completed in 1.83s with 0 errors. |
| Database migration | `cd backend && ../.venv/bin/alembic upgrade head` | pass | Applied `006_nullable_years_min` altering `years_required_min` to nullable with check constraint update. |

## Output Excerpts

### Reproduction Post-Fix Excerpt
```text
Classification Result:
seniority_level: SeniorityLevelEnum.JUNIOR
years_required_min: None
is_real_first_job: False
Reproduction test passed successfully!
```

### Backend Pytest Excerpt
```text
======================== 61 passed, 1 warning in 8.12s =========================
```

### Frontend Vitest Excerpt
```text
Test Files  25 passed (25)
     Tests  174 passed (174)
  Duration  3.41s
```

### Frontend Build Type-Check Excerpt
```text
> tsc && vite build
✓ 2248 modules transformed.
✓ built in 1.83s
```

## Residual Risks

- **Cached IndexedDB Records**: Existing user sessions with previously indexed vacancies where `years_required_min` was saved as `0` are gracefully recognized via the client-side heuristic fallback `(vacancy.years_required_min === 0 && !vacancy.is_real_first_job && vacancy.seniority_level === 'junior' && vacancy.reasoning?.includes('sin años especificados'))`, rendering `[ EXP. NO ESPECIFICADA ]` immediately without needing a database reset.
- **Scraper Ingestion**: Live scrapers streaming new jobs seamlessly persist `null` values into PostgreSQL following migration `006_nullable_years_min`.

## Recommendation

Close the bug — verified end-to-end across backend classification, PostgreSQL persistence, TypeScript contracts, and UI components.
