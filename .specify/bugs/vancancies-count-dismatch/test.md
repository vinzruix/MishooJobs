# Bug Verification: Vacancy Count Discrepancy Across Portal Status Badges and Deduplication Summary

- **Slug**: vancancies-count-dismatch
- **Tested**: 2026-11-08T19:03:00Z
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The bug is fully resolved. All live SSE streaming portal counts, deduplication metrics, and feed category counters now exhibit 100% mathematical consistency without dropped vacancies or phantom discrepancies. Distinct anonymous employer listings ("Empresa Confidencial") are safely disambiguated and preserved.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | `.venv/bin/python scratch/test_consistency.py` | pass | Executed live stream runs on `Python Junior` and `software engineer`; confirmed $\sum \text{portal\_status.count} == \text{summary.total\_extracted}$ and $\text{total\_extracted} - \text{duplicates\_merged} == \text{unique\_vacancies}$. |
| New / updated tests | `.venv/bin/pytest backend/tests/unit/test_deduplicator.py backend/tests/integration/test_sse_stream.py` | pass | 6/6 tests passed including generic employer disambiguation and stream invariant checks. |
| Regression suite (backend) | `.venv/bin/pytest backend/tests/ -v` | pass | 38/38 tests passed in 6.82s across all scrapers, scorers, verifiers, and APIs. |
| Regression suite (frontend) | `npm test -- --run` | pass | 8 test files, 61/61 tests passed in 1.31s. |
| Lint / type-check | `npm run build` (`tsc && vite build`) | pass | Clean TypeScript compilation and Vite production build in 1.45s. |

## Output Excerpts

### Post-Fix Live SSE Stream Check (`software engineer`)
```text
Portal occ: count=14
Portal indeed: count=15
Portal computrabajo: count=15
Summary: total_extracted=44, unique=43, duplicates_merged=1
--- Consistency Check ---
Sum of portal counts: 44
Total extracted in summary: 44
Matches? True
Invariant (44 - 1 == 43)? True
```

### Backend Dedicated Test Suite
```text
backend/tests/unit/test_deduplicator.py::test_generic_company_fingerprint_disambiguation PASSED [ 50%]
backend/tests/unit/test_deduplicator.py::test_confidential_vacancies_not_falsely_merged PASSED [ 66%]
backend/tests/integration/test_sse_stream.py::test_sse_endpoint_stream PASSED [ 83%]
backend/tests/integration/test_sse_stream.py::test_sse_stream_count_mathematical_consistency PASSED [100%]
============================== 6 passed in 4.56s ===============================
```

### Full Frontend Vitest Suite
```text
Test Files  8 passed (8)
     Tests  61 passed (61)
  Duration  1.31s
```

## Residual Risks

- None. The disambiguation logic applies strictly when company names match generic recruiter placeholders ("Empresa Confidencial", "Importante Empresa", etc.), leaving cross-portal deduplication for branded employers completely intact.

## Recommendation

Close the bug — verified end-to-end. Mathematical invariants hold across real-time SSE discovery, deduplication summaries, and client-side UI filters.
