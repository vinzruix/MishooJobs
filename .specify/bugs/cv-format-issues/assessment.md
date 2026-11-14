# Bug Assessment: CV PDF Print Cutting, Multi-Page Header Support & Missing Certificates in Executive Template

- **Slug**: cv-format-issues
- **Created**: 2026-11-10T20:15:20-06:00
- **Source**: pasted text + attached screenshot (`image_1` / `media_1794363225738_75cc13b4.png`)
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

> "In the CV Dense, when i dowload my CV it dowloads two pages and the content is cut (image_1). Also in the others 2 it says that the CV is full, when this happens i would like to idk download two pages but the header keep it in both, also in ther 3rd CV my certificates are not there."

Attached screenshot (`image_1`) shows page 2 of a downloaded PDF from the Dense template (`Alta Densidad (2 col)`):
- Two certification items (`Java Spring Boot Microservices eCommerce Project Masterclass / Udemy (2026)` and `Curso Completo de Spec Driven Development (SDD) y Agentes IA / Udemy (2026)`) spill onto page 2 without their section heading (`Certificaciones`), offset into the middle/right area with an orphaned vertical gray border line (`border-r`) to their left.
- Directly underneath the clipped section on page 2, the MishooJobs web application footer (`MishooJobs • Desarrollado para juniors y estudiantes en México • Moneda MXN ($)`) is printed inside the PDF.

## Symptom

1. **Dense Template (`Alta Densidad (2 col)`) Multi-Page Spill & Content Clipping**: Downloading the CV as PDF via "Descargar PDF" produces 2 pages even when no overflow warning is shown on screen (or when content barely exceeds page 1). On page 2, sections/items are cut across the page boundary without their heading, an empty left column vertical divider (`border-r`) cuts through the page, and the MishooJobs application footer leaks onto the bottom of the PDF.
2. **Other 2 Templates (`Clásico ATS`, `Ejecutivo`) Show Full-Page Warning Without Clean 2-Page Support**: Switching to `ClassicATS` or `ModernExecutive` with the same populated CV triggers the `[PÁGINA EXCEDIDA: El contenido excede 1 página impresa. Edita viñetas o cambia plantilla para ajustar.]` banner. There is no structured 2-page print/preview mode, and printing anyway produces an unpaginated 2-page PDF without keeping the candidate header on both pages.
3. **3rd Template (`Ejecutivo` / `ModernExecutive`) Missing Certificates**: The `Ejecutivo` (`ModernExecutive`) template never renders `content.certificates` (nor `content.logros_academicos`, `content.languages`, or `content.header.links`), so candidate certifications disappear when switching to the 3rd template.

## Reproduction

1. Populate a Master Profile containing multiple experiences, projects, education entries, and at least 2 certificates (e.g., Udemy courses) and generate a CV.
2. Open the generated CV in `LiveCVViewer` (defaults to `Alta Densidad (2 col)` / `TechnicalHighDensity`).
3. Observe whether `[PÁGINA EXCEDIDA]` appears; click **Descargar PDF** (`window.print()` -> Save as PDF).
4. Inspect the resulting PDF:
   - The PDF spans 2 pages; page 2 contains spilled/cut certificate lines below an orphaned vertical column border and includes the `MishooJobs • Desarrollado para juniors y estudiantes en México • Moneda MXN ($)` footer.
5. Switch to **Clásico ATS** (`ClassicATS`) and **Ejecutivo** (`ModernExecutive`) via the template switcher:
   - Both show the amber `[PÁGINA EXCEDIDA: ...]` warning bar ("CV is full"), and there is no option/layout to download a clean 2-page CV with the candidate header repeated on both pages.
   - In **Ejecutivo** (`ModernExecutive`), scroll to the bottom of the CV: the **Certificaciones** section (as well as **Logros Académicos**, **Idiomas**, and header `links`) is completely absent.

## Suspected Code Paths

- `frontend/src/App.tsx:397,410,622-625` — Outer `<div className="min-h-screen ...">`, `<main className="... p-4 ...">`, and `<footer>MishooJobs • Desarrollado para juniors y estudiantes en México • Moneda MXN ($)</footer>` lack print hiding/reset classes (`print:hidden`, `print:p-0`, `print:min-h-0`), causing `<main>` padding and the app `<footer>` to render inside the printed PDF.
- `frontend/src/components/LiveCVViewer.tsx:49-66,136-159,311-324` —
  - `@media print` (lines 144-146) hides `header, nav, .no-print` but omits `footer`.
  - Root `div` (line 136) retains `min-h-screen` in print, and the canvas wrapper (line 323) keeps `flex justify-center overflow-y-auto` without `print:block print:overflow-visible` (flex + overflow containers break browser pagination across pages).
  - Overflow detection (line 56) checks screen `offsetHeight > 1080`, whereas `@page { size: letter; margin: 0.4in; }` (lines 147-150) leaves only `10.2in` (`~979px` at 96 DPI) of printable height and `7.7in` (`~739px`) of printable width—causing silent print overflow when screen height is between `980px` and `1080px`.
  - Only offers a passive 1-page warning (`overflow-warning-badge`, lines 312-320) with no 2-page pagination or repeated header support.
- `frontend/src/components/templates/TechnicalHighDensity.tsx:28,69-71,252-286` —
  - Line 28 applies `min-h-[11in]` (`1056px`) without `print:min-h-0`, which always exceeds the `10.2in` (`979px`) printable area inside `0.4in` `@page` margins and forces a second page in print.
  - Line 69-71 uses a full-height CSS Grid (`grid-cols-12`) with `col-span-4 border-r border-zinc-200`, which stretches the left column divider line onto page 2 even when only the right column overflows.
  - Sections, headings (`h3`), and nested `grid-cols-2` blocks (lines 253-286) lack `break-inside-avoid` / `break-after-avoid`, causing headings and certificate items to split/cut across pages.
- `frontend/src/components/templates/ClassicATS.tsx:18,170-199` —
  - Line 18 applies `min-h-[11in]` without `print:min-h-0` and lacks `break-inside-avoid` / `break-after-avoid` pagination guards. Generous vertical spacing (`p-8`, `mb-4`, `gap-3`) easily exceeds `1080px` on populated profiles. (Also omits `content.languages`.)
- `frontend/src/components/templates/ModernExecutive.tsx:20-55,114,144-174` —
  - Completely omits `content.certificates`, `content.logros_academicos`, `content.languages`, and `content.header.links`, terminating at `skills_categorized` and `education` (line 173).
  - Line 114 uses `grid-cols-1 md:grid-cols-2`, which collapses to 1 taller column during printing because printable Letter width (`7.7in ≈ 739px`) is below Tailwind's `md` (`768px`) breakpoint.
  - Lacks `break-inside-avoid` / `break-after-avoid` guards and `print-color-adjust: exact` for the dark executive header (`bg-zinc-900`).

## Root Cause Hypothesis

Three distinct but compounding defects cause the reported issues:
1. **Uncalibrated Print Geometry & Unhidden App Shell**: `@page` reserves `0.4in` top/bottom/left/right margins on Letter paper (`7.7in × 10.2in`, or `~739px × 979px` at 96 DPI), yet `TechnicalHighDensity` and `ClassicATS` enforce `min-h-[11in]` (`1056px`) without `print:min-h-0`, `App.tsx` renders an unhidden `<footer>` and `<main p-4>` around `LiveCVViewer`, and `LiveCVViewer` wraps the canvas in `min-h-screen` + `flex` + `overflow-y-auto` while checking overflow against a `1080px` screen threshold on an `816px` (`8.5in`) box. Consequently, CVs that appear to fit on screen (`<= 1080px`) spill onto page 2 in print alongside the MishooJobs footer, and CSS Grid columns (`grid-cols-12` + `border-r`) without `break-inside-avoid` / `break-after-avoid` slice sections mid-block across pages.
2. **No Multi-Page Pagination Mode with Repeated Header**: `LiveCVViewer` assumes every CV fits on 1 page and only renders a warning banner when `offsetHeight > 1080`. It lacks a 2-page layout mode that cleanly splits blocks across two discrete Letter-calibrated pages without cutting items and repeats the candidate header at the top of both pages.
3. **Incomplete Data Parity in `ModernExecutive`**: During template implementation/calibration in feature `005`, `ModernExecutive.tsx` only implemented header (without `links`), `about_me`, `experience`, `projects`, `skills_categorized`, and `education`, omitting `certificates`, `logros_academicos`, and `languages` from `GeneratedCVContent`.

*Confidence*: high (directly verified in `App.tsx`, `LiveCVViewer.tsx`, all three template components, and confirmed visually by `image_1`).

## Proposed Remediation

**Preferred**:
1. **Fix Print Shell Isolation & Calibrate Single-Page Geometry (`App.tsx`, `LiveCVViewer.tsx`, all 3 templates)**:
   - Hide `footer` in `LiveCVViewer.tsx` `@media print` (`header, nav, footer, .no-print { display: none !important; }`) and add `print:hidden no-print` on `<footer>` in `App.tsx`, plus `print:p-0 print:max-w-none print:min-h-0 print:block` on `App.tsx`'s shell/`<main>` and `LiveCVViewer.tsx`'s root/`overflow-y-auto flex` wrapper (`print:block print:overflow-visible`).
   - Add `print-color-adjust: exact; -webkit-print-color-adjust: exact;` in `@media print` so `ModernExecutive`'s dark banner prints cleanly.
   - Calibrate template screen sheets to match the actual printable content box (`7.7in` content width inside `0.4in` screen padding, removing `min-h-[11in]` on print via `print:min-h-0`, and changing `ModernExecutive` `md:grid-cols-2` to `grid-cols-2` / `print:grid-cols-2` so print width doesn't collapse project cards to 1 column).
   - Add `break-inside-avoid` (`page-break-inside: avoid`) to every experience item, project card, education entry, certificate item, achievement item, and skill block, and `break-after-avoid` (`page-break-after: avoid`) to all section headings across all 3 templates.
   - Calibrate single-page overflow detection in `LiveCVViewer.tsx` against the true printable page height (`~979px` / `10.2in` content height at 96 DPI, rather than `1080px` on an `816px` padded box).

2. **Add Missing Sections to `ModernExecutive.tsx` (and parity check `ClassicATS.tsx`)**:
   - Render `content.certificates` ("Certificaciones") and `content.logros_academicos` ("Logros Académicos") in `ModernExecutive.tsx` using compact 2-column or clean styled blocks consistent with `TechnicalHighDensity` and `ClassicATS`.
   - Also render `content.languages` ("Idiomas") and `content.header.links` in `ModernExecutive.tsx` (and `content.languages` in `ClassicATS.tsx`) so switching templates never drops candidate data.

3. **Implement Clean 2-Page Paginated Mode with Repeated Header (`LiveCVViewer.tsx` + Templates)**:
   - When content exceeds 1 printable Letter page (`10.2in` / `~979px`), update the banner in `LiveCVViewer.tsx` so it informs the user (e.g., 2 pages needed) and supports a clean **2-Page Paginated Layout** (either automatically activated on overflow with a toggle to switch/reflow, or toggleable right from the overflow banner: *"Usar 2 Páginas (Encabezado en ambas)"*).
   - Extract each template's header into a reusable header subcomponent and distribute sections/items cleanly across **Page 1** and **Page 2** containers (`.cv-page`, with `break-after: page` on Page 1 in `@media print` and a visual page gap on screen):
     - **Page 1** renders the full template header + sections/items that fit within the Page 1 printable budget (`<= 10.2in`). For `TechnicalHighDensity`, the 2-column body ends cleanly on Page 1 so its `border-r` never bleeds into Page 2.
     - **Page 2** repeats the template's candidate header at the top (preserving name, headline, contact details, and template identity styling—compactly omitting the long `about_me` paragraph or keeping full header consistently per template design) followed by the remaining overflowed sections/items (e.g., remaining projects, education, certificates, achievements) without cutting any item mid-element.
   - Keep existing `onFieldChange` path indices (`["experience", String(expIdx), ...]`, etc.) intact across Page 1 and Page 2 so inline `contentEditable` editing continues to save to Dexie accurately.

**Alternatives**:
- **Native HTML `<table>` with `<thead>` Header Repetition**: Wrap each template in a semantic `<table>` putting the candidate header in `<thead>` and body in `<tbody>` with `break-inside: avoid` on blocks.
  - *Trade-offs*: Simpler to implement for single-column templates (`ClassicATS`), but does **not** preview Page 2's repeated header on screen (non-WYSIWYG), struggles with multi-column CSS Grid pagination in Safari/Chromium (`TechnicalHighDensity`'s `border-r` still bleeds onto Page 2), and duplicates the tall `about_me`/photo block verbatim on Page 2. Explicit 2-page sheet pagination provides accurate screen preview, clean column termination on Page 1, and zero cut content across all browsers.

**Files likely to change**:
- `frontend/src/App.tsx`
- `frontend/src/components/LiveCVViewer.tsx`
- `frontend/src/components/templates/TechnicalHighDensity.tsx`
- `frontend/src/components/templates/ClassicATS.tsx`
- `frontend/src/components/templates/ModernExecutive.tsx`
- `frontend/tests/components/LiveCVViewer.test.tsx`

**Tests to add or update**:
- Update/add tests in `frontend/tests/components/LiveCVViewer.test.tsx`:
  - Verify `ModernExecutive` renders `certificates`, `logros_academicos`, `languages`, and `header.links` when populated.
  - Verify `App` / `LiveCVViewer` print styles hide `footer` and reset `min-h-screen` / `min-h-[11in]` on print.
  - Verify all templates include `break-inside-avoid` / `break-after-avoid` print protection classes on section headings and list items/cards.
  - Verify 2-page overflow mode (mocking `offsetHeight` > 1 printable page) renders both Page 1 and Page 2 containers with the candidate header repeated in both, while keeping default single-page mock content warning-free (`overflow-warning-badge` absent when within 1 page).
- Run `cd frontend && npm test -- --run` to verify all frontend unit/component tests pass offline.

## Risks & Considerations

- **Browser Print Engine Variance**: Chromium, WebKit (Safari), and Gecko handle CSS Grid fragmentation differently; explicit Page 1 / Page 2 discrete containers (`break-after: page`) plus `print:block print:overflow-visible` on ancestors minimize cross-browser print discrepancies.
- **Measurement Timing in `LiveCVViewer`**: Measuring DOM block heights for Page 1 -> Page 2 splitting must account for `photo_enabled` toggles, template switches, and inline edits (`contentEditable` `onBlur`), re-running cleanly via `ResizeObserver` / `useLayoutEffect` without infinite render loops.
- **Existing Test Compatibility**: `LiveCVViewer.test.tsx` asserts that default mock content on `ModernExecutive` does not trigger `overflow-warning-badge` (jsdom reports `offsetHeight = 0`); ensure overflow thresholds and 2-page activation preserve zero false-positives on default single-page resumes.
- **Privacy & Constitution Compliance**: All pagination, header repetition, and template rendering stay 100% client-side using native `window.print()` with zero server-side PDF rendering or candidate data transmission.

## Open Questions

- [NEEDS CLARIFICATION: When repeating the header on Page 2, should Page 2 display a **compact header** (Name, Headline, Contact Info/Links, optional mini photo) to leave maximum vertical space for overflowing sections, or repeat the **exact full Page 1 header** including the `about_me` paragraph and 96x96 photo?]
- [NEEDS CLARIFICATION: When a CV overflows 1 printable page, should 2-page layout with repeated header activate **automatically** (with a dismissible info banner) or via an explicit **1-Página / 2-Páginas** toggle in the `LiveCVViewer` toolbar/warning bar?]
