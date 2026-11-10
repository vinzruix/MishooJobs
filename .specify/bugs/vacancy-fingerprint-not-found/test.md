# Bug Verification: Vacancy Seniority Audit 404 & Cold-Start Search Delivery

- **Slug**: vacancy-fingerprint-not-found
- **Tested**: 2026-11-09T21:53:00-06:00
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The fix successfully eliminates the HTTP 404 error when inspecting freshly discovered or unpersisted vacancies, and stabilizes Indeed México search delivery on cold starts. Post-fix reproduction confirmed that `POST /api/v1/vacancies/<fingerprint>/audit` completes with HTTP 200 and on-demand database persistence, and all backend and frontend test suites pass with zero regressions.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | `python test_reproduction()` with exact fingerprint `443cd07857baf7719fa463173d65a4991b0c490367f01a7206bcd2f4423629df` | pass | Returned HTTP 200 with `audit_status: "verified"`, on-demand created `JobVacancy`, and verified subsequent cached retrieval |
| Scraper Execution | `python -c "IndeedScraper().search('python')"` | pass | Delivered 5 verified vacancies with Chrome TLS impersonation and retry resilience |
| New / updated tests | `./.venv/bin/pytest backend/tests/integration/test_seniority_audit_api.py backend/tests/unit/test_scrapers.py -v` | pass | 10 passed in 0.86s |
| Backend regression suite | `./.venv/bin/pytest backend/tests/` | pass | 49 passed in 23.21s (100% offline) |
| Frontend regression suite | `cd frontend && npm test -- --run` | pass | 18 test files passed (114 tests) in 3.82s |
| Frontend Type Check | `cd frontend && npx tsc --noEmit` | pass | TypeScript strict type check passed with 0 errors |

## Output Excerpts

```text
# Reproduction check against exact reported fingerprint:
POST /audit Status: 200
Response payload: {'vacancy_fingerprint': '443cd07857baf7719fa463173d65a4991b0c490367f01a7206bcd2f4423629df', 'seniority_level': 'primer_empleo', 'years_required_min': 0, 'is_real_first_job': True, 'audit_status': 'verified', ...}
Successfully persisted in DB with audit_status: verified
```

```text
# Backend pytest regression:
======================== 49 passed, 1 warning in 23.21s ========================
```

```text
# Frontend Vitest suite:
Test Files  18 passed (18)
     Tests  114 passed (114)
```

```text
# TypeScript strict type check:
cd frontend && npx tsc --noEmit
exit code: 0
```

## Residual Risks

- **Indeed WAF Heuristics**: Cloudflare periodically updates bot challenge fingerprints. The 2-attempt retry loop with Chrome impersonation absorbs transient TLS and session drops, but if Cloudflare deploys intrusive CAPTCHAs, `IndeedScraper` will gracefully fall back to alternative portal results.

## Recommendation

Close the bug — verified end-to-end. Both the vacancy audit 404 race condition and the initial Indeed search delivery drop are resolved, verified by direct reproduction against the reported fingerprint and clean full-stack test passes.
