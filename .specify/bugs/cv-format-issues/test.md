# Bug Verification: CV PDF Print Cutting, Multi-Page Header Support & Missing Certificates in Executive Template

- **Slug**: cv-format-issues
- **Tested**: 2026-11-10T20:32:30-06:00
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

All reproduction scenarios pass after the fix: short CVs print cleanly on 1 Letter page without spurious Page 2 spills or footer leaks, overflowing CVs across all three templates (`TechnicalHighDensity`, `ClassicATS`, `ModernExecutive`) split cleanly onto 2 pages with the candidate header repeated on both pages and zero cut content, and `ModernExecutive` renders certificates, academic achievements, languages, and profile links. No regressions were introduced across the frontend test suite or TypeScript production build.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | Headless Chrome CDP (`Page.printToPDF` with `preferCSSPageSize: true`) against `vite preview` + `pypdf` inspection + `qlmanage` visual PNG review | pass | `short-dense.pdf` = 1 page; `rich-dense.pdf`, `rich-classic.pdf`, `rich-modern.pdf` = 2 pages each with candidate header on Page 1 & Page 2, certificates rendered on all 3 templates, zero cut items, zero orphaned `border-r`, and `has_app_footer=False` on all pages |
| New / updated tests | `cd frontend && npm test -- --run` (covering `tests/services/cv_pagination.test.ts`, `tests/components/LiveCVViewer.test.tsx`, `tests/App.test.tsx`) | pass | 4 pagination unit tests, 8 `LiveCVViewer` tests, and 9 `App` tests all passed |
| Regression suite | `cd frontend && npm test -- --run` (full Vitest suite) | pass | 19 test files passed, 122 tests passed |
| Lint / type-check | `cd frontend && npm run build` (`tsc && vite build`) | pass | TypeScript type-check and Vite production bundle succeeded with exit code 0 |

## Output Excerpts

```text
# Headless Chrome Page.printToPDF + pypdf verification (scratch/verify_cv_pdf.mjs)
Short Dense State: {"pages":1,"twoPageBadge":false,"overflowBadge":false}
Template rich-dense: {"pageCount":2,"p1H":1056,"p2H":1056,"p1HasName":true,"p2HasName":true,"hasCerts":true,"twoPageBadge":true,"overflowBadge":false,"p2HasLeftCol":false}
Template rich-classic: {"pageCount":2,"p1H":1056,"p2H":1056,"p1HasName":true,"p2HasName":true,"hasCerts":true,"twoPageBadge":true,"overflowBadge":false,"p2HasLeftCol":false}
Template rich-modern: {"pageCount":2,"p1H":1056,"p2H":1056,"p1HasName":true,"p2HasName":true,"hasCerts":true,"twoPageBadge":true,"overflowBadge":false,"p2HasLeftCol":false}
=== rich-classic.pdf (2 pages) === Page 1: has_app_footer=False | Page 2: has_app_footer=False
=== rich-dense.pdf (2 pages) === Page 1: has_app_footer=False | Page 2: has_app_footer=False
=== rich-modern.pdf (2 pages) === Page 1: has_app_footer=False | Page 2: has_app_footer=False
=== short-dense.pdf (1 pages) === Page 1: has_app_footer=False
```

```text
# Frontend test suite & build
Test Files  19 passed (19)
     Tests  122 passed (122)
✓ built in 2.24s
```

## Residual Risks

- **ClassicATS Raw PDF Text Extraction Stream Order**: Visual inspection of `rich-classic.pdf.png` and `rich-classic-p2.pdf.png` confirms the header renders cleanly at the top of both pages, but `relative` CSS positioning on `ClassicATS`'s `data-cv-header` caused Chromium to emit header text nodes after static body nodes in `pypdf`'s raw `extract_text()` stream order. Replacing `relative` + `absolute` (`Pág. 2`) in `ClassicATS.tsx` with a normal static flex layout in a small follow-up would guarantee top-first ATS PDF stream extraction order as well.
- **Browser Engine Coverage**: Headless PDF verification exercised Chromium (`Google Chrome`); Safari (WebKit) and Firefox print engines were not run directly in this verification session, though standard CSS `break-after: page` / `break-inside: avoid` rules are in place.
- **2+ Page Overflow Boundary**: Automated splitting caps at 2 pages; profiles exceeding 2 full Letter pages display the `[PÁGINAS EXCEDIDAS]` warning advising bullet trimming.

## Recommendation

Close the bug — verified end-to-end across real Chromium PDF exports, visual page inspection, and all 122 offline frontend tests. (Optionally track replacing `relative` positioning in `ClassicATS.tsx`'s header as a minor ATS stream-order polish.)
