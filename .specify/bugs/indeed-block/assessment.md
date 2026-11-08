# Bug Assessment: Indeed Scraping Blocked by Cloudflare WAF

- **Slug**: indeed-block
- **Created**: 2026-11-08T12:22:30-06:00
- **Source**: pasted text
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

> "When I search vacancies Indeed does not provide any vacancies never. slug=Indeed-block"

## Symptom

When executing a job search query across portals via the live SSE endpoint (`/api/v1/vacancies/search/stream`), Indeed México (`IndeedScraper`) consistently yields 0 vacancies and reports `completed` with 0 results. The frontend status bar displays `Indeed México: 0 verificadas` and no Indeed job listings appear in the search results or deduplicated stream.

## Reproduction

1. In the backend environment (`.venv`), execute:
   ```bash
   python -c "
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
3. Inspect network traffic / HTTP response from `https://mx.indeed.com/jobs?q=python&l=M%C3%A9xico` using the configured `safari17_0` and iPhone User-Agent headers.
4. Observe HTTP 403 response with Cloudflare Bot Management challenge payload:
   - Title: `Security Check - Indeed.com`
   - Heading: `Additional Verification Required`
   - Cookie: `__cf_bm`

## Suspected Code Paths

- `backend/src/mishoojobs/services/scrapers/indeed.py:293-305` — `IndeedScraper.search()` invokes `curl_cffi.requests.AsyncSession` with `impersonate="safari17_0"` and manual iPhone User-Agent / Accept headers (`Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)...`). This static fingerprint is recognized and rejected by Cloudflare with an immediate HTTP 403 challenge.
- `backend/src/mishoojobs/services/scrapers/indeed.py:236-248` — `IndeedScraper.fetch_full_description()` also hardcodes `safari17_0` and manual iPhone headers for `/rpc/jobdescs?jks={jk}`, which similarly fails with 403 when enriching full descriptions.
- `backend/src/mishoojobs/services/scrapers/indeed.py:356-361` — When `AsyncSession` receives HTTP 403, execution drops into `self.fetch_html()`, which uses standard `httpx.AsyncClient` without TLS impersonation. `httpx` also receives HTTP 403, triggers an uncaught exception caught by `except Exception: return []`, silently swallowing the error.
- `backend/src/mishoojobs/api/sse.py:157-194` — Because `IndeedScraper.search()` returns `[]` instead of raising an error or indicating a block, `run_portal` treats the scraper as having successfully `completed` with 0 vacancies rather than reporting a portal error or temporary blockage.

## Root Cause Hypothesis

Indeed México (`mx.indeed.com`) is protected by Cloudflare Bot Management (`__cf_bm` cookies and TLS/HTTP2 fingerprint validation). In commit `715e618`, `IndeedScraper` was updated to use `curl_cffi` with `impersonate="safari17_0"` combined with explicit iPhone User-Agent headers. This combination has been flagged by Cloudflare WAF, resulting in an immediate HTTP 403 (`Security Check - Indeed.com / Additional Verification Required`).

Crucially, testing demonstrates that `curl_cffi` using the generic `impersonate="chrome"` without overriding default browser headers successfully negotiates TLS/JA4 signatures and HTTP/2 pseudo-headers, returning HTTP 200 with full vacancy HTML and allowing `/rpc/jobdescs` batch description enrichment. Furthermore, the silent `try/except` in `IndeedScraper.search` masks the 403 failure, making it appear as if Indeed returned 0 matching jobs.

*Confidence*: High. Direct verification confirmed that `impersonate="safari17_0"` yields HTTP 403 (0 vacancies), whereas `impersonate="chrome"` yields HTTP 200 (15+ vacancies parsed and enriched).

## Proposed Remediation

**Preferred**:
1. Update `backend/src/mishoojobs/services/scrapers/indeed.py`:
   - In `search()`: Change `AsyncSession(impersonate="safari17_0")` to `AsyncSession(impersonate="chrome")` and remove the conflicting manual iPhone User-Agent and Accept headers to let `curl_cffi` automatically generate authentic Chrome TLS/JA4 signatures and default HTTP headers.
   - In `fetch_full_description()`: Similarly update `AsyncSession` to `impersonate="chrome"` without manual iPhone headers for `/rpc/jobdescs` and `/rc/clk`.
   - Update fallback logic and error propagation so that an outright WAF block is logged or handled rather than silently swallowed as a valid empty response.
2. Update `GEMINI.md` conventions log to reflect switching from `safari17_0` to modern `chrome` impersonation for Indeed scraping.
3. Add unit test coverage in `backend/tests/unit/test_scrapers.py` mocking `curl_cffi.requests.AsyncSession` (or mock search response) to verify that `IndeedScraper.search()` completes and parses vacancies correctly without live network requests.

**Alternatives**:
- *Playwright / Headless Browser*: Integrate a headless browser (Playwright with stealth) to execute Cloudflare Turnstile challenges. *Trade-off*: Heavy dependency footprint, high CPU/RAM overhead, and slower response times compared to lightweight `curl_cffi`.
- *Proxy Rotation / Residential Proxies*: Route requests through rotating residential proxies. *Trade-off*: Violates the zero-external-paid-dependency pillar and adds infrastructure complexity.

**Files likely to change**:
- `backend/src/mishoojobs/services/scrapers/indeed.py`
- `backend/tests/unit/test_scrapers.py`
- `GEMINI.md`

**Tests to add or update**:
- Add unit test in `backend/tests/unit/test_scrapers.py` simulating `IndeedScraper.search()` with mocked `AsyncSession` to verify end-to-end extraction and description enrichment offline.
- Verify existing tests `test_indeed_parser` and `test_indeed_parser_mosaic_json` continue to pass.

## Risks & Considerations

- **Cloudflare Rule Changes**: Cloudflare frequently updates bot detection heuristics. Relying on `curl_cffi`'s `impersonate="chrome"` is effective currently, but future updates might require updating `curl_cffi` or adjusting headers.
- **Offline Test Mandate**: Tests must strictly mock network interactions via `unittest.mock.patch` to satisfy the project mandate that all tests run 100% offline with zero live network calls.

## Open Questions

- None. Root cause verified via live diagnostic probe against `mx.indeed.com` and confirmed reproducible.
