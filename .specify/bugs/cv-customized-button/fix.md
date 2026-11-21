# Bug Fix: Restore Customized CV Button to Vacancy Description & Persistent Action Bar

- **Slug**: cv-customized-button
- **Fixed**: 2026-11-20T21:32:00-06:00
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Restored the "Adaptar CV" button (`data-testid="tailor-cv-btn"`) to the persistent sticky bottom action bar of `VacancyDetailPane` and added a dedicated in-flow callout banner (`data-testid="desc-tailor-cv-btn"`) within the "Descripción" tab, ensuring candidates can trigger customized CV generation with 1 click directly from any job vacancy description.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `frontend/src/components/VacancyDetailPane.tsx` | modified | Added persistent "Adaptar CV" button to sticky action bar, added in-flow callout in "Descripción" tab, and disambiguated Tab 2 button with `data-testid="ai-eval-tailor-btn"` |
| `frontend/tests/components/VacancyDetailPane.test.tsx` | modified | Added test verifying `tailor-cv-btn` and `desc-tailor-cv-btn` in default description view, and verified Tab 2 `ai-eval-tailor-btn` |

## Diff Highlights

```tsx
// Sticky bottom action bar in VacancyDetailPane.tsx
<div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
  {primaryLink && (
    <a href={primaryLink.direct_url} data-testid="primary-apply-btn" ...>
      <span>Postularme ahora</span>
    </a>
  )}

  {onOpenTailorModal && (
    <button
      type="button"
      data-testid="tailor-cv-btn"
      onClick={() => onOpenTailorModal(vacancy)}
      className="flex-1 sm:flex-initial py-2.5 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/80 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.99] whitespace-nowrap"
      title="Adaptar mi CV a esta vacante"
    >
      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
      <span>Adaptar CV</span>
    </button>
  )}
</div>
```

## Tests Added or Updated

- `frontend/tests/components/VacancyDetailPane.test.tsx::renders tailor CV button in default description view and triggers onOpenTailorModal` — Verifies that `tailor-cv-btn` is rendered in the sticky action bar and `desc-tailor-cv-btn` is in the description content during the default view without requiring prior AI evaluation, and that clicking either triggers `onOpenTailorModal`.
- `frontend/tests/components/VacancyDetailPane.test.tsx::renders cached AI evaluation results and triggers tailor CV callback` — Verifies that both the primary action bar `tailor-cv-btn` and Tab 2 in-flow `ai-eval-tailor-btn` trigger `onOpenTailorModal`.

## Local Verification

- Commands run:
  - `cd frontend && npx vitest run tests/components/VacancyDetailPane.test.tsx` → 11 tests passed (100% pass)
  - `cd frontend && npm test -- --run` → 175 tests in 25 test files passed (100% pass)
- Manual checks:
  - Verified button rendering and responsiveness for both desktop split layout and mobile bottom sheet.
  - Verified z-index stacking and modal invocation contracts with `VacancyTailorModal`.

## Deviations from Assessment

None. The fix followed the preferred remediation to embed the button in the sticky bottom action bar while also adding the in-tab callout in the job description section.

## Follow-ups

- None required. Run `/speckit-bug-test slug=cv-customized-button` to validate the fix.
