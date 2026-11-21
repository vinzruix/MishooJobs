# Bug Assessment: Computrabajo Scraper Omits Requerimientos Section Causing Inaccurate 0 Years Experience Display

- **Slug**: years-dismatch
- **Created**: 2026-11-16T16:03:00Z
- **Source**: pasted text and uploaded screenshots (`media_1794866278460_fa20ec9d.png`, `media_1794866295692_808756f1.png`)
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

The user reported:
> "As you can see in the images the vacancy card says that 0years of experiuence but in the requiemerents in the page it says 2 years minimum slug=years-dismatch"

Attached images:
1. `media_1794866278460_fa20ec9d.png`: Screenshot of Computrabajo's job requirements section displaying:
   - Educación mínima: Educación superior - Licenciatura
   - 2 años de experiencia
   - Edad: entre 22 y 30 años
   - Conocimientos: Actualización tecnológica, Analítica web, Base de datos, Crm, Inventario, Programacion, Shopify, Administración de tecnología de construcción, Administración de sistemas, Administración web, Analítica web, Análisis de inteligencia
2. `media_1794866295692_808756f1.png`: Screenshot of MishooJobs vacancy card:
   - Title: "Programador y Desarrollo Web/Sistemas"
   - Company: "FUN SHOES"
   - Match & Seniority: `53% Match`, `[ JR ]`
   - Metadata: `PRESENCIAL`, `León, GTO`, `$13,000 MXN /mensual`, `💼 0 años de exp`
   - External Link: "Computrabajo"

## Symptom

When scraping and displaying job listings from Computrabajo (e.g. "FUN SHOES - Programador y Desarrollo Web/Sistemas"), the vacancy card renders `0 años de exp` and badges the vacancy as `[ JR ]`, despite the original posting requiring `2 años de experiencia` in its "Requerimientos" list.

## Reproduction

1. Scrape Computrabajo for "programador" or inspect the vacancy "Programador y Desarrollo Web/Sistemas" at Fun Shoes (`/ofertas-de-trabajo/oferta-de-trabajo-de-programador-y-desarrollo-websistemas-soporte-tecnologico-en-leon-B58AE6D77CC23E8B61373E686DCF3405`).
2. Observe that the original Computrabajo offer page splits content into:
   - `<p class="mbB">`: Narrative job description (responsibilities and duties).
   - `<ul class="disc mbB">`: Structured requirements list including `<li>2 años de experiencia</li>`.
3. In `ComputrabajoScraper.enrich_with_full_descriptions()` and `fetch_full_description()`, the scraper evaluates `soup.select_one("p.mbB") or soup.select_one("div.box_border p.fs16") or soup.select_one("div.box_detail") or soup.select_one("div.box_border")`.
4. Because `p.mbB` matches first, the scraper only extracts the narrative paragraph and completely discards `<ul class="disc">` (the requirements section).
5. As a result, `v.description` lacks any mention of "2 años de experiencia".
6. `SeniorityClassifier.classify_fast()` receives the truncated text; finding no explicit years of experience and no seniority keywords in the title, it falls back to Rule 11 ("Ambiguous / Neutral Default"), assigning `SeniorityLevelEnum.JUNIOR` and `years_required_min = 0`.
7. The vacancy card renders `💼 0 años de exp` and `[ JR ]`.

## Suspected Code Paths

- `backend/src/mishoojobs/services/scrapers/computrabajo.py:159-166`: `fetch_full_description()` prioritizes `soup.select_one("p.mbB")` before considering the parent container or requirements list, truncating the description before `<ul class="disc">`.
- `backend/src/mishoojobs/services/scrapers/computrabajo.py:189-208`: `enrich_with_full_descriptions()` uses the same narrow selector `soup.select_one("p.mbB")`, updating `v.description` and calling `classify_seniority_fast(v.title, full_text)` without the requirements block.
- `backend/src/mishoojobs/services/seniority_classifier.py:234-242`: When text is missing experience requirements and the title has no seniority markers, Rule 11 defaults to `junior` and `years_required_min: 0`.
- `backend/src/mishoojobs/api/routes/vacancies.py:83-95, 271-283`: `evaluate_vacancy` and `audit_vacancy_seniority` call `ComputrabajoScraper.fetch_full_description()`, propagating the truncated text to on-demand AI evaluation and PostgreSQL caching.

## Root Cause Hypothesis

Computrabajo structures its vacancy detail page by placing the narrative text inside `<p class="mbB">` and the candidate requirements inside sibling elements: `<p class="fwB fs18 mtB mb10">Requerimientos</p>` followed by `<ul class="disc mbB"><li class="mb10">...</li></ul>`.
`ComputrabajoScraper.fetch_full_description()` and `enrich_with_full_descriptions()` select `soup.select_one("p.mbB")` as their primary choice in a short-circuiting `or` expression. Because `p.mbB` exists, the scraper stops immediately without selecting the container (`div[div-link="oferta"]` or `div.box_detail`) or the requirements `<ul>`.
Consequently, the extracted description lacks all requirement bullets, including minimum experience years (`"2 años de experiencia"`). When `SeniorityClassifier.classify_fast()` processes this text, it finds 0 experience markers and defaults the vacancy to `years_required_min = 0` and `seniority_level = JUNIOR`.
Confidence: High (reproduced live with the exact FUN SHOES offer URL and HTML fixture).

## Proposed Remediation

**Preferred**:
Update `ComputrabajoScraper.fetch_full_description()` and `enrich_with_full_descriptions()` in `backend/src/mishoojobs/services/scrapers/computrabajo.py` to extract the full offer content including requirements:
1. Target the offer container `soup.select_one("div[div-link='oferta']")` or `soup.select_one("div.box_detail")` when available, removing noisy UI elements (e.g. `.posSticky_m`, `div.opt_dots`, `.box_show_offer`, `nav`, and action button containers) before extracting text.
2. Alternatively/additionally, if extracting via `p.mbB`, also find requirements in `soup.select_one("ul.disc, ul.disc.mbB, ul[class*='disc']")` (or `ul` following "Requerimientos") and append them into the description string (e.g. `full_text = f"{desc_body}\n\nRequerimientos:\n{reqs_text}"`).
3. Ensure that `classify_seniority_fast(v.title, full_text)` receives this combined text. `SeniorityClassifier.extract_years_required()` already possesses the regex pattern (`plus_match = re.search(r"(\d+)\+?\s*a[ñn]os?\s*(?:de\s*)?experiencia", norm)`) to extract `2` from `"2 años de experiencia"` and properly classify the job as `MID` with `years_required_min = 2`.

**Alternatives**:
- In `SeniorityClassifier`, treat vacancies with zero experience specified in text and ambiguous titles as unknown/unverified rather than defaulting `years_required_min` to 0. (Trade-off: Would leave vacancies without a clean numerical experience pill, whereas fixing the scraper preserves accurate data extraction across all Computrabajo listings).

**Files likely to change**:
- `backend/src/mishoojobs/services/scrapers/computrabajo.py`
- `backend/tests/unit/test_scrapers.py`
- `backend/tests/fixtures/computrabajo_raw.html` (or new offer fixture `computrabajo_offer_detail.html`)

**Tests to add or update**:
- Add offline unit test in `backend/tests/unit/test_scrapers.py` asserting that `ComputrabajoScraper.fetch_full_description()` and `enrich_with_full_descriptions()` retain the "Requerimientos" list (`"2 años de experiencia"`).
- Assert that `v.years_required_min == 2` and `v.seniority_level == SeniorityLevelEnum.MID` (or triggers Fake Junior discrepancy if title claims Junior).

## Risks & Considerations

- **Scraping Selectors Stability**: Computrabajo may alter container class names over time (`div[div-link="oferta"]` vs `div.box_detail`). Using a multi-tier selector or appending `ul.disc` ensures resilience.
- **Description Cleanliness**: When extracting the broader container, ensure interactive action buttons ("Postularme", "Avísame con ofertas similares") are stripped to avoid cluttering the job details view and AI evaluation prompt.

## Open Questions

None. The bug is reproducible and the root cause verified against live Computrabajo markup.
