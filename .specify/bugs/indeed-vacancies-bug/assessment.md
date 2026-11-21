# Bug Assessment: Indeed Scraping Blocked by Cloudflare WAF on Chrome 152 Fingerprint

- **Slug**: indeed-vacancies-bug
- **Created**: 2026-11-16T15:52:00-06:00
- **Source**: pasted text
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

> "It seems that the indeed is not providing us vancancies again slug=indeed-vacancies-bug"

## Symptom

When performing a job vacancy search (e.g. `python`, `desarrollador`) via `IndeedScraper.search()` or the live SSE endpoint (`/api/v1/vacancies/search/stream`), Indeed México returns 0 vacancies and reports `completed` with 0 results. Live search probes confirm that `IndeedScraper.search('python')` yields 0 vacancies while OCC and Computrabajo successfully return 15+ vacancies each.

## Reproduction

1. In the backend virtual environment, run:
   ```bash
   .venv/bin/python -c "
   import asyncio
   from mishoojobs.services.scrapers.indeed import IndeedScraper

   async def test():
       scraper = IndeedScraper()
       vacs = await scraper.search('python')
       print('Found vacancies:', len(vacs))

   asyncio.run(test())
   "
   ```
2. Observe output: `Found vacancies: 0`.
3. Inspect raw HTTP response from `https://mx.indeed.com/jobs?q=python&l=M%C3%A9xico` using `curl_cffi.requests.AsyncSession(impersonate="chrome")`:
   - Status code: `HTTP 403`
   - Response header: `cf-mitigated: challenge`
   - Page title: `Security Check - Indeed.com`
   - H1: `Additional Verification Required` ("Please enable JavaScript to complete the security check.")
   - Cookie: `__cf_bm`

## Suspected Code Paths

- `backend/src/mishoojobs/services/scrapers/indeed.py:284` — `IndeedScraper.search()` initializes `AsyncSession(impersonate="chrome")`. In `curl_cffi` 0.17.0, the generic alias `"chrome"` maps to `REAL_TARGET_MAP["chrome"] = "chrome152"`. Cloudflare WAF on `mx.indeed.com` actively challenges Chrome 152 JA4/TLS signatures with HTTP 403.
- `backend/src/mishoojobs/services/scrapers/indeed.py:239, 252` — `IndeedScraper.fetch_full_description()` also initializes `AsyncSession(impersonate="chrome")` for `/rpc/jobdescs?jks={jk}` and `/rc/clk?jk={jk}`, exposing on-demand description fetches to the same Cloudflare 403 block.
- `backend/src/mishoojobs/services/scrapers/indeed.py:281-331` — In `search()`, the retry loop catches errors or non-200 responses and re-attempts with the identical `impersonate="chrome"` target, resulting in 2 consecutive 403 failures without trying an alternative target.
- `backend/src/mishoojobs/services/scrapers/indeed.py:332-338` — The fallback `self.fetch_html()` uses standard `httpx.AsyncClient` without TLS impersonation, which is also blocked by Cloudflare with HTTP 403, silently returning `[]`.
- `backend/tests/unit/test_scrapers.py:154, 172` — Unit tests explicitly assert `mock_session_cls.assert_called_with(impersonate="chrome")`, coupling tests to the generic alias.

## Root Cause Hypothesis

`IndeedScraper` uses `curl_cffi.requests.AsyncSession(impersonate="chrome")`. Under `curl_cffi` version 0.17.0, `REAL_TARGET_MAP["chrome"]` automatically resolves to `DEFAULT_CHROME = "chrome152"`. 

Cloudflare Bot Management on `mx.indeed.com` monitors TLS fingerprints and currently challenges `chrome152` (and `chrome131`) requests with HTTP 403 (`Security Check - Indeed.com / Additional Verification Required`). 

Direct empirical verification across all `curl_cffi` browser targets confirms:
- **Blocked (HTTP 403)**: `chrome152`, `chrome152_macos`, `chrome142`, `chrome131`.
- **Allowed (HTTP 200 with full mosaic-data and /rpc/jobdescs access)**: `chrome136`, `chrome145`, `chrome146`, `chrome150`, `chrome151`, `safari180`, `safari184`.

When `IndeedScraper` requests `/jobs` with `impersonate="chrome"`, it receives HTTP 403. Both retry attempts fail, and the `httpx` fallback also receives 403, causing `IndeedScraper.search()` to return 0 vacancies.

*Confidence*: High (100% verified via direct diagnostic probes: `chrome` yields HTTP 403 and 0 vacancies; monkey-patching `impersonate="chrome136"` immediately yields 15-27 valid vacancies with full description enrichment).

## Proposed Remediation

**Preferred**:
1. Update `backend/src/mishoojobs/services/scrapers/indeed.py`:
   - Replace the generic `impersonate="chrome"` with a proven stable target (e.g., `DEFAULT_IMPERSONATE = "chrome136"`).
   - Implement target rotation or multi-target fallback across retry attempts (e.g., `["chrome136", "chrome146", "safari184"]`) in `IndeedScraper.search()` so that if Cloudflare ever flags a specific version fingerprint in the future, the secondary attempt automatically recovers using a different browser fingerprint.
   - Update `fetch_full_description()` to use the proven impersonation target (`chrome136`).
2. Update `backend/tests/unit/test_scrapers.py`:
   - Update `test_indeed_search_mocked_curl_cffi` and `test_indeed_fetch_full_description_mocked` to assert the updated impersonation target (`chrome136`).
   - Add a unit test verifying multi-target fallback behavior when the first impersonation target returns HTTP 403.
3. Update `GEMINI.md` conventions log with the new architectural decision.

**Alternatives**:
- *Keep `impersonate="chrome"` and override headers*: Ineffective because Cloudflare inspects TLS ClientHello / JA4 fingerprint at the transport layer, not just HTTP headers.
- *Headless Browser (Playwright/Puppeteer)*: High resource overhead, violates lightweight scraping principles.

**Files likely to change**:
- `backend/src/mishoojobs/services/scrapers/indeed.py`
- `backend/tests/unit/test_scrapers.py`
- `GEMINI.md`

**Tests to add or update**:
- `backend/tests/unit/test_scrapers.py::test_indeed_search_mocked_curl_cffi` (update expected `impersonate` parameter).
- `backend/tests/unit/test_scrapers.py::test_indeed_fetch_full_description_mocked` (update expected `impersonate` parameter).
- Add `test_indeed_search_fallback_on_403_target` to test resilient retry with alternative impersonation targets.

## Risks & Considerations

- **Cloudflare Heuristic Changes**: Cloudflare dynamically tunes WAF rules. Having a multi-target fallback list (`chrome136`, `chrome146`, `safari184`) significantly increases resilience against future single-target blocks.
- **Offline Test Mandate**: All unit tests must continue to run 100% offline using `unittest.mock.patch` with zero live network calls.

## Open Questions

- None. Root cause definitively reproduced and verified against `mx.indeed.com`.
