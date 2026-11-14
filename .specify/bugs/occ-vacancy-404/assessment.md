# Bug Assessment: OCC Vacancy Direct Links Resolve to OCC 404 Page

- **Slug**: occ-vacancy-404
- **Created**: 2026-11-10T21:37:48-06:00
- **Source**: pasted text
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

> "Im having troubles with the occ vacancies link its bringing me to a 404 page of occ"

## Symptom

When a user clicks the external OCC Mundial link on a vacancy card (`VacancyCard`) or inside the vacancy detail modal (`VacancyDetailModal`) to view or apply for a job on OCC, the browser opens `https://www.occ.com.mx/empleo/oferta/<id>` and lands on OCC's 404 page (*"Error 404 — Lo sentimos, no podemos encontrar la vacante que buscas"*), even though the vacancy is active and listed in OCC's live search results. Expected behavior is that clicking the OCC link opens the active job posting on `occ.com.mx`.

## Reproduction

1. Search for `"desarrollador"` (or `"java"`, `"soporte tecnico"`) via the search bar or run `OCCScraper().search("desarrollador")` in `.venv`:
   ```bash
   .venv/bin/python -c '
   import asyncio
   from curl_cffi.requests import AsyncSession
   from mishoojobs.services.scrapers.occ import OCCScraper

   async def main():
       s = OCCScraper()
       vacs = await s.search("desarrollador", limit=8)
       async with AsyncSession(impersonate="chrome") as cs:
           for v in vacs:
               url = v.external_links[0].direct_url
               r = await cs.get(url, timeout=10)
               print(v.title, "->", url, "HTTP", r.status_code, "404_text=", ("Error 404" in r.text))

   asyncio.run(main())
   '
   ```
2. Observe that `OCCScraper.parse_html()` generates `https://www.occ.com.mx/empleo/oferta/<data_id>` (e.g., `https://www.occ.com.mx/empleo/oferta/21390143`, `https://www.occ.com.mx/empleo/oferta/21399716`) because live `li.vacancy-card` elements contain zero `<a>` tags.
3. Observe in a real browser (or `curl_cffi` with `impersonate="chrome"`) that `https://www.occ.com.mx/empleo/oferta/21390143` and the first 8 results for `"desarrollador"` (as well as 3/8 for `"java"` and 1/8 for `"soporte-tecnico"`) return HTTP `404` with *"Error 404 Lo sentimos, no podemos encontrar la vacante que buscas"*.
4. Observe simultaneously that:
   - `URLVerifier.verify_single_url()` receives HTTP `403` from `httpx.head()` on `occ.com.mx/empleo/oferta/<id>` and marks it `is_active=True, status_code=200`.
   - `https://www.occ.com.mx/empleos/?jobid=<id>` and `https://www.occ.com.mx/empleos/de-<query>?jobid=<id>` return HTTP `200` with `selectedJobId = <id>`, and `https://oferta.occ.com.mx/offer/<id>/d/j?ipo=41&iapo=1` returns HTTP `200` JSON with the full vacancy details.

## Suspected Code Paths

- `backend/src/mishoojobs/services/scrapers/occ.py:23-41` — `OCCScraper.parse_html()` searches inside each `li.vacancy-card` for `a[href*='/empleo/oferta/']`, `a[href*='/empleo/']`, `h2 a`, or `a`. Live OCC split-grid cards (`li.vacancy-card` with `<div class="vacancy-card__body" role="button">`) contain no `<a>` tags at all, so execution always falls back to `elif data_id: direct_url = f"https://www.occ.com.mx/empleo/oferta/{data_id}"`.
- `backend/src/mishoojobs/services/scrapers/occ.py:150-174` — `OCCScraper.fetch_full_description()` fetches `direct_url` and checks `r.status_code == 200` for `div.rich-text, div.break-words`, returning `None` when `/empleo/oferta/{data_id}` returns `404` (and would also miss client-hydrated `?jobid=` SRP pages).
- `backend/src/mishoojobs/services/scrapers/occ.py:196-226` — `OCCScraper.search()` concurrently enriches descriptions from `v.external_links[0].direct_url`, silently dropping enrichment on `404` responses while keeping the broken URL on the returned `VacancyDTO`.
- `backend/src/mishoojobs/services/verifier.py:52-60` — `URLVerifier.verify_single_url()` runs `httpx.AsyncClient.head(url)`, receives HTTP `403` from OCC's WAF on `/empleo/oferta/{data_id}`, and unconditionally treats `(401, 403, 429)` on `occ.com.mx` as `is_bot_challenge = True` (`is_active=True, status_code=200`), failing to filter out OCC `404` URLs.
- `backend/src/mishoojobs/api/sse.py:118-134, 185, 245` — Streams verified OCC `VacancyDTO` links to the client and persists `direct_url` into PostgreSQL `external_links`.
- `backend/src/mishoojobs/api/routes/vacancies.py:64-95, 249-282` — `evaluate_vacancy` and `audit_vacancy_seniority` rely on `request.direct_url` / `db_vac.external_links` and `OCCScraper.fetch_full_description(url)`, inheriting the broken `/empleo/oferta/{data_id}` URL.
- `frontend/src/components/VacancyCard.tsx:52-54, 209-220` and `frontend/src/components/VacancyDetailModal.tsx:447-465` — Render `direct_url` verbatim in `<a href={...} target="_blank">`.

## Root Cause Hypothesis

OCC Mundial's search results page uses its `offerssplitgrid` UI where each `<li class="vacancy-card" data-id="{id}">` card is a `<div role="button">` without any `<a href>` anchor, and clicking a vacancy updates the URL query parameter `?jobid={id}` (loading offer details client-side from `https://oferta.occ.com.mx/offer/{id}/d/j?ipo=41&iapo=1`, and loading out-of-grid cards via `/offersgrid/getoffercard?offerId={id}`).

Because `OCCScraper.parse_html()` finds no `<a>` tag inside `li.vacancy-card`, it falls back to constructing the legacy standalone URL `https://www.occ.com.mx/empleo/oferta/{data_id}`. However, OCC's `/empleo/oferta/{id}` (and even slugged `/empleo/oferta/{id}-{slug}` links found in OCC's JSON-LD) now returns HTTP `404` (*"Lo sentimos, no podemos encontrar la vacante que buscas"*) for a large portion of active listings—for example, 8 of the top 8 results for `de-desarrollador`—while `https://www.occ.com.mx/empleos/?jobid={id}` and `https://www.occ.com.mx/empleos/de-{query}?jobid={id}` return HTTP `200` with `selectedJobId = {id}` and render the active job posting in a browser.

Additionally, `URLVerifier` uses plain `httpx` HEAD requests, which OCC's Cloudflare WAF blocks with HTTP `403` on `/empleo/oferta/{id}`. Because `URLVerifier` normalizes all `401/403/429` responses on `occ.com.mx` to `is_active=True, status_code=200`, it masks the underlying `404` and allows broken OCC links to stream to the UI and persist in PostgreSQL. (As a secondary effect, `OCCScraper.search()` and `fetch_full_description()` also fail to enrich full descriptions for those `404` listings.)

*Confidence*: High — verified directly against live OCC HTML, `offerssplitgrid.logged.bundle.min.js`, `oferta.occ.com.mx`, and `URLVerifier` behavior.

## Proposed Remediation

**Preferred**:
1. **Generate canonical split-grid `?jobid=` URLs in `OCCScraper` (`backend/src/mishoojobs/services/scrapers/occ.py`)**:
   - In `parse_html()`, when `data_id` is extracted from `li.vacancy-card` (no `<a>` link present), construct `https://www.occ.com.mx/empleos/?jobid={data_id}` (or, if the search path is extracted from `<link rel="canonical">` / `<input id="prof-cat-search-input-holder">` or passed from `search()`, `https://www.occ.com.mx{search_path}?jobid={data_id}`), instead of `/empleo/oferta/{data_id}`.
   - Note: `https://www.occ.com.mx/empleos/?jobid={data_id}` works universally even without search context (because OCC's `of()` -> `vf(id)` -> `cf(id)` calls `/offersgrid/getoffercard?offerId={id}` and `oferta.occ.com.mx/offer/{id}/d/j?ipo=41&iapo=1`), while `https://www.occ.com.mx/empleos/de-{q_slug}?jobid={data_id}` additionally preserves the search list context. Also preserve support for explicit `<a href*='/empleo/oferta/'>` tags when parsing legacy fixtures (`backend/tests/fixtures/occ_raw.html`), or update `occ_raw.html` / add a modern `li.vacancy-card` test case.
2. **Enrich OCC descriptions via OCC's JSON offer endpoint (`backend/src/mishoojobs/services/scrapers/occ.py`)**:
   - Extract the numeric offer ID from either `?jobid=<id>` or `/empleo/oferta/<id>` in `search()` and `fetch_full_description()`.
   - Fetch `https://oferta.occ.com.mx/offer/{offer_id}/d/j?ipo=41&iapo=1` (via `curl_cffi.requests.AsyncSession(impersonate="chrome")` or `httpx` fallback), parse JSON `data["o"]["ld"]`, sanitize HTML into plain text with `self.sanitize_text()` / BeautifulSoup, and keep the existing HTML `div.rich-text, div.break-words` scrape as a fallback.
3. **Prevent `URLVerifier` from blindly passing `404` OCC links under WAF (`backend/src/mishoojobs/services/verifier.py`)**:
   - Verify whether `httpx.head()` on `https://www.occ.com.mx/empleos/?jobid={id}` returns `200` directly, and for OCC URLs where `httpx` hits a bot challenge (`401/403/429`) or where `?jobid=` always returns `200` at the SRP shell even for expired IDs, validate offer liveness via `https://oferta.occ.com.mx/offer/{offer_id}/d/j?ipo=41&iapo=1` (`200` = active, `204/404` = inactive/expired) or `curl_cffi` fallback.
4. **Update `GEMINI.md`** architectural conventions log once fixed.

**Alternatives**:
- *Validate and keep `/empleo/oferta/{id}-{slug}` using `curl_cffi` in `URLVerifier`*: Extract slugged URLs from OCC's `application/ld+json` and discard `404` offers. *Trade-off*: Discards a huge portion of legitimate active OCC jobs (e.g., 100% of top 8 results for `"desarrollador"`, since even OCC's own JSON-LD `/empleo/oferta/{id}-{slug}` URLs return `404` on those listings).
- *Construct `/empleos/de-{query}?jobid={id}` exclusively in `search()`*: *Trade-off*: Cleaner UX in OCC's left sidebar list, though if `parse_html()` is called standalone without `search()` context (e.g. unit tests or helper reuse), it still needs `https://www.occ.com.mx/empleos/?jobid={id}` or canonical URL extraction as its default.

**Files likely to change**:
- `backend/src/mishoojobs/services/scrapers/occ.py`
- `backend/src/mishoojobs/services/verifier.py`
- `backend/tests/unit/test_scrapers.py`
- `backend/tests/unit/test_verifier.py`
- `GEMINI.md`

**Tests to add or update**:
- Offline unit test in `backend/tests/unit/test_scrapers.py` using a fixture/HTML snippet of modern OCC `<li class="vacancy-card" data-id="...">` (with no `<a>` tags) verifying `parse_html()` produces `?jobid={data_id}` instead of `/empleo/oferta/{data_id}`.
- Offline unit test mocking `oferta.occ.com.mx/offer/{id}/d/j?ipo=41&iapo=1` JSON payload (`{"o": {"ld": "<p>...</p>"}}`) to verify `OCCScraper.search()` and `OCCScraper.fetch_full_description()` extract and sanitize the full description.
- Offline unit test in `backend/tests/unit/test_verifier.py` verifying OCC offer liveness handling (active `200` vs expired `204`/`404`, and avoiding false-positive `200` on broken `/empleo/oferta/` `404`s).

## Risks & Considerations

- **Stale cached URLs in PostgreSQL & IndexedDB**: Existing `external_links` rows in PostgreSQL and previously saved/applied records in browser `IndexedDB` (`applications` store) will still contain the old `https://www.occ.com.mx/empleo/oferta/{id}` URLs. Note `sse.py:124` (`if link.direct_url not in existing_urls`) appends new URLs rather than replacing stale ones on conflict, so `vacancies.py` (`evaluate` / `audit`) or DB maintenance may need to prioritize/replace stale `/empleo/oferta/` links or refresh them.
- **OCC `?jobid=` liveness false-positives**: `https://www.occ.com.mx/empleos/?jobid=999999999` still returns HTTP `200` (with `selectedJobId = null`) even for non-existent IDs. Relying solely on `HEAD /empleos/?jobid=...` in `URLVerifier` without checking `oferta.occ.com.mx` or `getoffercard` could let expired OCC IDs pass verification.
- **Upstream API changes**: `https://oferta.occ.com.mx/offer/{id}/d/j?ipo=41&iapo=1` is an internal OCC frontend XHR endpoint (`#hduod`); parameters (`ipo=41`, `iapo=1`, `d/j`) could change if OCC updates its frontend bundle, so retaining the HTML selector fallback is prudent.
- **Fingerprints**: In `OCCScraper.parse_html()`, `direct_url` is passed as `disambiguator` to `generate_fingerprint()` when company name is generic (`"Empresa Confidencial"`), meaning fingerprints for confidential OCC postings will change once the URL format changes (deduplication remains consistent within the new format).

## Open Questions

- None. Root cause verified directly against live `occ.com.mx` responses and codebase inspection.
