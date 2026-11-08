# Bug Verification: Indeed Scraping Blocked by Cloudflare WAF

- **Slug**: indeed-block
- **Tested**: 2026-11-08T12:27:30-06:00
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The bug is fully resolved. Indeed México scraper now bypasses Cloudflare WAF successfully using `impersonate="chrome"`, yielding 15+ live vacancies with full description enrichment per search. All offline unit tests and full backend/frontend regression test suites pass with zero failures.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | `IndeedScraper().search('python')` live diagnostic | pass | Returns 15 vacancies (previously 0) with full descriptions (~1,662 chars). |
| New / updated tests | `.venv/bin/pytest backend/tests/unit/test_scrapers.py -k indeed -v` | pass | 4 passed in 0.23s, confirming mocked Chrome impersonation and RPC description enrichment. |
| Regression suite (backend) | `.venv/bin/pytest backend/tests/ -v` | pass | 35 passed in 5.17s (100% offline). |
| Regression suite (frontend) | `cd frontend && npm test -- --run` | pass | 60 passed in 1.29s across 8 test suites. |

## Output Excerpts

### Reproduction Post-Fix Output
```text
Found vacancies: 15
Sample title: Desarrollador Python
Sample company: EBUNTI by DRP México
Sample desc length: 1662
```

### Pytest Unit & Regression Suite
```text
backend/tests/unit/test_scrapers.py::test_indeed_parser PASSED           [ 25%]
backend/tests/unit/test_scrapers.py::test_indeed_parser_mosaic_json PASSED [ 50%]
backend/tests/unit/test_scrapers.py::test_indeed_search_mocked_curl_cffi PASSED [ 75%]
backend/tests/unit/test_scrapers.py::test_indeed_fetch_full_description_mocked PASSED [100%]
============================== 35 passed in 5.17s ==============================
```

### Vitest Frontend Suite
```text
 Test Files  8 passed (8)
      Tests  60 passed (60)
   Duration  1.29s
```

## Residual Risks

- Cloudflare dynamically changes TLS fingerprint and Turnstile rules periodically. While `impersonate="chrome"` is currently accepted by `mx.indeed.com`, future bot-management changes on Indeed may require keeping `curl_cffi` updated.

## Recommendation

Close the bug — verified end-to-end. The scraper is fully operational, retrieves live vacancies, enriches job descriptions, and maintains 100% offline test compliance.
