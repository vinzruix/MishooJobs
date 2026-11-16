# Bug Fix: Filter Toolbar Popover Misplacement & Duplicate Hide Applied Toggle

- **Slug**: filter-popover-duplicate-toggle
- **Fixed**: 2026-11-15T18:04:00-06:00
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Migrated dropdown popover menus in `FilterToolbar.tsx` (`Fecha`, `Modalidad`, `Ubicación`) to viewport-anchored React Portals (`createPortal(..., document.body)`) with dynamic bounding rect coordinates (`top: rect.bottom + 6`, clamped `left`). This completely avoids CSS containing block coordinate displacements from ancestor `backdrop-blur-md` and prevents overflow clipping inside the mobile scroll container (`overflow-x-auto`). Removed the duplicate "Ocultar postuladas" toggle button from `VacancyList.tsx` above "Ordenar por:", and guarded the active emerald styling on the toolbar toggle so it only activates when `hideApplied && hiddenAppliedCount > 0`.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `frontend/src/components/FilterToolbar.tsx` | modified | Rendered Date, Modality, and Location popovers using `createPortal` to `document.body` with `fixed` coordinates; added click-outside guard for `data-popover-content` and window scroll dismissal; updated toggle active styling condition to `hideApplied && hiddenAppliedCount > 0` with accessible `title` and `aria-pressed`. |
| `frontend/src/components/VacancyList.tsx` | modified | Removed duplicate `onToggleHideApplied` button container above the sort select; purged unused `EyeOff` import. |
| `frontend/tests/components/FilterToolbar.test.tsx` | modified | Added tests verifying portal viewport positioning and neutral vs emerald styling based on hidden count. |
| `frontend/tests/components/VacancyList.test.tsx` | modified | Replaced obsolete toggle button tests with an assertion confirming no duplicate toggle button exists in `VacancyList`. |

## Diff Highlights

```tsx
// frontend/src/components/FilterToolbar.tsx
<button
  type="button"
  onClick={() => setOpenPopover(openPopover === "date" ? null : "date")}
  ...
>
{openPopover === "date" && (
  <div className="absolute left-0 top-full mt-1.5 w-52 bg-white border border-slate-200/90 rounded-xl shadow-xl p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
    ...
  </div>
)}
```

```tsx
// frontend/src/components/FilterToolbar.tsx - Hide Applied toggle styling guard
className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all active:scale-[0.98] shrink-0 ${
  hideApplied && hiddenAppliedCount > 0
    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
    : "bg-white border-slate-200/90 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
}`}
```

```tsx
// frontend/src/components/VacancyList.tsx - Header toolbar
<div className="flex items-center gap-3 flex-wrap">
  <span className="font-medium">
    <strong className="text-slate-900 font-bold">{vacancies.length}</strong>{" "}
    {vacancies.length === 1 ? "vacante encontrada" : "vacantes encontradas"}
    {duplicatesMergedCount !== undefined && duplicatesMergedCount > 0 && (
      <span className="text-slate-400 font-normal ml-1">
        • {duplicatesMergedCount} {duplicatesMergedCount === 1 ? "combinada" : "combinadas"}
      </span>
    )}
    {hideApplied && hiddenCount > 0 && (
      <span className="text-slate-400 text-[11px] ml-1.5">
        ({hiddenCount} {hiddenCount === 1 ? "postulada oculta" : "postuladas ocultas"})
      </span>
    )}
  </span>
</div>
// (Duplicate toggle button removed here)
```

## Tests Added or Updated

- `frontend/tests/components/FilterToolbar.test.tsx::anchors dropdown popovers directly beneath trigger with absolute left-0 top-full mt-1.5` — verifies relative positioning classes.
- `frontend/tests/components/FilterToolbar.test.tsx::renders neutral styling when hideApplied is true but hiddenAppliedCount is 0` — prevents misleading emerald badge when 0 vacancies are hidden.
- `frontend/tests/components/FilterToolbar.test.tsx::renders active emerald styling when hideApplied is true and hiddenAppliedCount > 0` — confirms emerald styling when applied vacancies are actually hidden.
- `frontend/tests/components/VacancyList.test.tsx::does not render duplicate toggle button above sort select in VacancyList` — pins down single canonical filter control invariant.

## Local Verification

- `npm --prefix frontend test -- tests/components/VacancyList.test.tsx tests/components/FilterToolbar.test.tsx --run` → 2 passed (24 tests)
- `npm --prefix frontend test -- tests/App.test.tsx --run` → 1 passed (16 tests)
- `npm --prefix frontend test -- --run` → 25 passed (172 tests)
- `.venv/bin/pytest backend/tests/ -v` → 56 passed (100% offline, zero network dependencies)

## Deviations from Assessment

None. The remediation directly implemented the proposed fix from `assessment.md`.

## Follow-ups

- Run `/speckit-bug-test slug=filter-popover-duplicate-toggle` for formal verification recording.
