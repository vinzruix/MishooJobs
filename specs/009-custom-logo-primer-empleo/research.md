# Research: Custom Brand Logo & "Primer Empleo" Label Standardization

**Feature**: `009-custom-logo-primer-empleo`  
**Date**: 2026-11-27  
**Spec**: [spec.md](./spec.md)

## 1. Logo Asset Extraction & Background Isolation

- **Source Asset**: `specs/009-custom-logo-primer-empleo/reference-logo.png` (`238x176`, 8-bit/color RGBA PNG). Visual inspection shows a suited dark grey/black cat mascot with yellow eyes, white shirt collar, and dark suit lapels. The reference screenshot includes two unwanted artifacts:
  1. A grey-and-white checkerboard pattern simulating transparency behind the cat silhouette.
  2. A translucent dark pill toolbar with copy/download/share icons in the upper-right corner overlapping the tip of the cat's right ear.
  3. Thin dark screenshot border pixels along the left/bottom frame edges.

- **Decision**: During implementation, generate a clean, square-framed transparent PNG asset (`frontend/src/assets/mishoojobs-logo.png`, e.g., `512x512` or `256x256` RGBA) using the `image-generator` subagent (image-editing from `reference-logo.png`) combined with programmatic alpha verification/trimming to:
  - Remove 100% of the grey/white checkerboard background into true alpha transparency.
  - Remove the top-right floating copy/download/share pill overlay and cleanly reconstruct the occluded right ear tip matching the style, fur linework, and dark grey fill of the left ear.
  - Center the mascot cleanly in a 1:1 square bounding box so it scales crisply at `32x32` (`w-8 h-8`) in the navigation header and at `16x16` / `32x32` in browser favicons.

- **Rationale**: Relying on naive color-thresholding alone would leave jagged checkerboard fringe along dark whiskers/fur and cannot reconstruct the missing ear tip behind the floating UI pill. Using image-to-image editing guided by `reference-logo.png` followed by deterministic alpha/pixel verification guarantees faithful character preservation with zero artifacts.

- **Alternatives Considered**:
  - *Raw CSS cropping of `reference-logo.png`*: Rejected because the checkerboard remains visible on light `#F8FAFC`/`#FFFFFF` backgrounds and the top-right toolbar overlaps the right ear.
  - *Hand-coded geometric SVG cat*: Rejected because the user provided a specific custom mascot illustration whose distinctive linework, fur silhouette, yellow eyes, and suit collar should be preserved directly.

## 2. Favicon Packaging for Light & Dark Browser Tabs

- **Inspection Finding**: `frontend/index.html` currently declares `<link rel="icon" type="image/svg+xml" href="/vite.svg" />`, and `frontend/public/` does not exist yet in the repository.
- **Decision**:
  - Create `frontend/public/` and publish:
    1. `frontend/public/favicon.svg`: An SVG wrapper (`viewBox="0 0 64 64"`) rendering a clean light rounded-square backing badge (`#FFFFFF` / `#F8FAFC` fill, `rx="14"`, thin `1.5px` `#E2E8F0` border) with the cleaned transparent mascot embedded cleanly inside (`<image href="..." />` via data URI or relative `/mishoojobs-logo.png` — data URI embedded inside `favicon.svg` is preferred because browsers do not always resolve external `<image>` hrefs inside `<link rel="icon" type="image/svg+xml">`!).
    2. `frontend/public/favicon.png`: A raster `64x64` PNG version of the same light rounded-square backing badge + centered cat mascot as a universal fallback for browsers/contexts that prefer PNG icons.
  - Update `frontend/index.html` to reference `/favicon.svg` and `/favicon.png`, replacing `/vite.svg`.
  - Add `frontend/src/vite-env.d.ts` (`/// <reference types="vite/client" />`) so TypeScript strict mode (`tsc`) cleanly resolves `import mishooLogo from "../assets/mishoojobs-logo.png"` inside `Header.tsx`.

- **Rationale**: Embedding the cleaned mascot image as a base64 PNG data URI inside `favicon.svg` avoids browser SVG external-resource restrictions on favicons, ensures single-request instant tab rendering, and preserves crisp visibility of the dark cat mascot on both dark-mode and light-mode browser tab bars via the light rounded-square badge.

- **Alternatives Considered**:
  - *Bare transparent PNG favicon without backing badge*: Rejected because a dark-furred black cat disappears against dark browser tab chrome (e.g., Chrome/Safari dark mode).
  - *ICO-only favicon*: Less crisp on Retina/HiDPI displays compared to SVG + 64x64 PNG.

## 3. Navigation Header & Interactive Brand Craft (`emil-design-eng`)

- **Inspection Finding**: `frontend/src/components/Header.tsx` currently renders a non-interactive `<div className="flex items-center gap-2.5">` containing a dark `w-7 h-7 rounded-lg bg-slate-900` container with a Lucide `<Briefcase />` icon next to `MishooJobs`. In `frontend/src/App.tsx`, `Header` receives `setActiveTab={(tab) => { setActiveTab(tab); setViewingResumeId(null); }}`.
- **Decision**:
  - Replace the non-interactive brand `<div>` with a semantic `<button type="button" onClick={() => setActiveTab("search")} aria-label="MishooJobs - Ir a Vacantes">` wrapping:
    - A light rounded-square badge (`w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs overflow-hidden flex items-center justify-center shrink-0`) displaying `<img src={mishooLogo} alt="Logo de MishooJobs" className="w-full h-full object-contain" />`.
    - The `"MishooJobs"` brand wordmark (`font-bold text-slate-900 text-base tracking-tight whitespace-nowrap`).
  - Apply Emil Kowalski (`emil-design-eng`) craft tokens:
    - Subtle tactile press feedback: `transition-transform duration-150 ease-out active:scale-[0.98] cursor-pointer` (avoiding `transition-all` on layout properties).
    - Keyboard accessibility: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 rounded-xl`.
  - Ensure mobile responsiveness (`<768px`, tested down to `375px`): Add `shrink-0` on the brand button and keep compact tab padding (`px-2.5 sm:px-3`) on right-hand navigation buttons so the logo never distorts, clips, or forces vertical line wrapping on mobile viewports.

- **Rationale**: Using `<button type="button">` ensures keyboard navigation (`Tab`/`Enter`/`Space`), screen-reader semantics, and instant navigation back to the primary `"Vacantes"` (`"search"`) view from `"Postulaciones"`, `"CVs"`, or an open `LiveCVViewer` (`setViewingResumeId(null)`).

## 4. Comprehensive Audit & Normalization of "Primer Empleo Real" → "Primer Empleo"

A repository-wide search across `frontend/` and `backend/` (excluding `node_modules/`, `dist/`, `__pycache__/`, `.pytest_cache/`) identified every user-facing occurrence and prompt reference:

1. **Frontend UI Components**:
   - `frontend/src/components/FilterToolbar.tsx` (line 23): `SENIORITY_OPTIONS` defines `{ id: "primer_empleo", label: "Primer Empleo Real", shortLabel: "Primer Empleo", isHighlight: true }`. Update `label` to `"Primer Empleo"`.
   - `frontend/src/components/PastelMetricGrid.tsx` (line 73): `buildPastelMetrics()` sets `seniorityValue = "Primer Empleo Real";` for `case "primer_empleo":`. Update to `seniorityValue = "Primer Empleo";`, keeping `senioritySubtext = "0 años verificados"`.

2. **Backend AI Prompts**:
   - `backend/src/mishoojobs/services/agy_ai_client.py` (line 124): `AUDIT_PROMPT_TEMPLATE` states `'Primer Empleo Real (0 Exp)'`. Update to `'Primer Empleo (0 Exp)'`.

3. **Previously Cached AI Evaluations & Audit Reasoning (FR-007)**:
   - PostgreSQL tables `ai_evaluation_cache` (`role_readiness_summary`, `actionable_advice`) and `job_vacancies` (`reasoning`) may contain previously persisted strings mentioning `"Primer Empleo Real"` in any capitalization (`"Primer Empleo Real"`, `"Primer empleo real"`, `"PRIMER EMPLEO REAL"`, `"primer empleo real"`).
   - **Decision**: Introduce a pure deterministic normalization function on both layers:
     - **Backend (`agy_ai_client.py` & `routes/vacancies.py`)**: `normalize_primer_empleo_text(text: str) -> str` using `re.sub(r"\bprimer\s+empleo\s+real\b", "Primer Empleo", text, flags=re.IGNORECASE)`. Apply it on output in `evaluate_vacancy()` (both cache-hit and fresh responses for `role_readiness_summary`, `actionable_advice`, and `sen_audit.reasoning`), in `audit_vacancy_seniority()` (both cache-hit and fresh responses for `reasoning`), and inside `clean_json_output()` / `clean_seniority_audit_output()`.
     - **Frontend (`frontend/src/services/text_normalizer.ts` & `VacancyDetailPane.tsx`)**: `normalizeSeniorityDisplayText(text?: string | null): string` applying `text.replace(/\bprimer\s+empleo\s+real\b/gi, "Primer Empleo")` when rendering `auditResult?.reasoning || vacancy.reasoning`, `evaluation.role_readiness_summary`, and `evaluation.actionable_advice`.
   - **Rationale**: Output-level normalization preserves existing PostgreSQL cache rows, `cache_key` hashes, and historical records without requiring destructive DB migrations or cache invalidation, while guaranteeing 0% visibility of `"Primer Empleo Real"` across both cached and fresh responses.

4. **Internal Identifiers Preserved (FR-008)**:
   - `seniority_level = "primer_empleo"`, `SeniorityLevelEnum.PRIMER_EMPLEO`, `is_real_first_job`, `SeniorityCounts.primer_empleo`, URL query `?seniority=primer_empleo`, and historical `specs/` / `GEMINI.md` decision logs remain untouched so filtering, sorting, and shareable URLs work identically.

5. **Test Suite Alignment**:
   - Existing frontend tests asserting `"Primer Empleo Real"` (`FilterToolbar.test.tsx`, `PastelMetricGrid.test.tsx`, `App.test.tsx`, `VacancyList.test.tsx`, and test description in `VacancyCard.test.tsx`) will be updated to assert `"Primer Empleo"`, alongside new regression tests for header logo navigation, favicon links, and case-insensitive cached text normalization in both Vitest and Pytest.
