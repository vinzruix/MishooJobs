# Bug Fix: Vacancy Seniority Audit 404 & Cold-Start Search Delivery

- **Slug**: vacancy-fingerprint-not-found
- **Fixed**: 2026-11-09T21:51:00-06:00
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Eliminated the race condition where clicking fresh vacancies before search stream completion caused HTTP 404 errors during seniority audits, by persisting batches progressively in SSE streaming and adding on-demand fallback persistence in the audit endpoint. Additionally, added cold-start connection retry with backoff for Indeed México scraping and interactive retry support in the frontend modal.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `backend/src/mishoojobs/api/routes/vacancies.py` | modified | Added fallback to client `job_description` and on-demand PostgreSQL persistence in `audit_vacancy_seniority`, preventing 404 when clicking unpersisted cards |
| `backend/src/mishoojobs/api/sse.py` | modified | Spawns `persist_vacancies_safe` progressively per portal batch in `job_search_stream_generator`, added deduplication checks for links/scam assessments, and replaced silent `pass` with logger warning |
| `backend/src/mishoojobs/schemas/evaluation.py` | modified | Added optional `title` and `company_name` to `SeniorityAuditRequest` |
| `backend/src/mishoojobs/services/scrapers/indeed.py` | modified | Added 2-attempt loop with 500ms backoff in `IndeedScraper.search()` to absorb initial TLS/handshake drops |
| `backend/tests/integration/test_seniority_audit_api.py` | modified | Added test assertion validating that auditing an unpersisted vacancy succeeds (200 OK) and caches correctly in PostgreSQL |
| `backend/tests/unit/test_scrapers.py` | modified | Added `test_indeed_search_retry_on_initial_failure` to verify 2-attempt retry behavior |
| `frontend/src/services/api.ts` | modified | Added optional `title` and `companyName` parameters to `auditVacancy` client service |
| `frontend/src/components/VacancyDetailModal.tsx` | modified | Extracted `performAudit`, passes vacancy metadata to `auditVacancy`, and added an interactive "Reintentar" button in the audit error alert |

## Diff Highlights

```python
# backend/src/mishoojobs/api/routes/vacancies.py
effective_desc = (db_vac.description_clean if db_vac else "") or ""
if request and request.job_description and len(request.job_description.strip()) > len(effective_desc):
    effective_desc = request.job_description.strip()

if not db_vac and not effective_desc:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Vacante con fingerprint '{fingerprint}' no encontrada.")
```

```python
# backend/src/mishoojobs/api/sse.py
if deduped_portal_vacs:
    all_extracted_vacancies.extend(deduped_portal_vacs)
    asyncio.create_task(persist_vacancies_safe(deduped_portal_vacs))
    yield format_sse("vacancy_batch", ...)
```

## Tests Added or Updated

- `backend/tests/integration/test_seniority_audit_api.py::test_seniority_audit_api_workflow_and_caching` — Verifies that auditing an unpersisted vacancy via `POST /api/v1/vacancies/{fingerprint}/audit` with client `job_description` succeeds without 404 and writes the verified vacancy to PostgreSQL.
- `backend/tests/unit/test_scrapers.py::test_indeed_search_retry_on_initial_failure` — Verifies that `IndeedScraper.search()` executes a second attempt with backoff upon initial connection failure or handshake drop.

## Local Verification

- Commands run:
  - `./.venv/bin/pytest backend/tests/ -v` → 49 passed in 23.13s (100% offline).
  - `cd frontend && npm test -- --run` → 18 test files passed (114 tests) in 3.97s.
- Manual checks:
  - Verified live SSE streaming persists vacancies progressively.
  - Verified `SeniorityAuditRequest` schema accepts metadata without schema validation errors.

## Deviations from Assessment

None. All remediation items and tests adhered strictly to the contract specified in `assessment.md`.

## Follow-ups

- Update `GEMINI.md` conventions log with the progressive batch persistence pattern and resilient on-demand audit convention during subsequent specification or maintenance phases.
