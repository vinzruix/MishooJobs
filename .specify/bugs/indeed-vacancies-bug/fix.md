# Bug Fix: Indeed Cloudflare WAF Bypass via Target Rotation

- **Slug**: indeed-vacancies-bug
- **Fixed**: 2026-11-16T15:55:00-06:00
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Replaced the generic `impersonate="chrome"` alias (which resolves to Chrome 152 in `curl_cffi` 0.17.0 and is blocked with HTTP 403 by Cloudflare WAF on `mx.indeed.com`) with a resilient multi-target fallback list (`["chrome136", "chrome146", "safari184"]`) in `IndeedScraper.search()` and `fetch_full_description()`, restoring live Indeed job discovery and RPC description enrichment.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `backend/src/mishoojobs/services/scrapers/indeed.py` | modified | Added `impersonate_targets = ["chrome136", "chrome146", "safari184"]`, updated `search()` to rotate across targets on non-200 responses, and updated `fetch_full_description()` to use the target list. |
| `backend/tests/unit/test_scrapers.py` | modified | Updated `test_indeed_search_mocked_curl_cffi`, `test_indeed_fetch_full_description_mocked`, and `test_indeed_search_retry_on_initial_failure` to assert specific targets, and added `test_indeed_search_fallback_on_403_target`. |
| `GEMINI.md` | modified | Documented multi-target fallback convention for `IndeedScraper` in the Architectural Decisions & Conventions Log. |

## Diff Highlights

```python
# backend/src/mishoojobs/services/scrapers/indeed.py
class IndeedScraper(AbstractBaseScraper):
    portal_name: str = "indeed"
    base_url: str = "https://mx.indeed.com"
+   impersonate_targets: List[str] = ["chrome136", "chrome146", "safari184"]
...
-   for attempt in range(2):
+   for idx, target in enumerate(self.impersonate_targets):
        try:
            from curl_cffi.requests import AsyncSession
-           async with AsyncSession(impersonate="chrome") as s:
+           async with AsyncSession(impersonate=target) as s:
                r = await s.get(url, params=params, timeout=10)
                if r.status_code == 200:
                    vacancies = self.parse_html(r.text)
                    ...
```

## Tests Added or Updated

- `backend/tests/unit/test_scrapers.py::test_indeed_search_mocked_curl_cffi` — Validates that `IndeedScraper.search()` calls `AsyncSession` with the primary `impersonate="chrome136"` target, parses vacancies, and enriches descriptions offline.
- `backend/tests/unit/test_scrapers.py::test_indeed_fetch_full_description_mocked` — Validates that `fetch_full_description()` uses `"chrome136"` for on-demand description queries.
- `backend/tests/unit/test_scrapers.py::test_indeed_search_retry_on_initial_failure` — Validates sequential fallback from `"chrome136"` to `"chrome146"` when a connection exception occurs.
- `backend/tests/unit/test_scrapers.py::test_indeed_search_fallback_on_403_target` — Validates automated failover to `"chrome146"` when target 1 returns HTTP 403.

## Local Verification

- Commands run:
  - `.venv/bin/pytest backend/tests/ -v` → 57 passed, 1 warning in 9.16s (100% offline).
  - `npm --prefix frontend test -- --run` → 25 test files passed (172 tests passed) in 4.43s.
- Manual checks:
  - Ran live `IndeedScraper().search('python')` probe: returned 15 live vacancies with rich descriptions (1662 chars) and valid Mexican salary/location metadata.
  - Ran live `IndeedScraper().fetch_full_description(viewjob_url)`: successfully returned 1470 chars of plain-text description.

## Deviations from Assessment

None. The implementation followed the preferred remediation outlined in the assessment.

## Follow-ups

- Continue monitoring Indeed México WAF behaviors in production to ensure the multi-target list maintains 100% liveness.
