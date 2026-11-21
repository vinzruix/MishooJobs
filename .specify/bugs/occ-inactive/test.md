# Bug Verification: OCC Scraper Active Streaming and Cloudflare Bypass

- **Slug**: occ-inactive
- **Tested**: 2026-11-19T23:32:00-06:00
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The bug is fully resolved. Live search queries ("python", "desarrollador") against OCC Mundial now bypass Cloudflare WAF bot protection via `curl_cffi` browser impersonation (`chrome136`), streaming verified vacancy batches and reporting `portal_status: completed` in under 1.5 seconds with zero "Inactivo" status or unhandled exceptions. All 64 backend pytest tests and 174 frontend Vitest tests pass cleanly.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | `job_search_stream_generator(SearchParams(query='python', limit_per_portal=3))` and `query='desarrollador'` | pass | OCC reported `portal_status: completed`, delivered 3 verified vacancies per query in ~1.3s, zero "Inactivo" errors. |
| New / updated tests | `.venv/bin/pytest backend/tests/unit/test_scrapers.py -k "occ" -v` | pass | 7 passed in 1.17s (including mock `curl_cffi`, fallback rotation on 403, and graceful error handling). |
| Regression suite (backend) | `.venv/bin/pytest backend/tests/ -v` | pass | 64 passed, 1 warning (deprecation) in 9.96s (100% offline). |
| Regression suite (frontend) | `cd frontend && npm test -- --run` | pass | 25 test files passed, 174 tests passed in 5.43s. |

## Output Excerpts

### Live Post-Fix SSE Stream Verification
```json
event: portal_status
data: {"portal": "occ", "status": "searching", "count": 0, "message": "Occ: Consultando en tiempo real...", "duration_ms": 0}
event: portal_status
data: {"portal": "occ", "status": "completed", "count": 3, "message": "Occ: 3 vacantes verificadas", "duration_ms": 1459}
Received OCC vacancy batch!
```

### Pytest Backend Test Run
```text
backend/tests/unit/test_scrapers.py::test_occ_parser PASSED
backend/tests/unit/test_scrapers.py::test_occ_parser_split_grid_without_anchor_uses_jobid PASSED
backend/tests/unit/test_scrapers.py::test_occ_search_mocked_curl_cffi PASSED
backend/tests/unit/test_scrapers.py::test_occ_search_fallback_on_403_target PASSED
backend/tests/unit/test_scrapers.py::test_occ_search_graceful_error_returns_empty PASSED
backend/tests/unit/test_scrapers.py::test_occ_search_enriches_from_offer_json_endpoint PASSED
backend/tests/unit/test_scrapers.py::test_occ_fetch_full_description_from_jobid_and_legacy_url PASSED
======================== 64 passed, 1 warning in 9.96s =========================
```

### Vitest Frontend Test Run
```text
Test Files  25 passed (25)
     Tests  174 passed (174)
  Duration  5.43s
```

## Residual Risks

- If Cloudflare rolls out new TLS/JA4 signature heuristics in the future, target strings in `OCCScraper.impersonate_targets` may require periodic maintenance (similar to `IndeedScraper`). The current fallback rotation (`chrome136` -> `chrome146` -> `safari184` -> standard `httpx`) provides resilience against single-target blocking.

## Recommendation

Close the bug — verified end-to-end. OCC vacancy discovery is operational, streaming live verified listings with green status badges across all search keywords.
