# Bug Fix: OCC Scraper Cloudflare Bypass and Resilient Exception Handling

- **Slug**: occ-inactive
- **Fixed**: 2026-11-19T19:06:00-06:00
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Equipped `OCCScraper` with browser TLS/JA4 impersonation using `curl_cffi.requests.AsyncSession` across a resilient target rotation list (`chrome136`, `chrome146`, `safari184`) to bypass Cloudflare WAF bot challenges on search endpoints, hardened exception handling against `RetryError`, added traceback logging in `sse.py`, and added PostgreSQL enum type casting on conflict updates.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `backend/src/mishoojobs/services/scrapers/occ.py` | modified | Added `impersonate_targets`, updated `search()` to use `curl_cffi` before fallback, wrapped fetch/parse exceptions to return `[]` gracefully, and updated `_fetch_offer_html_description()` to rotate over `impersonate_targets`. |
| `backend/src/mishoojobs/api/sse.py` | modified | Added `logger.warning` with `exc_info=True` in `run_portal()` and cast `seniority_level` and `audit_status` to their column Enum types in PostgreSQL `case()` statements. |
| `backend/tests/unit/test_scrapers.py` | modified | Added offline unit tests for `OCCScraper.search()` with mocked `curl_cffi`, target rotation on 403, graceful error handling on failure, and mocked session for JSON enrichment test. |
| `GEMINI.md` | modified | Recorded architectural decision log for `[occ-inactive]`. |

## Diff Highlights

```python
# backend/src/mishoojobs/services/scrapers/occ.py
class OCCScraper(AbstractBaseScraper):
    portal_name: str = "occ"
    base_url: str = "https://www.occ.com.mx"
    impersonate_targets: List[str] = ["chrome136", "chrome146", "safari184"]

    async def search(self, query: str, ...):
        # 1. Attempt with curl_cffi browser TLS/JA4 impersonation to bypass Cloudflare bot challenge
        for target in self.impersonate_targets:
            try:
                from curl_cffi.requests import AsyncSession
                async with AsyncSession(impersonate=target) as s:
                    r = await s.get(url, timeout=10)
                    if r.status_code == 200:
                        html = r.text
                        break
                    elif r.status_code in (401, 403, 429):
                        continue
            except Exception:
                continue

        # 2. Fallback to standard fetch_html if curl_cffi did not succeed
        if not html:
            try:
                html = await self.fetch_html(url)
            except Exception as exc:
                logger.warning("OCC search fetch failed for %s: %s", url, exc)
                return []
```

## Tests Added or Updated

- `backend/tests/unit/test_scrapers.py::test_occ_search_mocked_curl_cffi` — verifies `OCCScraper.search()` uses `curl_cffi` with `chrome136` and correctly parses vacancy cards offline.
- `backend/tests/unit/test_scrapers.py::test_occ_search_fallback_on_403_target` — verifies `OCCScraper.search()` rotates from `chrome136` to `chrome146` when receiving a 403 response.
- `backend/tests/unit/test_scrapers.py::test_occ_search_graceful_error_returns_empty` — verifies `OCCScraper.search()` returns `[]` without leaking unhandled exceptions when all network attempts fail.
- `backend/tests/unit/test_scrapers.py::test_occ_search_enriches_from_offer_json_endpoint` — updated to mock `curl_cffi` offline session alongside JSON enrichment.

## Local Verification

- Commands run:
  - `.venv/bin/pytest backend/tests/ -v` → 64 passed (100% offline).
  - `cd frontend && npm test -- --run` → 25 test files passed, 174 tests passed.
  - Live SSE smoke test (`job_search_stream_generator(SearchParams(query='python', limit_per_portal=3))`) → OCC emitted `portal_status: completed`, `count: 3`, duration `1.2s`, delivering verified vacancy batches.
- Manual checks:
  - Verified no unhandled exceptions leak to SSE during live queries.
  - Verified PostgreSQL on conflict update succeeds without Enum type mismatch.

## Deviations from Assessment

- Added explicit `cast(..., JobVacancy.seniority_level.type)` and `cast(..., JobVacancy.audit_status.type)` in `backend/src/mishoojobs/api/sse.py` to fix a PostgreSQL dialect `ProgrammingError` ("CASE types character varying and seniority_level_enum cannot be matched") uncovered during live upsert verification.

## Follow-ups

- Continue monitoring Cloudflare bot challenge responses in production; update `impersonate_targets` if newer browser fingerprints are introduced.
