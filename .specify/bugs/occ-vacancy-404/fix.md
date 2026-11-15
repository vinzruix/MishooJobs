# Bug Fix: OCC Vacancy Direct Links Resolve to OCC 404 Page

- **Slug**: occ-vacancy-404
- **Fixed**: 2026-11-10T21:48:07-06:00
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Updated [`OCCScraper`](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/backend/src/mishoojobs/services/scrapers/occ.py) to generate canonical OCC split-grid `?jobid=<id>` URLs (`https://www.occ.com.mx/empleos/?jobid=<id>`) instead of the broken `/empleo/oferta/<id>` fallback, and to enrich descriptions via OCC's `oferta.occ.com.mx` offer JSON endpoint. Updated [`URLVerifier`](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/backend/src/mishoojobs/services/verifier.py) to validate `?jobid=` offer liveness via `oferta.occ.com.mx` and check real status on legacy `/empleo/oferta/` URLs behind WAF, and updated fingerprint disambiguation to preserve `jobid`/`jk` query parameters for confidential employers.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `backend/src/mishoojobs/services/scrapers/occ.py` | modified | Generate `?jobid=<data_id>` URLs for anchorless split-grid cards; add `extract_occ_offer_id`, JSON description parsing (`oferta.occ.com.mx/offer/{id}/d/j?ipo=41&iapo=1`), and clean HTML fallback |
| `backend/src/mishoojobs/services/verifier.py` | modified | Validate OCC `?jobid=` links against `oferta.occ.com.mx` (`200` active, `204/404` inactive) and check `/empleo/oferta/` status via `curl_cffi` on WAF `401/403/429` |
| `backend/src/mishoojobs/services/scrapers/base.py` | modified | Added `clean_disambiguator_url()` so `generate_fingerprint()` preserves `jobid`/`jk` query parameters while stripping `#` fragments and tracking params |
| `backend/src/mishoojobs/services/deduplicator.py` | modified | Reused `clean_disambiguator_url()` in `CrossPortalDeduplicator.generate_fingerprint()` |
| `backend/tests/unit/test_scrapers.py` | added tests | Added 3 offline unit tests covering split-grid `?jobid=` parsing, `oferta.occ.com.mx` search enrichment, and `fetch_full_description` |
| `backend/tests/unit/test_verifier.py` | added tests | Added 2 offline unit tests covering OCC `?jobid=` liveness (`200` vs `204`) and legacy `/empleo/oferta/` `403` -> `404`/`200` resolution |
| `backend/tests/unit/test_deduplicator.py` | added test | Added offline unit test verifying confidential OCC `?jobid=` vacancies are not falsely merged |
| `GEMINI.md` | modified | Recorded `[occ-vacancy-404]` conventions in the Architectural Decisions & Conventions Log |

## Diff Highlights

```python
# backend/src/mishoojobs/services/scrapers/occ.py
elif data_id:
    # Modern OCC split-grid cards omit <a> tags; ?jobid= opens the active offer panel directly
    direct_url = f"{self.base_url}/empleos/?jobid={data_id}"
```

```python
# backend/src/mishoojobs/services/verifier.py
if "occ.com.mx" in url and "jobid=" in url:
    offer_id = extract_occ_offer_id(url)
    if offer_id:
        return await self._verify_occ_split_grid_url(client, url, offer_id, now)
```

```python
# backend/src/mishoojobs/services/scrapers/base.py
def clean_disambiguator_url(disambiguator: str) -> str:
    """Strips URL fragments and tracking query params while preserving identity IDs (jobid, jk)."""
    base = disambiguator.split("#")[0]
    if "?" not in base:
        return base
    parsed = urlparse(base)
    qs = parse_qs(parsed.query)
    identity_parts = [f"{key}={qs[key][0]}" for key in ("jobid", "jk") if qs.get(key)]
    path_only = base.split("?")[0]
    if identity_parts:
        return f"{path_only}?{'&'.join(identity_parts)}"
    return path_only
```

## Tests Added or Updated

- `backend/tests/unit/test_scrapers.py::test_occ_parser_split_grid_without_anchor_uses_jobid` — verifies modern `li.vacancy-card` HTML without `<a>` tags produces `https://www.occ.com.mx/empleos/?jobid=<id>` instead of `/empleo/oferta/<id>`.
- `backend/tests/unit/test_scrapers.py::test_occ_search_enriches_from_offer_json_endpoint` — verifies `OCCScraper.search()` enriches description and extracted skills from `https://oferta.occ.com.mx/offer/{id}/d/j?ipo=41&iapo=1`.
- `backend/tests/unit/test_scrapers.py::test_occ_fetch_full_description_from_jobid_and_legacy_url` — verifies `fetch_full_description()` extracts `offer_id` from both `?jobid=` and `/empleo/oferta/` URLs and sanitizes the HTML description.
- `backend/tests/unit/test_verifier.py::test_url_verifier_occ_split_grid_active_and_expired` — verifies `URLVerifier` marks `200` OCC API responses active and `204` responses inactive (`404`).
- `backend/tests/unit/test_verifier.py::test_url_verifier_occ_legacy_oferta_403_checked_not_blindly_passed` — verifies `URLVerifier` resolves real `404`/`200` status for legacy `/empleo/oferta/` URLs when `HEAD` hits a `403` WAF challenge.
- `backend/tests/unit/test_deduplicator.py::test_confidential_occ_jobid_vacancies_not_falsely_merged` — verifies distinct `?jobid=` URLs for `"Empresa Confidencial"` produce distinct SHA-256 fingerprints.

## Local Verification

- Commands run: `.venv/bin/pytest backend/tests/unit/ -v` → `39 passed in 0.41s` (100% offline, all unit tests passing).
- Manual checks: Live diagnostic run of `OCCScraper().search("desarrollador", limit=5)` + `URLVerifier().verify_vacancies()` → 5/5 scraped and verified active with `https://www.occ.com.mx/empleos/?jobid=<id>`, enriched descriptions (`766`–`2791` chars), HTTP `200`, and `selectedJobId = <id>` present on every page.

## Deviations from Assessment

- **Expanded scope to `base.py`, `deduplicator.py`, and `test_deduplicator.py`**: During implementation, inspection of `AbstractBaseScraper.generate_fingerprint()` (`base.py`) and `CrossPortalDeduplicator.generate_fingerprint()` (`deduplicator.py`) revealed that `disambiguator.split("#")[0].split("?")[0]` stripped `?jobid=<id>`, which would have collapsed every `"Empresa Confidencial"` OCC vacancy with the same title/state to an identical disambiguator (`https://www.occ.com.mx/empleos/`). Extracted `clean_disambiguator_url()` in `base.py` (shared with `deduplicator.py`) to preserve `jobid` and `jk` identity query parameters, and added `test_confidential_occ_jobid_vacancies_not_falsely_merged`.
- Used `https://www.occ.com.mx/empleos/?jobid={data_id}` (rather than `/empleos/de-{query}?jobid={data_id}`) because OCC's client-side `of()` initializer only runs when `window.hasOfferResults` is `true`; `/empleos/` guarantees non-empty grid initialization even if a specific query later returns zero results.

## Follow-ups

- Run `/speckit-bug-test slug=occ-vacancy-404` to validate the fix end-to-end.
- Existing records already saved in PostgreSQL `external_links` or browser `IndexedDB` (`applications`) prior to this fix will retain their older `/empleo/oferta/` URLs until refreshed by subsequent searches (on-demand evaluation/audit still extracts the offer ID and fetches descriptions from `oferta.occ.com.mx`).
