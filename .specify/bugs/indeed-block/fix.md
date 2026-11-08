# Bug Fix: Indeed Scraping Blocked by Cloudflare WAF

- **Slug**: indeed-block
- **Fixed**: 2026-11-08T12:26:00-06:00
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Replaced `safari17_0` and manual conflicting iPhone headers with clean `impersonate="chrome"` in `IndeedScraper.search()` and `fetch_full_description()`, resolving Cloudflare WAF HTTP 403 blocks and restoring live Indeed job aggregation and description enrichment.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `backend/src/mishoojobs/services/scrapers/indeed.py` | modified | Replaced `impersonate="safari17_0"` with `impersonate="chrome"` and removed manual iPhone User-Agent/Accept header overrides. |
| `backend/tests/unit/test_scrapers.py` | modified | Added offline unit tests `test_indeed_search_mocked_curl_cffi` and `test_indeed_fetch_full_description_mocked`. |
| `GEMINI.md` | modified | Updated conventions log to document `impersonate="chrome"` for Indeed scraping. |

## Diff Highlights (optional)

```python
# In backend/src/mishoojobs/services/scrapers/indeed.py:
# Replaced:
#   async with AsyncSession(impersonate="safari17_0") as s:
#       r = await s.get(url, params=params, headers=headers, timeout=10)
# With:
    async with AsyncSession(impersonate="chrome") as s:
        r = await s.get(url, params=params, timeout=10)
```

## Tests Added or Updated

- `backend/tests/unit/test_scrapers.py::test_indeed_search_mocked_curl_cffi` — Verifies `IndeedScraper.search()` uses `impersonate="chrome"`, parses vacancies from mosaic data, and enriches descriptions via `/rpc/jobdescs` without live network calls.
- `backend/tests/unit/test_scrapers.py::test_indeed_fetch_full_description_mocked` — Verifies `IndeedScraper.fetch_full_description()` fetches job description details via `/rpc/jobdescs` using `impersonate="chrome"` offline.

## Local Verification

- Commands run:
  - `.venv/bin/pytest backend/tests/ -v` → 35 passed in 4.90s (100% offline).
  - `cd frontend && npm test -- --run` → 60 passed in 1.32s.
- Manual checks:
  - Executed live test against `mx.indeed.com` with `python`: successfully fetched 5 vacancies with full enriched descriptions (1,400+ characters each).

## Deviations from Assessment

None. The remediation followed the proposed plan exactly as outlined.

## Follow-ups

- Monitor Cloudflare challenge rules on `mx.indeed.com` to ensure `impersonate="chrome"` continues to negotiate TLS/JA4 signatures cleanly.
