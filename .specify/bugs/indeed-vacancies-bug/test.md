# Bug Verification: Indeed Cloudflare WAF Bypass via Target Rotation

- **Slug**: indeed-vacancies-bug
- **Tested**: 2026-11-16T15:56:00-06:00
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The bug is fully resolved. Indeed México scraper no longer receives Cloudflare HTTP 403 blocks and successfully fetches and enriches live vacancies via modern TLS/JA4 signatures (`chrome136`, `chrome146`, `safari184`) with automatic failover. All offline unit tests and full backend and frontend regression suites pass with zero regressions.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | `.venv/bin/python -c "IndeedScraper().search('python')"` across queries `python`, `react`, `desarrollador` | pass | 100% of tested queries returned 5/5 requested vacancies with full descriptions (up to 2920 chars) and active links. |
| New / updated tests | `.venv/bin/pytest backend/tests/unit/test_scrapers.py -k indeed -v` | pass | 6 passed (including mock curl_cffi assertions, cold-start retry, and 403 target fallback test). |
| Regression suite (backend) | `.venv/bin/pytest backend/tests/ -v` | pass | 57 passed, 1 warning (100% offline). |
| Regression suite (frontend) | `npm --prefix frontend test -- --run` | pass | 25 test files passed (172 tests passed). |

## Output Excerpts

### Post-Fix Live Reproduction
```text
Query "python": 5 vacancies found.
  - Desarrollador de Software Jr | ACI Administracion Corporativa Integral | SeniorityLevelEnum.JUNIOR | 1470 chars | https://mx.indeed.com/viewjob?jk=acd908be916fa648
  - Desarrollador Backend Python | Lanthings Tecnologías S. de R.L. | SeniorityLevelEnum.MID | 2386 chars | https://mx.indeed.com/viewjob?jk=38f1e81351333705
Query "react": 5 vacancies found.
  - Diseñador UX/UI con Bases de Frontend. | Lumina Software | SeniorityLevelEnum.MID | 985 chars | https://mx.indeed.com/viewjob?jk=7dc9154662f7265b
  - React/JavaScript Developer – AI & Automation | CobaltoTalent | SeniorityLevelEnum.JUNIOR | 2920 chars | https://mx.indeed.com/viewjob?jk=114cc6baa70ebdc8
Query "desarrollador": 5 vacancies found.
  - Desarrollador de Software Jr | ACI Administracion Corporativa Integral | SeniorityLevelEnum.JUNIOR | 1515 chars | https://mx.indeed.com/viewjob?jk=a916ac6dccee7179
  - Desarrollador .NET | Celeste Aguirre | SeniorityLevelEnum.SENIOR | 1794 chars | https://mx.indeed.com/viewjob?jk=9a4392d6ae9642d7
```

### Indeed Unit Tests
```text
backend/tests/unit/test_scrapers.py::test_indeed_parser PASSED           [ 16%]
backend/tests/unit/test_scrapers.py::test_indeed_parser_mosaic_json PASSED [ 33%]
backend/tests/unit/test_scrapers.py::test_indeed_search_mocked_curl_cffi PASSED [ 50%]
backend/tests/unit/test_scrapers.py::test_indeed_fetch_full_description_mocked PASSED [ 66%]
backend/tests/unit/test_scrapers.py::test_indeed_search_retry_on_initial_failure PASSED [ 83%]
backend/tests/unit/test_scrapers.py::test_indeed_search_fallback_on_403_target PASSED [100%]
======================= 6 passed, 7 deselected in 0.30s ========================
```

### Full Backend Suite
```text
======================== 57 passed, 1 warning in 8.48s =========================
```

### Full Frontend Suite
```text
Test Files  25 passed (25)
Tests  172 passed (172)
Duration  4.72s
```

## Residual Risks

- Cloudflare continuously updates bot-detection heuristics and JA4 signatures. Rotating across multiple distinct targets (`chrome136`, `chrome146`, `safari184`) provides resilience, but if Cloudflare establishes a site-wide block on all static TLS fingerprints, a future update to `curl_cffi` may be necessary.

## Recommendation

Close the bug — verified end-to-end. Both live reproduction probes and offline regression test suites confirm that Indeed vacancy discovery and description enrichment are fully operational.
