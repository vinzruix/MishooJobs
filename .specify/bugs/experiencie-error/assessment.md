# Bug Assessment: Vacancies with Unspecified Experience Default to 0 Years and Lack Unknown Experience Tag

- **Slug**: experiencie-error
- **Created**: 2026-11-16T16:20:00Z
- **Source**: pasted text and uploaded screenshot (`media_1794867316973_8212f7c2.jpg`)
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

The user reported:
> "When the vacancy does not explain or u do not find the experience required plase add a tag like experience required unknown or something similar slug=experiencie-error"

Attached screenshot (`media_1794867316973_8212f7c2.jpg`):
1. Left pane (VacancyCard):
   - Company: "BESIT SC", portal OCC.
   - Title: "Desarrollador Fullstack (Java con Angular / Sueldo libre: 45,000)".
   - Badges & Metadata: `41% Match`, `[ JR ]`, `PRESENCIAL`, `Tlalpan, CDMX`, `$45,000 MXN /mensual`, `💼 0 años de exp`, `Angular`, `Java`.
2. Right pane (VacancyDetailPane / PastelMetricGrid):
   - Metric card 1: `SALARIO: $45,000 MXN/m... / Sueldo base`
   - Metric card 2: `MODALIDAD: Presencial / En sitio`
   - Metric card 3: `EXPERIENCIA: 0 años / Sin experiencia previa`
   - Metric card 4: `NIVEL: Junior / Nivel inicial`
   - Job description: Requires Full Stack Java + Angular (Indispensable), Oracle DB, batch processes (desirable), Kafka (desirable), Law benefits, $45k net salary, university degree/cédula (Indispensable). The description contains zero mention of required years of experience.

## Symptom

When a job posting does not mention, explain, or require a specific number of years of experience (such as high-compensation positions that require specific skills and a university degree without stating required years), the platform defaults the vacancy to `years_required_min: 0` and `seniority_level: JUNIOR`.

Consequently:
1. `VacancyCard` renders `💼 0 años de exp` and badges the vacancy with `[ JR ]`.
2. `PastelMetricGrid` renders `EXPERIENCIA: 0 años` with subtext `Sin experiencia previa`.
3. There is no tag or badge indicating that the experience requirement was omitted, unspecified, or unknown in the original posting.
4. Candidates looking for genuine 0-experience entry roles are misled into believing that mid/senior or high-salary roles with unstated requirements do not require prior professional experience.

## Reproduction

1. Ingest or scrape an OCC listing such as "BESIT SC - Desarrollador Fullstack (Java con Angular / Sueldo libre: 45,000)" or simulate a vacancy with description:
   ```text
   Conocimiento: Desarrollador Full Stack con enfoque en Java y Angular (Indispensable). Conocimiento en base de datos Oracle... Contar con título o cédula universitario. (Indispensable)
   ```
2. Observe `SeniorityClassifier.extract_years_required(text)`:
   - Neither the title nor the description matches any positive years regex (`mínimo X años`, `X+ años de experiencia`) or zero-experience regex (`sin experiencia`, `recién egresado`, `0 años`).
   - The method returns `None`.
3. Observe `SeniorityClassifier.classify_fast(title, text)`:
   - The title does not match senior, mid, academic, or entry patterns.
   - Execution falls through to Rule 11 ("Ambiguous / Neutral Default (FR-014)"):
     ```python
     return {
         "seniority_level": SeniorityLevelEnum.JUNIOR,
         "years_required_min": 0,
         "is_real_first_job": False,
         "audit_status": AuditStatusEnum.PRELIMINARY,
         "reasoning": "Posición con requisitos abiertos sin años especificados; asignada preliminarmente a Junior.",
         "has_discrepancy": False,
     }
     ```
   - It sets `years_required_min: 0` despite finding no evidence of a 0-experience requirement.
4. Inspect frontend rendering:
   - `frontend/src/services/date_utils.ts`: `formatExperienceRequired(0)` returns `"0 años de exp"`.
   - `frontend/src/components/PastelMetricGrid.tsx`: Because `vacancy.years_required_min === 0`, it overrides the initial `"Sin especificar"` with `expValue = "0 años"` and `expSubtext = "Sin experiencia previa"`.
   - `frontend/src/components/VacancyCard.tsx`: Displays `[ JR ]` and `💼 0 años de exp` without any badge or indicator for unstated experience.

## Suspected Code Paths

- `backend/src/mishoojobs/services/seniority_classifier.py:237-245`: Rule 11 in `classify_fast()` defaults `years_required_min` to `0` when experience is unspecified and title is neutral.
- `backend/src/mishoojobs/schemas/job.py:133`: `JobVacancy` schema defaults `years_required_min` to `0` with `ge=0` rather than allowing a nullable `Optional[int] = None` or including an `experience_unspecified` flag.
- `backend/src/mishoojobs/models/vacancy.py:52-56`: Database column `years_required_min` has `nullable=False, default=0` with `ck_vacancies_years_required_min`.
- `frontend/src/services/date_utils.ts:250-256`: `formatExperienceRequired` treats `null`, `undefined`, and `<= 0` identically as `"0 años de exp"`.
- `frontend/src/components/PastelMetricGrid.tsx:40-55`: Branches on `vacancy.years_required_min === 0`, displaying `"0 años"` and `"Sin experiencia previa"` even when experience is unverified or unspecified.
- `frontend/src/components/VacancyCard.tsx:144-182, 200-204`: Lacks an `[ EXP. NO ESPECIFICADA ]` badge and always formats `vacancy.years_required_min` as numerical experience.

## Root Cause Hypothesis

The system treats `years_required_min: 0` as both a numerical value (0 years required) and as a fallback sentinel when experience is completely omitted or absent from the vacancy text. Because neither the schema nor the classification output distinguishes between an explicit 0-experience requirement (`is_real_first_job: True` / "sin experiencia previa") and an unstated/unspecified experience requirement, the frontend has no deterministic way to display "Exp. no especificada" and instead renders "0 años de exp" and "Sin experiencia previa" for every ambiguous listing.

Confidence: High. Verified through `SeniorityClassifier.classify_fast` implementation, fixture tests, and frontend components.

## Proposed Remediation

**Preferred**:
1. **Schema & Classification (`backend/`):**
   - In `backend/src/mishoojobs/services/seniority_classifier.py`:
     - Distinguish between explicit zero experience (e.g. `is_real_first_job: True` or explicit `0` from `ZERO_EXP_PATTERNS`) and unstated experience.
     - In Rule 11 (and any fallback where `years_min is None`), set `years_required_min: Optional[int] = None` (or add an explicit flag `experience_unspecified: bool = True`).
     - Update `JobVacancy` schema (`backend/src/mishoojobs/schemas/job.py`), `SeniorityAuditResult`, and `VacancyDTO` to allow `years_required_min: Optional[int] = None` and/or expose `experience_unspecified: bool = False`.
     - In `backend/src/mishoojobs/models/vacancy.py`, make `years_required_min` nullable (`nullable=True`) or preserve 0 in DB while relying on `experience_unspecified` or checking `years_required_min is None`.
2. **Helper Utilities & Formatting (`frontend/`):**
   - In `frontend/src/services/date_utils.ts`:
     - Update `formatExperienceRequired(years?: number | null, isUnspecified?: boolean): string`.
     - When `years == null` or `isUnspecified`: return `"Exp. no especificada"`.
     - When `years === 0`: return `"0 años de exp"`.
     - When `years === 1`: return `"1 año de exp"`.
     - When `years >= 2`: return `${years} años de exp`.
3. **UI Badges & Cards (`frontend/`):**
   - In `frontend/src/components/VacancyCard.tsx`:
     - In the badge row or metadata row, when experience is unspecified (e.g., `vacancy.years_required_min == null` or `vacancy.experience_unspecified || (vacancy.years_required_min === 0 && !vacancy.is_real_first_job && vacancy.seniority_level === 'junior' && !hasZeroExpMarker)`):
       - Render a tag: `<span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200/80" title="La vacante no especifica años de experiencia mínimos requeridos">[ EXP. NO ESPECIFICADA ]</span>`.
       - In the metadata row with `Briefcase` icon: display `"Exp. no especificada"`.
   - In `frontend/src/components/PastelMetricGrid.tsx`:
     - In block 3 (`EXPERIENCIA`):
       - When experience is unspecified:
         `expValue = "Sin especificar"`
         `expSubtext = "No detallada en vacante"`
       - Only display `"0 años"` and `"Sin experiencia previa"` when `vacancy.years_required_min === 0` and the listing is an authentic zero-experience role or explicitly mentions no experience required.

**Alternatives**:
- Pure client-side heuristic: If `vacancy.years_required_min === 0` and `!vacancy.is_real_first_job` and `vacancy.seniority_level === 'junior'` and `vacancy.reasoning` indicates open requirements or absence of zero-experience markers, treat experience as unspecified without changing backend database column. (Trade-off: Fast and avoids DB migration, but leaves backend DTOs carrying an inaccurate 0 instead of `None`).

**Files likely to change**:
- `backend/src/mishoojobs/services/seniority_classifier.py`
- `backend/src/mishoojobs/schemas/job.py`
- `backend/src/mishoojobs/schemas/evaluation.py`
- `backend/src/mishoojobs/models/vacancy.py` (if made nullable in DB)
- `frontend/src/types/job.ts`
- `frontend/src/services/date_utils.ts`
- `frontend/src/components/VacancyCard.tsx`
- `frontend/src/components/PastelMetricGrid.tsx`
- `backend/tests/unit/test_seniority_classifier.py`
- `frontend/tests/components/VacancyCard.test.tsx`
- `frontend/tests/components/PastelMetricGrid.test.tsx`
- `frontend/tests/services/date_utils.test.ts`

**Tests to add or update**:
- Backend:
  - Add unit test verifying that listings without experience markers return `years_required_min = None` (or `experience_unspecified = True`) under Rule 11.
  - Assert that explicit zero-experience vacancies retain `years_required_min = 0` and `is_real_first_job = True`.
- Frontend:
  - Update `date_utils.test.ts` testing `formatExperienceRequired(null)` and `formatExperienceRequired(undefined)` returning `"Exp. no especificada"`.
  - Add test in `VacancyCard.test.tsx` verifying that a vacancy with unstated experience renders the badge `[ EXP. NO ESPECIFICADA ]` and `"Exp. no especificada"`.
  - Add test in `PastelMetricGrid.test.tsx` verifying that unstated experience renders `"Sin especificar"` / `"No detallada en vacante"`.

## Risks & Considerations

- **Backward Compatibility in DB**: If `years_required_min` is made nullable in PostgreSQL, existing database records with default `0` should either remain or have a safe migration that leaves `ck_vacancies_years_required_min` intact (in SQL, `NULL >= 0` evaluates to unknown, which is valid for CHECK constraints).
- **Badge Clutter**: Ensure the new `[ EXP. NO ESPECIFICADA ]` badge adheres to the Emil Kowalski design system tokens (`bg-slate-100 text-slate-700 border border-slate-200/80`), keeping badge sizes consistent with existing `[ JR ]` and `[ 0 EXP ]` pills without causing visual wrapping or card layout breakage.

## Open Questions

None. The issue is clearly reproduced from the provided screenshot and codebase analysis.
