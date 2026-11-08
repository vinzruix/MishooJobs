# Bug Fix: Vacancy Card Header Badge Overflow & Awkward Wrapping

- **Slug**: vacancy-card-badge-overflow
- **Fixed**: 2026-11-08T02:16:45Z
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Streamlined badge labels and header layout in `frontend/src/components/VacancyCard.tsx`. Shortened verbose badges (`[ 0 EXP ]`, `[ ✓ 0 EXP ]`, `[ REQ. DISCREPANTES ]`), made the Fit Score badge a sleek single-line monospace pill (`{fitScore}% Match`), tightened `Nueva` badge padding, and applied `items-start` alignment with `min-w-0 flex-1` on the badge container to eliminate awkward second-row wrapping.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `frontend/src/components/VacancyCard.tsx` | modified | Replaced verbose preliminary/verified 0-exp labels with compact card variants (`[ 0 EXP ]`, `[ ✓ 0 EXP ]`); shortened discrepancy tag to `[ REQ. DISCREPANTES ]`; converted Fit Score badge to single-line whitespace-nowrap pill; applied `items-start`. |
| `frontend/tests/components/VacancyCard.test.tsx` | modified | Updated unit test assertions for `85% Match`, `[ REQ. DISCREPANTES ]`, `[ ✓ 0 EXP ]`, and `[ 0 EXP ]`. |

## Diff Highlights

```typescript
// frontend/src/components/VacancyCard.tsx
- <div className="flex items-center justify-between gap-2 mb-2">
-   <div className="flex flex-wrap items-center gap-1.5">
+ <div className="flex items-start justify-between gap-2 mb-2">
+   <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
...
-     <span>[ ✓ AUDITADO 0 EXP ]</span>
+     <span>[ ✓ 0 EXP ]</span>
...
-     <span>[ 0 EXP PRELIMINAR ]</span>
+     <span>[ 0 EXP ]</span>
...
-     [ REQUISITOS DISCREPANTES ]
+     [ REQ. DISCREPANTES ]
...
-   <div className={`px-2 py-0.5 rounded text-[11px] font-bold border ...`}>
-     {fitScore}% Compatibilidad
-   </div>
+   <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex-shrink-0 whitespace-nowrap ...`} title={`${fitScore}% de compatibilidad con tu perfil`}>
+     {fitScore}% Match
+   </div>
```

## Tests Added or Updated

- `frontend/tests/components/VacancyCard.test.tsx` — Updated assertions for:
  - `"85% Match"` (single-line compact fit score badge).
  - `"[ REQ. DISCREPANTES ]"` (shortened discrepancy warning).
  - `"[ ✓ 0 EXP ]"` and `"[ 0 EXP ]"` (compact card badges for verified and preliminary 0-experience listings).

## Local Verification

- Commands run:
  - `cd frontend && npm test -- --run` → 8 test files passed (57/57 tests passed in 1.45s).
  - `cd frontend && npm run build` → Production bundle built cleanly with 0 TypeScript errors.
  - `.venv/bin/pytest backend/tests/ -v` → 33/33 tests passed in 5.77s.
- Manual checks:
  - Verified on `http://localhost:5173` that card headers render `PRESENCIAL`, `[ 0 EXP ]`, `Nueva`, and `Fit Score` on a single horizontal line without breaking or pushing tags onto an orphaned second row.

## Deviations from Assessment

None. The implementation followed the preferred remediation outlined in `assessment.md`.

## Follow-ups

- Run `/speckit-bug-test slug=vacancy-card-badge-overflow` to record verification report.
