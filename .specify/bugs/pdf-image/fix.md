# Bug Fix: CV PDF generation renders glyphs as non-copyable Type3 outlines

- **Slug**: pdf-image
- **Fixed**: 2026-11-10T20:54:15-06:00
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Overrode Tailwind's default variable system font stack (`ui-sans-serif` / `system-ui` / `ui-serif` / `Geist Mono`) inside `.cv-page` for both screen (WYSIWYG pagination parity) and `@media print` with standard vector TrueType font stacks (`Helvetica, Arial, sans-serif`, `Georgia, "Times New Roman", Times, serif`, `"Courier New", Courier, monospace`). Also disabled `contentEditable` during print (`isPrinting` state synced via `flushSync` in `handlePrint` plus `beforeprint`/`afterprint` listeners), enforced rasterization-free print CSS (`box-shadow: none !important`, `filter: none !important`, `backdrop-filter: none !important`, `transform: none !important`, `user-select: text !important`) on `.cv-page, .cv-page *`, and removed the non-existent Tailwind v4 `shadow-xs` utility class from `TechnicalHighDensity.tsx`.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `frontend/src/components/LiveCVViewer.tsx` | modified | Added `isPrinting` state (`beforeprint`/`afterprint` + `flushSync` in `handlePrint`) passing `isEditable={!isPrinting}`, scoped print-safe TrueType font stacks on `.cv-page` (screen + `@media print`), and hardened `@media print` against shadows/filters/transforms/non-selectable text |
| `frontend/src/components/templates/TechnicalHighDensity.tsx` | modified | Removed non-existent Tailwind v4 `shadow-xs` utility class from the avatar photo container |
| `frontend/tests/components/LiveCVViewer.test.tsx` | added test | Added tests verifying TrueType font stack CSS rules, rasterization-blocking `@media print` rules, removal of `shadow-xs`, and synchronous `contentEditable` toggling during print |

## Diff Highlights (optional)

```tsx
// frontend/src/components/LiveCVViewer.tsx
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  useEffect(() => {
    const onBeforePrint = () => setIsPrinting(true);
    const onAfterPrint = () => setIsPrinting(false);

    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, []);

  const handlePrint = () => {
    flushSync(() => {
      setIsPrinting(true);
    });
    try {
      window.print();
    } catch (err) {
      setIsPrinting(false);
      throw err;
    }
  };
```

```css
/* frontend/src/components/LiveCVViewer.tsx */
.cv-page.font-sans,
.cv-page .font-sans {
  font-family: Helvetica, Arial, sans-serif;
}
.cv-page.font-serif,
.cv-page .font-serif {
  font-family: Georgia, "Times New Roman", Times, serif;
}
.cv-page.font-mono,
.cv-page .font-mono {
  font-family: "Courier New", Courier, monospace;
}
@media print {
  /* ... */
  .cv-page,
  .cv-page * {
    box-shadow: none !important;
    text-shadow: none !important;
    filter: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    transform: none !important;
    -webkit-user-select: text !important;
    user-select: text !important;
  }
}
```

## Tests Added or Updated

- `frontend/tests/components/LiveCVViewer.test.tsx::enforces print-safe TrueType font stacks and vector-friendly print CSS rules` — asserts `.cv-page` defines Helvetica/Arial (`font-sans`), Georgia/Times New Roman (`font-serif`), and Courier New (`font-mono`), strips `box-shadow`, `text-shadow`, `filter`, `backdrop-filter`, and `transform` in `@media print`, enforces `user-select: text !important`, and confirms the avatar wrapper omits `shadow-xs`.
- `frontend/tests/components/LiveCVViewer.test.tsx::disables contentEditable synchronously during window.print and toggles via beforeprint/afterprint` — asserts clicking "Descargar PDF" sets `contenteditable="false"` synchronously before `window.print()` runs, and that `beforeprint` / `afterprint` toggle `contenteditable` accurately.

## Local Verification

- Commands run: `cd frontend && npm test -- --run` → passed (`19` test files, `124` tests, exit code `0`).
- Commands run: `cd frontend && npx vitest run tests/components/LiveCVViewer.test.tsx --reporter=verbose` → passed (`10/10` tests in `LiveCVViewer.test.tsx`, `556ms`).
- Commands run: `cd frontend && npm run build` → passed (`tsc && vite build`, `2186` modules transformed into `frontend/dist`).
- Commands run: Chrome Headless CDP `Page.printToPDF` against rebuilt `frontend/dist` + `pypdf` + `pdfjs-dist` (`legacy/build/pdf.mjs`) across all 3 templates:
  - `technical.pdf`: `82,765` bytes (`1` page), `8` fonts (`{'/Type0': 8}`, `0` `/Type3`), `59` intact `pdfjs-dist` text items (e.g., `'CARLOS RAMIREZ LOPEZ'`).
  - `classic.pdf`: `120,952` bytes (`1` page), `11` fonts (`{'/Type0': 11}`, `0` `/Type3`), `60` intact `pdfjs-dist` text items.
  - `modern.pdf`: `93,685` bytes (`1` page), `8` fonts (`{'/Type0': 8}`, `0` `/Type3`), `57` intact `pdfjs-dist` text items.
- Manual checks: Verified print-emulated computed styles via Chrome CDP (`cvPage.boxShadow: "none"`, `cvPage.fontFamily: "Helvetica, Arial, sans-serif"`, `h1.fontFamily: "Helvetica, Arial, sans-serif"`, `h1.userSelect: "text"`). Interactive macOS Preview / Safari manual verification deferred to `/speckit-bug-test`.

## Deviations from Assessment

- Applied the TrueType font stack overrides to `.cv-page` on screen as well as inside `@media print` (`!important`) instead of `@media print` alone, ensuring 1:1 WYSIWYG line-wrapping parity with `useCVPagination` page-height measurement while keeping the application UI shell in `Geist Mono`.
- Left `frontend/src/components/templates/CVPageSheet.tsx` unchanged because centralizing `.cv-page` font and print reset rules in `LiveCVViewer.tsx`'s `<style>` block cleanly overrides Tailwind's `print:shadow-none` (`--tw-shadow: 0 0 #0000`) and applies uniformly across all CV sheets.

## Follow-ups

- Perform interactive copy-paste smoke verification in Safari / Chrome Print dialog / macOS Preview (`cmd+c` from exported PDF across all 3 templates) during `/speckit-bug-test slug=pdf-image`.
