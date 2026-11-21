# Bug Assessment: Customized CV Button Missing from Vacancy Description

- **Slug**: cv-customized-button
- **Created**: 2026-11-20T13:45:00-06:00
- **Source**: pasted text
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

> In each vacancy descripction the button about create a CV customized for the vacancy does not appear slug=cv-customized-button

The user reports that when viewing the description of any job vacancy, the button allowing them to create a customized CV adapted for that specific vacancy is missing.

## Symptom

When a candidate selects any vacancy to inspect its description in either the desktop split layout or the mobile bottom sheet (`VacancyDetailPane`), there is no button or action to generate or adapt a tailored CV for the vacancy. The user expects a direct, 1-click action ("Adaptar mi CV a esta vacante" / "Generar CV Adaptado") to trigger `VacancyTailorModal` from the vacancy description view.

## Reproduction

1. Start the frontend application (`npm run dev`) and navigate to the job discovery view (`http://localhost:5173`).
2. Search or select any job vacancy from the left column feed (`VacancyList`).
3. Notice that the right detail pane (`VacancyDetailPane`) defaults to the "Descripción" tab (`activeTab === "description"`).
4. Review the "Descripción" content and the sticky bottom action bar: observe that only "Postularme ahora", "Guardar", and "Ya postulé" appear; there is no button to generate or adapt a tailored CV.
5. Switch to the "Evaluación AI" tab: observe that unless the candidate explicitly clicks "Evaluar con IA (agy)" and waits for the AI evaluation request to complete, the button remains hidden.

## Suspected Code Paths

- `frontend/src/components/VacancyDetailPane.tsx:545-555` — `tailor-cv-btn` is conditionally nested strictly inside the `activeTab === "ai_eval"` block and guarded by `{evaluation ? ... : ...}`, making it completely inaccessible from the default "Descripción" tab or before running an AI evaluation.
- `frontend/src/components/VacancyDetailPane.tsx:570-639` — The persistent sticky bottom action bar contains `primaryLink` ("Postularme ahora"), `onSave` ("Guardar"), and `onMarkApplied` ("Ya postulé"), but omits the tailored CV action (`onOpenTailorModal`).
- `frontend/src/components/VacancyDetailPane.tsx:315-374` — The "Descripción" tab content renders the structured job description and requirements but provides no in-flow action or callout to adapt a CV.
- `frontend/tests/components/VacancyDetailPane.test.tsx:158-174` — Unit tests only test `tailor-cv-btn` when mounted with `initialTab="ai_eval"` and an existing `cachedEvaluation`, missing coverage for the default description view.

## Root Cause Hypothesis

During Feature 007 (`007-modern-jobs-ui`), the legacy `VacancyDetailModal.tsx` was replaced by the split master-detail `VacancyDetailPane.tsx` with a 2-tab layout ("Descripción" vs "Evaluación AI"). In the legacy modal, the "Generar CV Adaptado" button was permanently placed in the modal footer bar alongside application links. During the redesign into `VacancyDetailPane.tsx`, the `tailor-cv-btn` button was relocated exclusively into Tab 2 ("Evaluación AI") and placed inside the post-evaluation block (`{evaluation ? ... : ...}`). However, the CV tailoring modal (`VacancyTailorModal`) does not depend on an AI match evaluation—it only requires the vacancy details and the candidate's `MasterProfile`. By gating the button behind Tab 2 and completed AI evaluations, the feature was accidentally removed from the default vacancy description and persistent action bar. (Confidence: High)

## Proposed Remediation

**Preferred**:
Integrate the "Adaptar CV" / "Crear CV Adaptado" action into the **sticky bottom action bar** of `VacancyDetailPane.tsx` (adjacent to "Postularme ahora"), and optionally complement it with a dedicated callout/button in the "Descripción" tab.
1. In `VacancyDetailPane.tsx`'s sticky bottom action bar, render a prominent CTA button when `onOpenTailorModal` is provided (e.g. `data-testid="tailor-cv-btn"` with a `Sparkles` icon and text "Adaptar CV").
2. This ensures the action is always visible and 1-click accessible at all times regardless of which tab is active ("Descripción" or "Evaluación AI"), regardless of scroll depth, and across both desktop split pane and mobile Vaul drawer.
3. Keep the secondary in-tab button in "Evaluación AI" as a convenience or retain it as an alternative entry point, ensuring `data-testid="tailor-cv-btn"` is accessible in the default view.
4. Apply Emil Kowalski design engineering principles: ensure crisp styling (`bg-slate-900 hover:bg-slate-800 text-white` or complementary high-contrast button styling), smooth micro-interactions (`active:scale-[0.99]`), and clear affordance.

**Alternatives**:
- *Alternative 1*: Place the button exclusively at the bottom of the "Descripción" tab content (below `JobDescriptionViewer`).
  - *Trade-off*: Long job descriptions push the button off-screen, requiring the user to scroll through the entire text to find it, and mobile drawer users would have to scroll through lengthy content. The sticky bottom action bar provides superior ergonomics.

**Files likely to change**:
- `frontend/src/components/VacancyDetailPane.tsx`
- `frontend/tests/components/VacancyDetailPane.test.tsx`

**Tests to add or update**:
- Update `frontend/tests/components/VacancyDetailPane.test.tsx` to verify:
  1. `data-testid="tailor-cv-btn"` is rendered and visible by default (`initialTab="description"` or default props) without requiring `cachedEvaluation`.
  2. Clicking `tailor-cv-btn` from the default description view immediately calls `onOpenTailorModal(mockVacancy)`.
  3. Verify that `tailor-cv-btn` is rendered in both desktop and mobile drawer modes (`isMobileSheet={true}`).

## Risks & Considerations

- **Visual Balance in Bottom Action Bar**: On smaller screens or mobile viewports, the bottom bar already contains "Postularme ahora", "Guardar", and "Ya postulé". The button layout must be responsive (e.g., flex-col on mobile or compact icon+label pills) so it does not crowd out direct application links or overflow horizontally.
- **Button testid consistency**: Ensure `data-testid="tailor-cv-btn"` remains backward-compatible with existing tests in `VacancyDetailPane.test.tsx`.

## Open Questions

- None. The feature contracts in `specs/005-master-profile-cv` and `specs/007-modern-jobs-ui` clearly state that CV tailoring is an instant 1-click action from any vacancy.
