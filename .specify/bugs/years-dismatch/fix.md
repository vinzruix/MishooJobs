# Bug Fix: Computrabajo Scraper Omits Requerimientos Section Causing Inaccurate 0 Years Experience Display

- **Slug**: years-dismatch
- **Fixed**: 2026-11-16T16:08:00Z
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Updated `ComputrabajoScraper` to extract the full offer description including the structured `Requerimientos` section (`ul.disc`) and aptitudes tags, stripping transient noisy UI elements. Also expanded `SeniorityClassifier.extract_years_required` regex to support `experiencia [mínima/laboral/previa/profesional] de X años`. This prevents minimum required years of experience from being truncated and guarantees accurate experience extraction and seniority classification.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `backend/src/mishoojobs/services/scrapers/computrabajo.py` | modified | Added `_extract_offer_description` to extract the complete offer container (`div[div-link="oferta"]` / `div.box_detail`) and requirements list (`ul.disc`), stripping interactive action noise; updated `fetch_full_description` and `enrich_with_full_descriptions` to use it. |
| `backend/src/mishoojobs/services/seniority_classifier.py` | modified | Expanded regex in `extract_years_required` to match `experiencia [mínima/laboral/previa/profesional] de X años`. |
| `backend/tests/unit/test_scrapers.py` | modified | Added `test_computrabajo_extract_offer_description_retains_requirements` and `test_computrabajo_enrich_with_full_descriptions_updates_experience_and_seniority`. |
| `backend/tests/unit/test_seniority_classifier.py` | modified | Added `test_extract_years_required_variations`. |
| `GEMINI.md` | modified | Recorded `[years-dismatch]` architectural convention in Section 7. |

## Diff Highlights

```python
# backend/src/mishoojobs/services/scrapers/computrabajo.py
def _extract_offer_description(self, soup: BeautifulSoup) -> Optional[str]:
    container = soup.select_one("div[div-link='oferta']") or soup.select_one("div.box_detail")
    if container:
        cleaned = BeautifulSoup(str(container), "html.parser")
        for noise in cleaned.select(
            ".posSticky_m, .opt_dots, .box_show_offer, nav, div.opt_bubble, "
            "div.dFlex.vm_fx.tc_fx, [data-complaint-offer-openpopup-button], "
            "div.box_side, .box_ok, [undo-hidden-offer], [hidden-offer-banner]"
        ):
            noise.decompose()
        text = cleaned.get_text(separator="\n", strip=True)
        if len(text) > 80:
            return self.sanitize_text(text)
    # Fallback to narrative paragraph + requirements list
    ...
```

## Tests Added or Updated

- `backend/tests/unit/test_scrapers.py::test_computrabajo_extract_offer_description_retains_requirements` — Verifies that `_extract_offer_description` retains the "Requerimientos" list (`2 años de experiencia`) and strips noisy action buttons.
- `backend/tests/unit/test_scrapers.py::test_computrabajo_enrich_with_full_descriptions_updates_experience_and_seniority` — Verifies that `enrich_with_full_descriptions` updates a vacancy's `years_required_min` to 2 and `seniority_level` to `MID` using the offer HTML.
- `backend/tests/unit/test_seniority_classifier.py::test_extract_years_required_variations` — Verifies extraction across various Mexican Spanish experience requirement phrasings.

## Local Verification

- Commands run:
  - `.venv/bin/pytest backend/tests/ -v` → 60 passed in 9.77s
  - `cd frontend && npm test -- --run` → 172 passed across 25 test files
- Manual checks:
  - Tested live against Computrabajo FUN SHOES offer (`/ofertas-de-trabajo/oferta-de-trabajo-de-programador-y-desarrollo-websistemas-soporte-tecnologico-en-leon-B58AE6D77CC23E8B61373E686DCF3405`): extracted 3203 chars, retained "2 años de experiencia", correctly classified as `MID` with `years_required_min: 2`.

## Deviations from Assessment

None. The preferred remediation was applied and supplemented with regex coverage in `SeniorityClassifier.extract_years_required` for "experiencia mínima de X años".

## Follow-ups

- Run `/speckit-bug-test slug=years-dismatch` to formally record verification report.
