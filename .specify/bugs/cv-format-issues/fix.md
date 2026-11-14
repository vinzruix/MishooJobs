# Bug Fix: CV PDF Print Cutting, Multi-Page Header Support & Missing Certificates in Executive Template

- **Slug**: cv-format-issues
- **Fixed**: 2026-11-10T20:25:35-06:00
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Fixed CV PDF printing isolation, single/two-page Letter calibration, and template completeness across all three built-in CV templates. Overflowing CVs now paginate cleanly across two discrete Letter sheets with the candidate header repeated on both pages and zero cut content or leaked application footers, while `ModernExecutive` now renders certificates, academic achievements, languages, and profile links.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `frontend/src/App.tsx` | modified | Added `no-print print:hidden` to `<footer>` and `print:min-h-0 print:p-0 print:max-w-none print:block` to outer shell and `<main>` so the MishooJobs footer and app padding never leak into printed PDFs |
| `frontend/src/components/LiveCVViewer.tsx` | modified | Hid `footer` in `@media print`, added `.cv-page-break` and `print-color-adjust: exact`, added `print:block print:overflow-visible`, replaced passive `> 1080px` warning with interactive 2-page mode status (`two-page-info-badge`) and toggle (`Vista 1 página` / `Activar 2 páginas`) |
| `frontend/src/services/cv_pagination.ts` | added | Extracted shared DOM block height measurement hook (`useCVPagination`) and pure greedy packer (`computeColumnSplit`) calibrated to US Letter printable height (`976px` / `10.2in`) with heading-item coupling and collapse hysteresis |
| `frontend/src/components/templates/CVPageSheet.tsx` | added | Extracted shared calibrated US Letter page wrapper (`8.5in` width, `0.4in` screen padding matching `@page` margins, `print:min-h-0 print:p-0`) and screen-only Page 2 separator |
| `frontend/src/components/templates/TechnicalHighDensity.tsx` | modified | Integrated `CVPageSheet` + `useCVPagination` with repeated Page 2 header (`data-cv-header="p2"`), `break-inside-avoid`/`break-after-avoid` guards, full-width single/pair certificate rendering when `logros_academicos` is empty, and full-width Page 2 layout without orphaned `col-span-4` `border-r` |
| `frontend/src/components/templates/ClassicATS.tsx` | modified | Integrated `CVPageSheet` + `useCVPagination` with repeated Page 2 header, calibrated margins/spacing, `break-inside-avoid`/`break-after-avoid` guards, full-width certs when logros are absent, and added `languages` rendering |
| `frontend/src/components/templates/ModernExecutive.tsx` | modified | Added rendering for `certificates`, `logros_academicos`, `languages`, and `header.links`; changed `md:grid-cols-2` to `sm:grid-cols-2 print:grid-cols-2` so print (`7.7in`) preserves 2-column project cards; integrated `CVPageSheet` + `useCVPagination` with repeated dark banner header on Page 2 |
| `frontend/tests/services/cv_pagination.test.ts` | added | Added unit tests for `computeColumnSplit` (single-page fit, heading-item coupling, `continuedSections`, and collapse hysteresis) |
| `frontend/tests/components/LiveCVViewer.test.tsx` | modified | Added tests for `ModernExecutive` certificates/logros/languages/links, print CSS hiding `footer` and `print:min-h-0`, and 2-page splitting with repeated candidate headers across all 3 templates plus mode toggling |
| `frontend/tests/App.test.tsx` | modified | Added test confirming the `App` footer has `no-print` and `print:hidden` |

## Diff Highlights

```tsx
// frontend/src/App.tsx
<footer className="no-print print:hidden border-t border-zinc-900 py-3 px-4 text-center text-xs text-zinc-600">
  MishooJobs • Desarrollado para juniors y estudiantes en México • Moneda MXN ($)
</footer>
```

```ts
// frontend/src/services/cv_pagination.ts
export const PRINTABLE_PAGE_HEIGHT_PX = 976; // 10.2in (11in - 0.8in @page margin) at 96 DPI
export const COLLAPSE_HYSTERESIS_PX = 8;
```

```tsx
// frontend/src/components/templates/CVPageSheet.tsx
<div
  data-cv-page={pageNumber}
  className={`cv-page bg-white text-zinc-900 ${fontClassName} w-[8.5in] max-w-full min-h-[11in] p-[0.4in] mx-auto shadow-md select-text print:w-full print:max-w-full print:min-h-0 print:p-0 print:shadow-none ${
    pageNumber === 1 && totalPages > 1 ? "cv-page-break" : ""
  } ${className}`}
>
```

## Tests Added or Updated

- `frontend/tests/services/cv_pagination.test.ts` (4 tests) — Pins down `computeColumnSplit` single-page threshold, heading+first-item coupling, `continuedSections` tracking, and collapse hysteresis.
- `frontend/tests/components/LiveCVViewer.test.tsx` (3 new tests, 8 total) — Verifies `ModernExecutive` renders `certificates`, `logros_academicos`, `languages`, and `header.links`; verifies print CSS rules hide `footer` and drop `min-h-[11in]`; verifies overflowing CVs split cleanly onto 2 pages with repeated candidate headers across all 3 templates and interactive 1-page/2-page toggling.
- `frontend/tests/App.test.tsx` (1 new test, 9 total) — Verifies the MishooJobs `<footer>` carries `no-print` and `print:hidden`.

## Local Verification

- Commands run:
  - `cd frontend && npm test -- --run` → 19 test files passed, 122 tests passed (offline Vitest + jsdom).
  - `cd frontend && npm run build` → `tsc && vite build` succeeded with 0 TypeScript or bundle errors.
- Manual checks:
  - Verified print media CSS hides `header, nav, footer, .no-print`, removes `min-h-screen`/`min-h-[11in]` on print, and applies `break-after: page` between Page 1 and Page 2 sheets.

## Deviations from Assessment

- Added two small shared helper files (`frontend/src/services/cv_pagination.ts` and `frontend/src/components/templates/CVPageSheet.tsx`) plus `frontend/tests/services/cv_pagination.test.ts` and a 1-test addition to `frontend/tests/App.test.tsx` rather than duplicating pagination state and US Letter sheet markup inside all three template components.
- For `TechnicalHighDensity`, Page 2 repeats a compact candidate identity header (Name, Headline, Email/Phone/Location, optional compact photo) rather than duplicating the multi-line `about_me` summary paragraph, preserving space for overflow sections; `ClassicATS` and `ModernExecutive` repeat their full identity/contact headers cleanly on Page 2.
- 2-page paginated layout activates automatically whenever content exceeds 1 printable Letter page (`976px`), with an interactive `Vista 1 página` / `Activar 2 páginas` toggle in the status bar.

## Follow-ups

- Update `GEMINI.md` conventions log with the calibrated 2-page CV print sheet & repeated-header pagination convention during subsequent maintenance or spec updates.
- Visually inspect a saved PDF in the browser (`Descargar PDF` -> Save as PDF) across Chrome/Safari with a populated 2-page CV to confirm exact printer margin rendering.
