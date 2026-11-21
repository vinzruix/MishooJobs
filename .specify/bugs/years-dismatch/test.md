# Bug Verification: Computrabajo Scraper Omits Requerimientos Section Causing Inaccurate 0 Years Experience Display

- **Slug**: years-dismatch
- **Tested**: 2026-11-16T16:09:00Z
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The fix was verified against the live Computrabajo FUN SHOES vacancy URL that failed in the initial assessment as well as dedicated unit tests and regression suites. The scraper now successfully extracts the full offer description including the structured "Requerimientos" list (`2 años de experiencia`), correctly assigning `years_required_min: 2` and `seniority_level: MID` without displaying inaccurate 0-experience defaults.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | Live Python execution of `ComputrabajoScraper.fetch_full_description()` + `classify_seniority_fast()` against FUN SHOES URL | pass | Extracted 3,203 chars containing `"2 años de experiencia"`; assigned `years_required_min: 2` and `seniority_level: "mid"` |
| New / updated tests | `.venv/bin/pytest backend/tests/unit/test_scrapers.py -k "computrabajo" -v && .venv/bin/pytest backend/tests/unit/test_seniority_classifier.py -k "extract_years_required" -v` | pass | 4/4 targeted tests passed in 0.24s |
| Regression suite (Backend) | `.venv/bin/pytest backend/tests/ -v` | pass | 60/60 tests passed in 8.26s |
| Regression suite (Frontend) | `cd frontend && npm test -- --run` | pass | 172/172 tests passed across 25 test suites in 2.53s |

## Output Excerpts

### Live Post-Fix Reproduction:
```text
Fetched desc length: 3203
Contains 2 anos de experiencia: True
Seniority Level: mid
Years Required Min: 2
SUCCESS: Post-fix reproduction passed perfectly!
```

### Targeted Tests Output:
```text
backend/tests/unit/test_scrapers.py::test_computrabajo_parser PASSED [ 33%]
backend/tests/unit/test_scrapers.py::test_computrabajo_extract_offer_description_retains_requirements PASSED [ 66%]
backend/tests/unit/test_scrapers.py::test_computrabajo_enrich_with_full_descriptions_updates_experience_and_seniority PASSED [100%]
backend/tests/unit/test_seniority_classifier.py::test_extract_years_required_variations PASSED [100%]
```

### Backend Regression Suite Summary:
```text
======================== 60 passed, 1 warning in 8.26s =========================
```

### Frontend Regression Suite Summary:
```text
Test Files  25 passed (25)
Tests       172 passed (172)
Duration    2.53s
```

## Residual Risks

- Future changes to Computrabajo's DOM structure: The multi-tier selector checks both the `div[div-link="oferta"]` / `div.box_detail` containers and falls back to narrative `<p class="mbB">` + sibling `<ul class="disc">` requirements list, protecting against partial DOM restructuring.

## Recommendation

Close the bug — verified end-to-end with live portal inspection, mocked scraper unit tests, and full stack regression validation.
