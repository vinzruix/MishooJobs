# Bug Assessment: OCC Scraper Blocked by Cloudflare WAF Causing Persistent "OCC Inactivo" Status

- **Slug**: occ-inactive
- **Created**: 2026-11-19T19:02:00-06:00
- **Source**: pasted text
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

The user reported:
> "Everytime that i search vacancies it says OCC INACTIVE"

## Symptom

When performing any search from the frontend (such as "desarrollador", "programador", "software", "full stack", "backend", "python"), the `PortalStatusBar` displays `OCC Mundial: Inactivo` with an alert icon instead of streaming discovered vacancies and displaying `OCC Mundial: N verificadas` with a green checkmark badge.

## Reproduction

1. Trigger a live search query (e.g. `query="python"` or `query="desarrollador"`) via the frontend UI or directly via `job_search_stream_generator(SearchParams(query="python"))`.
2. `OCCScraper.search()` attempts to fetch the search results page at `https://www.occ.com.mx/empleos/de-python` using `self.fetch_html(url)`.
3. `fetch_html()` in `AbstractBaseScraper` uses standard `httpx.AsyncClient` without browser TLS/JA4 fingerprint impersonation.
4. Cloudflare WAF on `www.occ.com.mx` identifies the non-browser TLS signature and blocks the request with `HTTP 403 Forbidden` (`cf-mitigated: challenge`).
5. Because `fetch_html()` is decorated with `@retry(stop=stop_after_attempt(2))`, `tenacity` retries and raises `tenacity.RetryError[HTTPStatusError]`.
6. `OCCScraper.search()` only catches `(httpx.HTTPError, asyncio.TimeoutError)` and does not catch `tenacity.RetryError`, allowing the exception to propagate uncaught to `run_portal()` in `backend/src/mishoojobs/api/sse.py`.
7. `run_portal()` catches `except Exception:`, treats the failure as `"error"`, and emits:
   ```json
   {"portal": "occ", "status": "error", "count": 0, "message": "Occ: No disponible temporalmente"}
   ```
8. In `frontend/src/components/PortalStatusBar.tsx`, because `status.status` is `"error"` (not `"completed"`, `"searching"` while searching, or `"timeout"`), execution falls through to the default branch rendering:
   ```tsx
   <div className="... bg-slate-100 text-slate-500 ...">
     <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
     <span>OCC Mundial: Inactivo</span>
   </div>
   ```

## Suspected Code Paths

- `backend/src/mishoojobs/services/scrapers/occ.py:270-276` — `OCCScraper.search()` delegates to `self.fetch_html(url)` using standard `httpx` without Cloudflare TLS/JA4 browser impersonation, and fails to catch `tenacity.RetryError` or general scraper exceptions.
- `backend/src/mishoojobs/services/scrapers/occ.py:221-233` — `_fetch_offer_html_description()` uses `impersonate="chrome"`, which in newer `curl_cffi` releases resolves to Chrome 152 and should use resilient browser targets (`["chrome136", "chrome146", "safari184"]`).
- `backend/src/mishoojobs/services/scrapers/base.py:117-127` — `fetch_html()` wraps HTTP requests with tenacity retry but lacks browser impersonation for Cloudflare-protected portals.
- `backend/src/mishoojobs/api/sse.py:204-206` — `run_portal()` catches `except Exception:` blindly without logging the traceback, hiding scraper failures during development.
- `frontend/src/components/PortalStatusBar.tsx:63-71` — Falls through to rendering `"Inactivo"` whenever a portal encounters an error or scraper failure.

## Root Cause Hypothesis

OCC Mundial (`www.occ.com.mx`) enforces Cloudflare bot protection on its search catalog (`/empleos/de-<query>`). Unlike `IndeedScraper`—which was previously upgraded to use `curl_cffi` with a resilient target rotation list (`["chrome136", "chrome146", "safari184"]`) to bypass Cloudflare WAF—`OCCScraper.search()` still uses standard `httpx.AsyncClient`. When Cloudflare rejects the request with HTTP 403, `tenacity` wraps the error in `tenacity.RetryError`, which slips past `OCCScraper.search()`'s `try...except (httpx.HTTPError, asyncio.TimeoutError)` block. The unhandled exception causes `sse.py`'s `run_portal` to abort with `status: "error"`, prompting the frontend `PortalStatusBar` to show `OCC Mundial: Inactivo`.

Confidence: high (verified live against `www.occ.com.mx`: `httpx` returns 403 on search URLs while `curl_cffi` with `chrome136` returns 200 with complete HTML and 20+ vacancy cards).

## Proposed Remediation

**Preferred**:
1. Equip `OCCScraper` with `impersonate_targets = ["chrome136", "chrome146", "safari184"]` and execute `search()` requests using `curl_cffi.requests.AsyncSession` over the fallback list, identical to `IndeedScraper`'s proven Cloudflare bypass strategy.
2. In `OCCScraper.search()`, catch all exceptions during fetch (including `RetryError` or network errors) and fallback to `self.fetch_html()` before returning `[]` to prevent unhandled exceptions from propagating to SSE.
3. Update `OCCScraper._fetch_offer_html_description()` to rotate over `self.impersonate_targets` instead of hardcoding `impersonate="chrome"`.
4. In `backend/src/mishoojobs/api/sse.py`, add `logger.warning("Portal %s search failed: %s", p_name, exc, exc_info=True)` to `run_portal`'s exception handler so errors are visible in development logs.
5. Add unit and regression tests in `backend/tests/unit/test_scrapers.py` mocking `curl_cffi` for `OCCScraper.search()`, testing both successful vacancy extraction and graceful error handling.

**Alternatives**:
- *Bypass via backend proxy*: Route requests through an external rotating residential proxy service. Trade-off: introduces external network dependency, cost, and latency, violating the lightweight zero-external-cost philosophy.
- *Use Playwright headless browser*: Launch headless Chromium. Trade-off: heavy memory/CPU footprint unsuitable for real-time SSE streaming.

**Files likely to change**:
- `backend/src/mishoojobs/services/scrapers/occ.py`
- `backend/src/mishoojobs/api/sse.py`
- `backend/tests/unit/test_scrapers.py`

**Tests to add or update**:
- `test_occ_search_mocked_curl_cffi` — verifies `OCCScraper.search()` calls `curl_cffi.requests.AsyncSession` with `chrome136` and parses vacancies.
- `test_occ_search_fallback_on_403_target` — verifies `OCCScraper.search()` falls back to the next target if a target returns 403 or fails.
- `test_occ_search_graceful_error_returns_empty` — verifies `OCCScraper.search()` returns `[]` without raising unhandled exceptions when all attempts fail.

## Risks & Considerations

- **Cloudflare target evolution**: If Cloudflare updates JA4 fingerprints, targets in `impersonate_targets` may need future tuning. Keeping a multi-browser list (`chrome136`, `chrome146`, `safari184`) provides resilience.
- **Offline testing guarantee**: All tests must mock `curl_cffi.requests.AsyncSession` using fixtures to adhere strictly to the project constitution's 100% offline testing mandate.

## Open Questions

- None. The issue and root cause have been verified deterministically in both live reproduction and code analysis.
