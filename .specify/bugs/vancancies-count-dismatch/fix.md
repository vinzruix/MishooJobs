# Bug Fix: Vacancy Count Discrepancy Across Portal Status Badges and Deduplication Summary

- **Slug**: vancancies-count-dismatch
- **Fixed**: 2026-11-08T19:00:00Z
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Harmonized live discovery metrics across the SSE stream, scrapers, deduplicator, and UI by aligning `portal_status` counts with net delivered vacancies, and disambiguating anonymous employer fingerprints ("Empresa Confidencial") using listing URLs to eliminate false duplicate collisions and arithmetic mismatches.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `backend/src/mishoojobs/services/scrapers/base.py` | modified | Added `is_generic_company()` helper and updated `generate_fingerprint` to include disambiguator for anonymous employers |
| `backend/src/mishoojobs/services/deduplicator.py` | modified | Imported `is_generic_company`, updated `generate_fingerprint` and passed direct URL disambiguator in `deduplicate_batch` |
| `backend/src/mishoojobs/services/scrapers/computrabajo.py` | modified | Passed `disambiguator=direct_url` to `generate_fingerprint` |
| `backend/src/mishoojobs/services/scrapers/indeed.py` | modified | Passed `disambiguator=direct_url` to `generate_fingerprint` |
| `backend/src/mishoojobs/services/scrapers/occ.py` | modified | Passed `disambiguator=direct_url` to `generate_fingerprint` |
| `backend/src/mishoojobs/api/sse.py` | modified | Emitted net delivered vacancy count in `portal_status`, aligning with batch size and cross-portal deduplication totals |
| `frontend/src/components/PortalStatusBar.tsx` | modified | Added informative tooltip explaining live streaming 15-vacancy batch limit per portal |
| `backend/tests/unit/test_deduplicator.py` | modified | Added tests verifying anonymous employer disambiguation and deduplication summary invariants |
| `backend/tests/integration/test_sse_stream.py` | modified | Added end-to-end integration test verifying that $\sum \text{portal\_status.count} == \text{summary.total\_extracted}$ and $\text{total} - \text{duplicates} == \text{unique}$ |
| `frontend/tests/App.test.tsx` | modified | Added component test asserting coherent deduplication badge rendering |
| `GEMINI.md` | modified | Logged architectural decision and convention for vacancy count synchronization and generic employer disambiguation |

## Diff Highlights

### Anonymous Employer Fingerprint Disambiguation (`backend/src/mishoojobs/services/scrapers/base.py`)
```python
def is_generic_company(name: str) -> bool:
    """Detects whether a company name is an anonymous recruiter placeholder."""
    if not name:
        return True
    # ...
    return norm in GENERIC_COMPANY_NAMES or "confidencial" in norm or "importante empresa" in norm

def generate_fingerprint(self, company_name: str, title: str, location_state: str, disambiguator: str = "") -> str:
    # ...
    if is_generic_company(norm_company) and disambiguator:
        clean_disambiguator = self.normalize_string(disambiguator.split("#")[0].split("?")[0])
        raw_key = f"{norm_company}:{norm_title}:{norm_state}:{clean_disambiguator}"
    else:
        raw_key = f"{norm_company}:{norm_title}:{norm_state}"
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
```

### Net Delivered Count in `portal_status` (`backend/src/mishoojobs/api/sse.py`)
```python
if status_str == "completed":
    p_status = PortalScraperStatus.COMPLETED
    deduped_portal_vacs, _ = deduplicator.deduplicate_batch(verified_vacs) if verified_vacs else ([], None)
    delivered_count = len(deduped_portal_vacs)
    msg = f"{portal_name.value.capitalize()}: {delivered_count} vacantes verificadas"

yield format_sse(
    "portal_status",
    PortalStatusEvent(
        portal=portal_name,
        status=p_status,
        count=delivered_count,
        message=msg,
        duration_ms=duration_ms,
    ).model_dump(mode="json"),
)
```

## Tests Added or Updated

- `backend/tests/unit/test_deduplicator.py::test_generic_company_fingerprint_disambiguation` — Verifies that distinct anonymous postings ("Empresa Confidencial") produce distinct fingerprints while real companies consolidate across portals.
- `backend/tests/unit/test_deduplicator.py::test_confidential_vacancies_not_falsely_merged` — Verifies that distinct confidential listings are preserved during batch deduplication.
- `backend/tests/integration/test_sse_stream.py::test_sse_stream_count_mathematical_consistency` — Verifies end-to-end mathematical invariant: $\sum \text{portal\_status.count} == \text{summary.total\_extracted}$ and $\text{total\_extracted} - \text{duplicates\_merged} == \text{unique\_vacancies}$.
- `frontend/tests/App.test.tsx` — Added test verifying deduplication metric badge rendering with coherent counts.

## Local Verification

- Backend Pytest Suite: `.venv/bin/pytest backend/tests/ -v` → 38 passed in 6.97s.
- Frontend Vitest Suite: `npm test -- --run` → 8 test files, 61 passed in 1.27s.
- Live Stream Check: Verified end-to-end across multiple real query payloads (`Python Junior`, `software engineer`) that the sum of portal badge counts equals `total_extracted`, and $\text{total\_extracted} - \text{duplicates\_merged} == \text{unique\_vacancies}$ equals feed count.

## Deviations from Assessment

None. The implementation followed the preferred remediation outlined in the assessment.

## Follow-ups

- None required. All tests pass 100% offline and live streams maintain continuous mathematical integrity.
