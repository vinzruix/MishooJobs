# Bug Verification: OCC Mundial Vacancy Direct Links Redirecting to 404 Page

- **Slug**: occ-vacancy-404
- **Tested**: 2026-11-10T21:53:24-06:00
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The OCC Mundial 404 bug no longer reproduces across live searches (`desarrollador`, `java`, `soporte tecnico`): all 24 returned vacancies resolved to canonical `?jobid=<id>` URLs returning `HTTP 200` with `selectedJobId` rendered and full descriptions enriched from `oferta.occ.com.mx`. All targeted unit tests and the 49-test offline backend regression suite pass with zero new lint errors.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | Live Python check: `OCCScraper().search(q, limit=8)` + `URLVerifier().verify_vacancies(vacs)` + `curl_cffi` `AsyncSession(impersonate="chrome")` GET for `"desarrollador"`, `"java"`, `"soporte tecnico"`; plus `fetch_full_description` and `verify_single_url("https://www.occ.com.mx/empleos/?jobid=999999999")` | pass | `24/24` (`8/8` per query) returned `https://www.occ.com.mx/empleos/?jobid=<id>` with `HTTP 200`, `err404=False`, `selectedJobId=True`, and descriptions (`604`–`5693` chars). `fetch_full_description` returned `2780` chars; expired `999999999` returned `is_active=False, status_code=404`. All 5 `'Empresa confidencial'` rows in `'soporte tecnico'` got distinct fingerprints. |
| New / updated tests | `.venv/bin/pytest backend/tests/unit/test_scrapers.py -k "occ" -v` / `test_verifier.py -k "occ" -v` / `test_deduplicator.py -k "occ" -v` | pass | `4 passed, 8 deselected in 0.35s`; `2 passed, 4 deselected in 0.21s`; `1 passed, 4 deselected in 0.10s`. |
| Regression suite (offline backend) | `.venv/bin/pytest backend/tests/unit/ backend/tests/test_cv_service.py -v` | pass | `49 passed, 1 warning in 0.87s` (`StarletteDeprecationWarning` from FastAPI `testclient.py`). |
| Integration / frontend suites | `backend/tests/integration/` (`test_sse_stream.py`, `test_full_workflow.py`) and frontend Vitest suite | skipped | Integration tests require live PostgreSQL and hit `/api/v1/jobs/stream`; fix touched backend files only (existing unrelated frontend edits left untouched). |
| Lint / type-check | `.venv/bin/ruff check --select F,B,SIM <7 changed backend files>` (and full `ruff check`) | fail (pre-existing only) | `Found 5 errors.` with `--select F,B,SIM` (`deduplicator.py:4 F401`, `occ.py:57 SIM108`, `occ.py:128 SIM102`, `verifier.py:7 F401`, `test_scrapers.py:4 F401`); 0 errors in added/modified lines (`74` total pre-existing errors with `UP035`/`UP017`/`I001`). |

## Output Excerpts

```text
TIMESTAMP: 2026-11-10T21:53:24-06:00
QUERY='desarrollador' scraped=8 verified=8 unique_fps=8
  [1] id=21390143 http=200 err404=False selectedJobId=True oid_in_html=True desc_len=2780 fp=a635f30769 url=https://www.occ.com.mx/empleos/?jobid=21390143
  ... (all 8/8 http=200 err404=False selectedJobId=True)
QUERY='java' scraped=8 verified=8 unique_fps=8
  ... (all 8/8 http=200 err404=False selectedJobId=True, desc_len 604..3339)
QUERY='soporte tecnico' scraped=8 verified=8 unique_fps=7
  ... (all 8/8 http=200 err404=False selectedJobId=True, 5 confidential listings have distinct fps)
FETCH_FULL_DESCRIPTION url=https://www.occ.com.mx/empleos/?jobid=21390143 len=2780
EXPIRED_CHECK url=https://www.occ.com.mx/empleos/?jobid=999999999 is_active=False status_code=404

.venv/bin/pytest backend/tests/unit/ backend/tests/test_cv_service.py -v
49 passed, 1 warning in 0.87s
```

## Residual Risks

- Existing rows persisted in PostgreSQL (`external_links`) or browser `IndexedDB` prior to this fix may still contain legacy `/empleo/oferta/<id>` links until purged or re-scraped.
- Both live verification and description enrichment rely on OCC's internal `https://oferta.occ.com.mx/offer/{id}/d/j?ipo=41&iapo=1` JSON endpoint, which could change upstream.
- Preserving `?jobid=` in `clean_disambiguator_url()` changes generated fingerprints for newly scraped confidential-company OCC listings relative to pre-fix database records.
- Full-stack SSE + PostgreSQL integration (`backend/tests/integration/`) and manual clickthrough in the running web UI were not executed in this verification run.

## Recommendation

The fix is verified and ready to merge. As optional follow-up hygiene outside this bugfix, clean expired pre-fix `/empleo/oferta/` entries from PostgreSQL on next maintenance window or verify one live SSE stream request through the UI to confirm end-to-end rendering.
