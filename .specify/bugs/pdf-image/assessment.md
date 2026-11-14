# Bug Assessment: Downloaded CV PDFs Emit Non-Copyable Type3 Glyph Shapes / Rasterized Output

- **Slug**: pdf-image
- **Created**: 2026-11-10T20:51:00-06:00
- **Source**: pasted text
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

> "The pdf of the cv generate are images, i cant copy the text inside."

## Symptom

When downloading a CV PDF from `LiveCVViewer` via the **Descargar PDF** button (`window.print()` -> Save as PDF), the resulting PDF prevents normal text selection and copying—behaving like flat images or broken vector shapes instead of standard selectable text.

Empirically verified against the built `frontend/dist` app on macOS in Google Chrome and Brave Browser:
- `TechnicalHighDensity` and `ModernExecutive` PDFs contain **zero** standard TrueType/OpenType text fonts (`/Type0`) and instead embed **43–45 `/Type3` vector-drawing glyph fonts** (`BaseFont: None`, inverted `FontMatrix [0.00048828125, 0, 0, -0.00048828125, 0, 0]`), fragmenting words into isolated 1–2 character vector drawings (e.g., `507` `pdfjs-dist` text fragments for a 1-page CV and broken mid-word splits / `U+FFFC` characters in macOS `PDFKit`).
- `ClassicATS` mixes **16 `/Type3` fonts** (for its `font-sans` headings) with 6 `/Type0` (`Georgia`) fonts.
- Additionally, print CSS retains active `contentEditable="true"` attributes, Tailwind `print:shadow-none` non-`none` `box-shadow` declarations (`0 0 #0000`), `shadow-xs`, and `backdrop-blur` rules on ancestors/toolbars, which in WebKit/Safari or system print pipelines can trigger full-layer bitmap rasterization.

## Reproduction

1. Open MishooJobs in Google Chrome (or Brave Browser) on macOS, navigate to **Mis CVs**, and preview any generated CV in `LiveCVViewer` (defaults to `Alta Densidad (2 col)` / `TechnicalHighDensity`).
2. Click **Descargar PDF** (triggers `window.print()`) and save as PDF (or print `frontend/dist` via Chrome CDP `Page.printToPDF`).
3. Inspect the generated PDF in a PDF viewer/editor (e.g., Apple Preview, PDFgear, or ATS parser) or try highlighting and copying text inside the CV:
   - Text cannot be cleanly selected/copied as words; `pdfjs-dist` parses `"CARLOS RAMIRE Z   LOPE Z  D e s a rroll ad or   B acke n d..."` (`507` fragments) and `pypdf` confirms `{'/Type3': 43}` with `0` `/Type0` fonts.
4. Repeat with **Ejecutivo** (`ModernExecutive`) (`{'/Type3': 45}`) and **Clásico ATS** (`ClassicATS`) (`{'/Type3': 16, '/Type0': 6}`): `font-sans` sections exhibit the same `/Type3` glyph drawing fallback.
5. [NEEDS CLARIFICATION: Confirm which browser (Chrome, Brave, or Safari) and PDF viewer (Preview, PDFgear, Chrome, or ATS uploader) produced pure unselectable images vs fragmented/non-copyable Type3 text.]

## Suspected Code Paths

- `frontend/src/components/templates/CVPageSheet.tsx:18,36` — Defaults `fontClassName = "font-sans"`, which Tailwind compiles to `ui-sans-serif, system-ui, sans-serif, ...`. On macOS, `ui-sans-serif`/`system-ui` resolves to Apple's proprietary San Francisco variable font (`.SFNS`), causing Chromium/Skia PDF to fall back to `/Type3` glyph drawings. Also uses `shadow-md ... print:shadow-none`, which in Tailwind v3 compiles to `box-shadow: 0 0 #0000, ...` rather than `box-shadow: none`.
- `frontend/src/components/templates/TechnicalHighDensity.tsx:141,148-170,489,505` — Passes `fontClassName="font-sans"` to `CVPageSheet`, sets `shadow-xs` + `rounded-md overflow-hidden` on the avatar container, and leaves `contentEditable={isEditable}` (`true`) active on `<h1>`, `<h2>`, `<p>`, `<span>`, and `<li>` elements during print.
- `frontend/src/components/templates/ModernExecutive.tsx:145,152-174,199,477,485` — Passes `fontClassName="font-sans"`, keeps `contentEditable={isEditable}` active during print, and renders rounded/clipped containers (`rounded-lg`, `rounded-full overflow-hidden`) with `bg-zinc-900` requiring `print-color-adjust: exact`.
- `frontend/src/components/templates/ClassicATS.tsx:127-141,130,159,169,374,382` — Applies `font-sans` on all headings/subheadings inside a `font-serif` (`ui-serif, Georgia, ...`) sheet and leaves `contentEditable={isEditable}` active during print.
- `frontend/src/components/LiveCVViewer.tsx:121-157,160,367` — `handlePrint()` invokes `window.print()` directly while `isEditable={true}`; its `@media print` block hides `header, nav, footer, .no-print` and resets `box-shadow: none !important` only on `.print-canvas` (not `.cv-page` or `*`), does not override `.font-sans`/`.font-serif`/`.font-mono` to print-safe TrueType font stacks, and inherits `font-mono` (`GeistMono`) on the root container.
- `frontend/tailwind.config.js:15-18` — Configures custom `mono` and `pixel` font families while leaving `sans` and `serif` at Tailwind defaults (`ui-sans-serif, system-ui` and `ui-serif`).
- `frontend/index.html:10,12` & `frontend/src/index.css:12-16` — Applies variable Google Font `'Geist Mono'` and `-webkit-font-smoothing: antialiased` on `<body>`.

## Root Cause Hypothesis

The primary, empirically verified cause is **font-stack-induced `/Type3` vector-glyph emission in Chromium/Skia PDF (Chrome & Brave) on macOS**: Tailwind's `font-sans` (`ui-sans-serif, system-ui, sans-serif, ...`) maps to Apple's `.SFNS` variable system font on macOS, which Skia's PDF backend cannot subset as a standard `/Type0` TrueType font. Consequently, Skia converts all CV text into dozens of `/Type3` fonts (`43` in `TechnicalHighDensity`, `45` in `ModernExecutive`) whose `/CharProcs` draw each letter as raw vector paths with an inverted `FontMatrix`, causing PDF viewers, copy-paste selection, and ATS parsers (`pdfjs-dist` splitting words into 500+ glyph fragments) to treat the text as broken shapes or uncopyable graphics.

A secondary compounding risk (especially for Safari/WebKit and system print dialogs) is **print-layer compositing and active `contentEditable` state**: `LiveCVViewer` prints while `contentEditable="true"` remains enabled on text nodes, `print:shadow-none` resolves to zero-blur `rgba(...) 0px` box-shadow tokens rather than `box-shadow: none`, `backdrop-blur` exists on page chrome/modals, and `TechnicalHighDensity` includes `shadow-xs` / `overflow-hidden` wrappers—all of which can prompt WebKit/macOS print pipelines to flatten containers into raster bitmaps.

*Confidence*: high (directly reproduced `/Type3` failure in Chrome and Brave on `frontend/dist`, verified `/Type0` TrueType fix in Chrome CDP with `Helvetica, Arial, sans-serif` / `Georgia`, and verified `pdfjs-dist` + macOS `PDFKit` extraction improvements; Safari `NSPrintOperation` was blocked by sandboxed WindowServer access so WebKit bitmap flattening remains inferred from `WKWebView.createPDF` + WebKit print rules).

## Proposed Remediation

**Preferred**:
1. **Enforce Print-Safe TrueType Font Stacks in `@media print` (and/or CV Templates) (`LiveCVViewer.tsx`, `CVPageSheet.tsx`)**:
   - In `LiveCVViewer.tsx`'s `@media print` stylesheet (and/or dedicated `@media print` rules on `.cv-page`), explicitly override Tailwind's `ui-sans-serif` / `system-ui` / `ui-serif` / variable `Geist Mono` tokens with standard, cross-platform embeddable font stacks:
     - `.cv-page.font-sans, .cv-page .font-sans { font-family: Arial, Helvetica, sans-serif !important; }` (or `Helvetica, Arial, sans-serif !important;`)
     - `.cv-page.font-serif, .cv-page .font-serif { font-family: Georgia, "Times New Roman", Times, serif !important; }`
     - `.cv-page.font-mono, .cv-page .font-mono { font-family: "Courier New", Courier, monospace !important; }`
   - Empirically verified in Chrome CDP: overriding `.font-sans` to `Helvetica, Arial, sans-serif` eliminates 100% of `/Type3` fonts (`0` `/Type3`, `8–11` `/Type0` fonts), shrinks `technical.pdf` from 230 KB to 82 KB, reduces `pdfjs-dist` fragments from 507 to 105 intact words, and eliminates mid-word line splits in macOS `PDFKit`.
2. **Temporarily Disable `contentEditable` During Print (`LiveCVViewer.tsx`)**:
   - Track an `isPrinting` state in `LiveCVViewer.tsx` wired to `window` `beforeprint` / `afterprint` events (and toggled around `handlePrint()` with an `afterprint` fallback reset), passing `isEditable={!isPrinting}` to `TechnicalHighDensity`, `ClassicATS`, and `ModernExecutive`. This ensures browsers print static semantic DOM text rather than active editable layers while preserving instant inline editing on screen.
3. **Harden `@media print` Against Bitmap Rasterization Triggers (`LiveCVViewer.tsx`, `CVPageSheet.tsx`, `TechnicalHighDensity.tsx`)**:
   - In `@media print`, apply `box-shadow: none !important; text-shadow: none !important; filter: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; transform: none !important;` to `.cv-page, .cv-page *` (and remove or replace non-existent Tailwind v4 `shadow-xs` in `TechnicalHighDensity.tsx:141`), while keeping `-webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;` scoped to `.cv-page` / `.print-canvas` so `ModernExecutive`'s dark header retains white-on-dark contrast without triggering shadow/filter rasterization.
   - Ensure `body` / `.cv-page` explicitly keep `-webkit-user-select: text !important; user-select: text !important;` in print styles.

**Alternatives**:
- **Configure `fontFamily.sans` and `fontFamily.serif` Globally in `tailwind.config.js`** (e.g., replacing `ui-sans-serif, system-ui` everywhere):
  - *Trade-offs*: Fixes PDF font embedding without needing `@media print` font overrides, but changes on-screen UI typography across non-CV screens too. Keeping the print font override scoped to `.cv-page` (or `LiveCVViewer` `@media print`) preserves the existing UI look while guaranteeing clean vector TrueType PDFs.
- **Client-Side Programmatic Vector PDF Library (`pdf-lib` / `jspdf` text drawing)**:
  - *Trade-offs*: Gives deterministic control over PDF streams without browser print dialogs, but requires duplicating all three React/Tailwind template layouts in imperative coordinate drawing code and breaks WYSIWYG parity with `useCVPagination` / inline editing.

**Files likely to change**:
- `frontend/src/components/LiveCVViewer.tsx`
- `frontend/src/components/templates/CVPageSheet.tsx`
- `frontend/src/components/templates/TechnicalHighDensity.tsx` (remove `shadow-xs` if unneeded)
- `frontend/tests/components/LiveCVViewer.test.tsx`

**Tests to add or update**:
- Update `frontend/tests/components/LiveCVViewer.test.tsx`:
  - Verify `@media print` CSS emitted by `LiveCVViewer` overrides `.cv-page` / `.font-sans` to non-`system-ui` print-safe fonts (`Arial, Helvetica, sans-serif` / `Helvetica, Arial, sans-serif`) and `.font-serif` to `Georgia, "Times New Roman", Times, serif`, plus strips `box-shadow`, `filter`, and `backdrop-filter`.
  - Verify `isEditable` (`contentEditable`) disables on `beforeprint` and restores on `afterprint`.
- Run `cd frontend && npm test -- --run` and `cd frontend && npm run build`, plus optionally re-run a Chrome CDP + `pypdf`/`pdfjs-dist` check against `frontend/dist` to confirm `0` `/Type3` fonts across all 3 templates.

## Risks & Considerations

- **Line-Width / Pagination Calibration Drift**: Switching `font-sans` from macOS San Francisco (`.SFNS`) to `Arial` / `Helvetica` during `@media print` slightly changes glyph advance widths between screen preview (`.SFNS`) and print (`Arial`/`Helvetica`). If `CVPageSheet` uses `Arial, Helvetica, sans-serif` on screen *as well as* in print for `.cv-page`, screen measurement in `useCVPagination` (`976px` Letter budget) stays 100% WYSIWYG with the printed PDF—worth considering vs print-only font override.
- **macOS `System Print Dialog` / Safari Verification**: In this assessment, `NSPrintOperation` could not complete inside the headless sandbox, so post-fix manual verification in Safari (`Cmd+P` -> Save as PDF) and Chrome (`Descargar PDF` -> Save as PDF, then testing text copy in Preview/PDFgear) is recommended.
- **Privacy & Constitution Compliance**: All fixes remain 100% client-side in CSS/React with zero server-side PDF rendering and zero network font dependencies required for CV export.

## Open Questions

- [NEEDS CLARIFICATION: Which browser (Google Chrome, Brave, or Safari) and PDF viewer (Apple Preview, PDFgear, or browser viewer) were used when observing that the CV PDF behaved as uncopyable images?]
- [NEEDS CLARIFICATION: Should `Arial, Helvetica, sans-serif` (and `Georgia, "Times New Roman", serif` for Classic ATS) be applied to `.cv-page` on screen as well as in `@media print` so `useCVPagination` line-wrapping stays strictly 1:1 WYSIWYG with the printed PDF?]
