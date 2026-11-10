# Bug Assessment: Vacancy Seniority Audit 404 & Cold-Start Search Delivery

- **Slug**: vacancy-fingerprint-not-found
- **Created**: 2026-11-09T21:43:00-06:00
- **Source**: pasted text
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

> "When i click in some vacancies it says Vacante con fingerprint '443cd07857baf7719fa463173d65a4991b0c490367f01a7206bcd2f4423629df' no encontrada. And it s very common, and always like the first search indeed does not provide any vancancy."

## Symptom

1. When clicking on freshly discovered job vacancy cards to inspect them in the detail modal (`VacancyDetailModal`), a red error banner appears displaying:
   `Vacante con fingerprint '<fingerprint>' no encontrada.`
   The on-demand Tier-2 seniority audit fails with HTTP 404, leaving the vacancy with preliminary or unverified status.
2. On initial search or following backend cold start, Indeed México (`IndeedScraper`) intermittently returns 0 vacancies (`Indeed: 0 vacantes verificadas`), whereas subsequent searches succeed and return 15+ listings.

## Reproduction

1. Launch the FastAPI backend (`uvicorn mishoojobs.api.main:app --port 8000`) and Vite frontend (`npm run dev`).
2. Search for tech vacancies (e.g. `python`, `frontend`, `junior`).
3. Observe that Indeed México status may report `0 vacantes verificadas` on the very first search request.
4. While the search stream is still active (e.g. Computrabajo or OCC finishes first while Indeed or deduplication is still running), immediately click on any newly rendered vacancy card.
5. In `VacancyDetailModal`, observe the error banner:
   `Vacante con fingerprint '443cd07857baf7719fa463173d65a4991b0c490367f01a7206bcd2f4423629df' no encontrada.`
6. Inspect the network trace for `POST /api/v1/vacancies/<fingerprint>/audit`: it returns HTTP 404 Not Found.

## Suspected Code Paths

- `backend/src/mishoojobs/api/routes/vacancies.py:207-227` (`audit_vacancy_seniority`):
  Queries PostgreSQL for `JobVacancy` matching the URL fingerprint. If `db_vac` is `None`, it unconditionally raises `HTTPException(status_code=404, detail=f"Vacante con fingerprint '{fingerprint}' no encontrada.")`. Unlike `evaluate_vacancy_fit`, it does not fallback to the `request.job_description` or `request.direct_url` provided by the client.
- `backend/src/mishoojobs/api/sse.py:230-252` (`job_search_stream_generator`):
  Emits `vacancy_batch` SSE events as soon as individual scrapers complete, but defers calling `persist_vacancies_safe` until Step 4 (after all portal tasks finish and deduplication is complete). Any card clicked before the entire stream completes hits a database where the record does not yet exist. Additionally, `persist_vacancies_safe` runs as an untracked background task with `except Exception: pass`, which silently swallows persistence failures.
- `backend/src/mishoojobs/services/scrapers/indeed.py:279-325` (`IndeedScraper.search`):
  Uses an ephemeral `AsyncSession(impersonate="chrome")` without cookie caching or retry. When Indeed issues a cold-start challenge or slow response on the first query, `IndeedScraper` catches the exception and falls back to `self.fetch_html()`, which is blocked by Cloudflare, resulting in 0 vacancies delivered.
- `frontend/src/components/VacancyDetailModal.tsx:44-65`:
  Dispatches `auditVacancy` whenever `vacancy.audit_status === "preliminary"`. When the API responds with HTTP 404, it renders the raw technical backend error string in the UI without a retry mechanism or fallback.

## Root Cause Hypothesis

The primary issue is an architectural race condition combined with rigid database coupling. In `job_search_stream_generator`, progressive SSE batches stream directly to the client before PostgreSQL persistence runs. `persist_vacancies_safe` is only executed after all portal scrapers and cross-portal deduplication finish. When a candidate clicks a vacancy card while the stream is still in-flight (or if the client disconnects/reloads before completion), `JobVacancy` has not yet been committed to PostgreSQL. The endpoint `POST /api/v1/vacancies/{fingerprint}/audit` strictly requires the record to exist in PostgreSQL and throws a hard 404, ignoring the client-supplied `job_description` and `direct_url`.

The secondary issue with Indeed is caused by ephemeral `curl_cffi` sessions without transient error retry or cookie warm-up. On cold starts or initial handshakes, any transient non-200 or timeout causes `IndeedScraper.search()` to silently swallow the exception and return `[]`.

*Confidence*: High. Confirmed by verifying the asynchronous stream timeline, database state queries, and API route implementations.

## Proposed Remediation

**Preferred**:
1. **Resilient On-Demand Vacancy Auditing**:
   - In `backend/src/mishoojobs/api/routes/vacancies.py` (`audit_vacancy_seniority`):
     If `db_vac` is `None` in PostgreSQL, do not throw 404. Instead, fallback gracefully to `request.job_description` and `request.direct_url`.
     If description enrichment is required, fetch from `candidate_urls`.
     Execute the seniority audit via `AgyAIClient` (or fast-pass heuristic classification if `agy` is unavailable).
     Persist or upsert the audited vacancy into `JobVacancy` so subsequent requests and evaluations find the cached record.
2. **Progressive Batch Persistence**:
   - In `backend/src/mishoojobs/api/sse.py`:
     Persist batches progressively as each portal delivers verified vacancies (`asyncio.create_task(persist_vacancies_safe(deduped_portal_vacs))`) rather than waiting for the entire multi-portal search stream to terminate.
   - Replace silent `except Exception: pass` with explicit error logging in `persist_vacancies_safe`.
3. **Indeed Scraper Cold-Start Retry**:
   - In `backend/src/mishoojobs/services/scrapers/indeed.py`:
     Add an immediate one-time retry with a brief backoff (e.g. 500ms) within `IndeedScraper.search()` if the initial request fails or returns 0 vacancies before returning an empty list.
4. **Client Error Handling & User Experience**:
   - In `frontend/src/components/VacancyDetailModal.tsx`:
     Display user-friendly messaging for audit failures with a retry button instead of exposing raw fingerprint 404 error strings.

**Alternatives**:
- *Synchronous DB write before streaming*: Block SSE batch yielding until DB commit completes. *Trade-off*: Adds noticeable latency (100–300ms) to initial card rendering in the browser. Progressive asynchronous persistence plus graceful fallback in `/audit` is significantly faster and more resilient.

**Files likely to change**:
- `backend/src/mishoojobs/api/routes/vacancies.py`
- `backend/src/mishoojobs/api/sse.py`
- `backend/src/mishoojobs/services/scrapers/indeed.py`
- `backend/src/mishoojobs/schemas/evaluation.py`
- `frontend/src/components/VacancyDetailModal.tsx`
- `backend/tests/unit/test_evaluation_router.py`
- `backend/tests/unit/test_scrapers.py`

**Tests to add or update**:
- Unit test in `backend/tests/unit/test_evaluation_router.py` ensuring `POST /api/v1/vacancies/{fingerprint}/audit` succeeds and returns a valid `SeniorityAuditResponse` even when the vacancy is not yet present in PostgreSQL.
- Unit test in `backend/tests/unit/test_scrapers.py` verifying `IndeedScraper.search()` retries on transient initial failure.
- Ensure all offline backend tests (`pytest backend/tests/`) pass without live network dependencies.

## Risks & Considerations

- **Privacy Invariant**: Ensure on-demand persistence only stores vacancy metadata and audit details, strictly preserving the zero-candidate-PII invariant.
- **Offline Test Mandate**: All test mocks must simulate database states and scraper responses deterministically without internet access.

## Open Questions

- None. Root causes and remediation architecture are completely mapped.
