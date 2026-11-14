# Bug Verification: CV PDF generation renders glyphs as non-copyable Type3 outlines

- **Slug**: pdf-image
- **Tested**: 2026-11-10T21:09:50-06:00
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The bug no longer reproduces across Google Chrome or Brave Browser on `frontend/dist`. All three CV templates (`TechnicalHighDensity`, `ClassicATS`, and `ModernExecutive`) now emit exclusively standard embedded TrueType `/Type0` vector fonts (`0` `/Type3` glyph drawings), temporarily disable `contentEditable` during `window.print()`, and extract clean, unfragmented, copyable multi-word Spanish and ASCII text in both `pdfjs-dist` and native macOS `PDFKit`.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix: Chrome & Brave CDP PDF) | `.venv/bin/python .../verify_bug_test.py` against rebuilt `frontend/dist` | pass | Tested all 3 templates (`technical`, `classic`, `modern`) in both Google Chrome and Brave Browser: `0` `/Type3` fonts in all 6 PDFs; live `print-pdf-btn` click verified `contenteditable` transitions `true` -> `false` during print and restores `true` on `afterprint` |
| Reproduction (post-fix: `pdfjs-dist` text extraction) | `node --input-type=module` (`pdfjs-dist` `legacy/build/pdf.mjs`) on all 6 PDFs | pass | Extracted `59` (`technical`), `60` (`classic`), and `57` (`modern`) contiguous items with `missing=[]` for multi-word accented phrases (`Computación`, `Implementé`, `México`) |
| Reproduction (post-fix: macOS `PDFKit` copyability) | `/usr/bin/swift` (`PDFDocument`, `page.selection(for: bounds)`, `doc.findString`) on all 6 PDFs | pass | Full-page selection (`825`/`883`/`842` chars) and `findString` matched candidate name, headline, and experience bullets across all 6 PDFs with zero broken glyph splitting (`1` `U+FFFC` in `technical`/`modern` corresponds solely to the embedded avatar `<img>` PNG; `0` in `classic`) |
| New / updated tests | `cd frontend && npx vitest run tests/components/LiveCVViewer.test.tsx --reporter=verbose` | pass | `10/10` tests passed in `LiveCVViewer.test.tsx` (`169ms` tests, `1.09s` total), covering print-safe font stacks, print CSS resets, `shadow-xs` removal, and synchronous `contentEditable` toggle |
| Regression suite | `cd frontend && npm test -- --run` | pass | `19/19` test files, `124/124` tests passed (`2.62s`), exit code `0` |
| Type-check & production build | `cd frontend && ./node_modules/.bin/tsc --noEmit` & `cd frontend && npm run build` | pass | `tsc --noEmit` exited `0`; `vite build` transformed `2186` modules into `frontend/dist` in `1.65s` |
| Lint check | `frontend/package.json` scripts inspection | skipped | No `lint` script configured in `frontend/package.json` (only `dev`, `build`, `preview`, `test`) |

## Output Excerpts

```text
LiveCVViewer.test.tsx:
 ✓ tests/components/LiveCVViewer.test.tsx (10 tests) 169ms
   ✓ enforces print-safe TrueType font stacks and vector-friendly print CSS rules 5ms
   ✓ disables contentEditable synchronously during window.print and toggles via beforeprint/afterprint 9ms

Frontend full suite + build:
 Test Files  19 passed (19)
      Tests  124 passed (124)
✓ 2186 modules transformed.
✓ built in 1.65s

Chrome & Brave CDP Page.printToPDF + pypdf + pdfjs-dist + macOS PDFKit:
{'beforeClick': 'true', 'duringPrint': 'false', 'afterPrintTick': 'true'}
[chrome/technical] bytes=82477 pages=1 subtypes={'/Type0': 8} unique_fonts=8
[chrome/classic] bytes=120952 pages=1 subtypes={'/Type0': 11} unique_fonts=11
[chrome/modern] bytes=93685 pages=1 subtypes={'/Type0': 8} unique_fonts=8
[brave/technical] bytes=82477 pages=1 subtypes={'/Type0': 8} unique_fonts=8
[brave/classic] bytes=120952 pages=1 subtypes={'/Type0': 11} unique_fonts=11
[brave/modern] bytes=93685 pages=1 subtypes={'/Type0': 8} unique_fonts=8
brave_classic.pdf: pdfjs_items=60, missing=[] | rectSelChars=883 foundName=1 foundHeadline=1 foundBullet=1 normOk=true
brave_modern.pdf: pdfjs_items=57, missing=[] | rectSelChars=842 foundName=1 foundHeadline=1 foundBullet=1 normOk=true
brave_technical.pdf: pdfjs_items=59, missing=[] | rectSelChars=825 foundName=1 foundHeadline=1 foundBullet=1 normOk=true
chrome_classic.pdf: pdfjs_items=60, missing=[] | rectSelChars=883 foundName=1 foundHeadline=1 foundBullet=1 normOk=true
chrome_modern.pdf: pdfjs_items=57, missing=[] | rectSelChars=842 foundName=1 foundHeadline=1 foundBullet=1 normOk=true
chrome_technical.pdf: pdfjs_items=59, missing=[] | rectSelChars=825 foundName=1 foundHeadline=1 foundBullet=1 normOk=true
```

## Residual Risks

- **Safari native `NSPrintOperation` & GUI viewers (Preview / PDFgear)**: Sandboxed automation cannot drive Safari's interactive Print panel (`NSPrintOperation`) or manual pointer drag inside PDFgear; `PDFKit` verification above exercises Apple's underlying Preview text engine directly on the Chrome/Brave-exported PDFs, so a quick interactive `Cmd+P` smoke check in Safari is still advisable if Safari PDF export is targeted.
- **`ClassicATS` PDFKit point-to-point selection ordering**: While `page.selection(for: bounds)` (`Cmd+A` / marquee selection) and `doc.findString` capture all `883` characters cleanly, `PDFDocument.selection(from: (0, 800), to: (612, 0))` omitted the centered header (`sel_chars=704`) because Chromium emits its positioned element near the end of the PDF stream; this is standard Chromium layout stream ordering and not a glyph/raster issue.

## Recommendation

Close the bug — verified end-to-end across Chrome, Brave, `pdfjs-dist`, macOS `PDFKit`, unit tests, and the full frontend regression suite.
