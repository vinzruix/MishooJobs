# Bug Assessment: Certificate Names in Generated CV / PDF Missing YAML `url` Links

- **Slug**: certificate-url-cv-issue
- **Created**: 2026-11-11T00:27:00-06:00
- **Source**: pasted text
- **Verdict**: valid
- **Severity**: medium

## Report (verbatim or summarized)

> "I noticed that the certificates names in the pdf do not have the url that i gave them in the yaml to go the certificate web"

## Symptom

When a candidate populates `certificates[].url` in their Master Profile YAML, generates a tailored or role-based CV, and views or downloads the PDF (`Descargar PDF` via `window.print()`), the certificate names render solely as plain text rather than clickable hyperlinks pointing to the certificate verification URL. As a result, clicking a certificate name in the generated PDF (or live viewer) does not open the certificate's website.

## Reproduction

1. Open the **Perfil Maestro** editor and ensure at least one entry in `certificates` includes a `url` field (e.g., `url: "https://aws.amazon.com/verification"`, as in the starter template `STARTER_MASTER_PROFILE_YAML`).
2. Save the Master Profile and generate a CV (via **Generar CV Adaptado** or **Crear CV por Rol**).
3. Open the generated CV in `LiveCVViewer` and inspect the **Certificaciones** section across any template (**Alta Densidad (2 col)**, **Clásico ATS**, or **Ejecutivo**), or click **Descargar PDF** and inspect the exported PDF.
4. **Observed**: Certificate names render as non-linked text (`<span>`, `<div>`, or `<strong>`), and the generated `content.certificates` items stored in IndexedDB (`db.resumes`) omit the `url` field entirely.
5. **Expected**: Each certificate whose Master Profile YAML entry has a `url` preserves that `url` in `content.certificates` and renders its certificate name as a clickable `<a href="...">` link (emitting a clickable hyperlink annotation in the printed PDF).

## Suspected Code Paths

- `specs/005-master-profile-cv/contracts/generated-cv-schema.json:99-110` — Defines `certificates` item properties as only `name`, `issuer`, and `date`, omitting `url` (unlike `projects.items.properties.link` at line 81).
- `frontend/src/types/resume.ts:36-40` — `GeneratedCVCertificateItem` only declares `{ name: string; issuer: string; date: string; }`, lacking `url?: string`.
- `backend/src/mishoojobs/services/agy_ai_client.py:196,263,464-538` —
  - `TAILORED_CV_PROMPT_TEMPLATE` (line 196) and `ROLE_CV_PROMPT_TEMPLATE` (line 263) define `"certificates": [ {"name": "...", "issuer": "...", "date": "..."} ]` without `"url"` and do not instruct the AI to preserve `url` from `master_profile.certificates`. (Line 128 in `PARSE_RESUME_PROMPT_TEMPLATE` also omits `"url"` in its JSON example, though line 99 mentions it.)
  - `generate_tailored_cv` (lines 464-502) and `generate_role_cv` (lines 504-538) return `parsed.get("content", {})` without deterministically hydrating or verifying `url` values from `master_profile["certificates"]`.
- `frontend/src/components/templates/TechnicalHighDensity.tsx:414-421,449-456` — Both `cert-row-*` and `certs-logros` blocks render `<span className="font-semibold text-zinc-900">{c.name}</span>` without wrapping `{c.name}` in an `<a href={...}>` element.
- `frontend/src/components/templates/ModernExecutive.tsx:380-387,420-427` — Both `cert-row-*` and `certs-logros` blocks render `<div className="font-bold text-zinc-900 ...">{c.name}</div>` without an `<a href={...}>` link.
- `frontend/src/components/templates/ClassicATS.tsx:296-305,326-330` — Both `cert-*` and `certs-logros` blocks render `<strong>{c.name}</strong> — {c.issuer} ({c.date})` without an `<a href={...}>` link.
- `frontend/src/components/LiveCVViewer.tsx:61-70,420-437` — Loads `db.resumes.get(resumeId)` and passes `resume.content` directly to templates; pre-existing resumes already stored in IndexedDB lack `certificates[].url` even when present in `db.master_profile`.
- `frontend/src/services/ats_exporter.ts:88-95,199-205` — `exportToPlainATS` and `exportToMarkdown` omit `cert.url` when formatting the `certificates` section (unlike `projects` and `header.links`).

## Root Cause Hypothesis

Although `CertificateItemSchema` (`backend/src/mishoojobs/schemas/master_profile.py:59-65`), `CertificateItem` (`frontend/src/types/master_profile.ts:56-63`), and `STARTER_MASTER_PROFILE_YAML` (`frontend/src/services/master_profile_service.ts:104-110`) all support `url` on Master Profile certificates, the generated-CV pipeline drops `url` at every downstream stage: the CV generation schema/contract (`generated-cv-schema.json`, `GeneratedCVCertificateItem`) omits `url`, the backend `agy` prompts (`TAILORED_CV_PROMPT_TEMPLATE`, `ROLE_CV_PROMPT_TEMPLATE`) omit `"url"` from the certificate output JSON template with no deterministic fallback from `master_profile.certificates`, and all three React CV templates (`TechnicalHighDensity`, `ModernExecutive`, `ClassicATS`) render `c.name` as plain text instead of an `<a href={...}>` anchor (which browsers require to emit clickable hyperlink annotations during `window.print()` PDF export).

*Confidence*: high (verified end-to-end across Master Profile schemas, backend AI prompts, TypeScript contracts, all three template components, and `ats_exporter.ts`).

## Proposed Remediation

**Preferred**:
1. **Extend Generated CV Contract & TypeScript Model**:
   - Add optional `"url": { "type": "string" }` to `certificates.items.properties` in `specs/005-master-profile-cv/contracts/generated-cv-schema.json`.
   - Add `url?: string;` to `GeneratedCVCertificateItem` in `frontend/src/types/resume.ts`.
2. **Update AI Prompts & Add Deterministic URL Hydration (`backend/src/mishoojobs/services/agy_ai_client.py`)**:
   - Update `TAILORED_CV_PROMPT_TEMPLATE` (line 196) and `ROLE_CV_PROMPT_TEMPLATE` (line 263) to include optional `"url": "..."` in the `certificates` schema example and instruct preserving exact certificate `url` values from `master_profile.certificates` when present (also add `"url"` to the example in `PARSE_RESUME_PROMPT_TEMPLATE` line 128).
   - Add a deterministic helper (e.g., `_hydrate_certificate_urls(content, master_profile)`) invoked in both `generate_tailored_cv` and `generate_role_cv` that matches generated `content.certificates` entries against `master_profile.get("certificates", [])` by normalized `(name, issuer)` or `name`, copies/enforces any valid `http(s)://` `url` from the Master Profile (protecting against LLM omission or URL hallucination), and strips unsafe schemes (`javascript:`, `data:`, etc.).
3. **Render Clickable Certificate Name Hyperlinks in All 3 Templates**:
   - Add a shared frontend URL safety helper (validating `http://` / `https://` schemes, e.g., `getSafeExternalUrl(url)`) so scraped/imported YAML values cannot inject `javascript:` links.
   - Update `TechnicalHighDensity.tsx`, `ModernExecutive.tsx`, and `ClassicATS.tsx` (both standalone certificate blocks and `certs-logros` combined blocks) so that when `c.url` resolves to a safe URL, `{c.name}` is rendered inside `<a href={safeUrl} target="_blank" rel="noreferrer" ...>{c.name}</a>` with clean typography/underline styling so browsers emit clickable PDF link annotations without breaking single-page height budgets.
4. **Hydrate Existing IndexedDB Resumes in `LiveCVViewer.tsx` & Update `ats_exporter.ts`**:
   - In `LiveCVViewer.tsx`, perform a read-only lookup of `db.master_profile.get("current")` (without triggering starter-template seeding if absent) and backfill missing `url` on `resume.content.certificates` at render time when a certificate matches `master_profile.parsed.certificates` by normalized name/issuer, so previously generated CVs in IndexedDB also gain clickable links immediately without requiring regeneration.
   - Update `exportToMarkdown` (e.g., `- **[${cert.name}](${cert.url})** - ...`) and `exportToPlainATS` (appending ` (${cert.url})` when present, matching `projects`) in `frontend/src/services/ats_exporter.ts`.

**Alternatives**:
- **Append a separate `"Ver credencial"` / raw URL link next to the certificate instead of linking the certificate name**:
  - *Trade-offs*: Adds extra horizontal/vertical text that can cause line wrapping in the compact 2-column certificate grids (`TechnicalHighDensity` and `ModernExecutive`), risking single-page height overflow (`> 976px`), and diverges from the user's explicit expectation that the **certificate names** themselves link to the certificate website.

**Files likely to change**:
- `specs/005-master-profile-cv/contracts/generated-cv-schema.json`
- `backend/src/mishoojobs/services/agy_ai_client.py`
- `frontend/src/types/resume.ts`
- `frontend/src/components/LiveCVViewer.tsx`
- `frontend/src/components/templates/TechnicalHighDensity.tsx`
- `frontend/src/components/templates/ModernExecutive.tsx`
- `frontend/src/components/templates/ClassicATS.tsx`
- `frontend/src/services/ats_exporter.ts`
- `backend/tests/test_cv_service.py`
- `frontend/tests/components/LiveCVViewer.test.tsx`
- `frontend/tests/services/ats_exporter.test.ts`

**Tests to add or update**:
- `backend/tests/test_cv_service.py`: Verify `generate_tailored_cv` and `generate_role_cv` preserve/hydrate `certificates[].url` from `master_profile` even if the mocked AI response omits `url`, and reject non-`http(s)` URLs.
- `frontend/tests/components/LiveCVViewer.test.tsx`: Verify all 3 templates (`TechnicalHighDensity`, `ModernExecutive`, `ClassicATS`, in both regular and `certs-logros` layouts) render certificate names as `<a href="https://...">` links when `url` is present, omit `<a>` for missing/unsafe URLs (e.g., `javascript:`), and backfill missing `url` from `db.master_profile` for previously saved resumes.
- `frontend/tests/services/ats_exporter.test.ts`: Verify Markdown and plain ATS exports include certificate `url` when present.

## Risks & Considerations

- **URL Sanitization / XSS Prevention**: YAML files can be user-edited or imported from untrusted files; rendering `c.url` directly in `<a href={c.url}>` without an `http:` / `https:` protocol allowlist could allow `javascript:` links. Always normalize/validate schemes before rendering `href`.
- **Pre-existing Resumes in IndexedDB**: Resumes already generated and saved in `db.resumes` before this fix lack `certificates[].url`. Read-time fallback matching in `LiveCVViewer` (against `db.master_profile.get("current")`) solves this seamlessly without a destructive Dexie schema migration, and must avoid calling `loadMasterProfile()` so empty test/browser states are not unexpectedly seeded.
- **Zero Impact on Print Layout Budget**: Linking `{c.name}` inline with `<a>` adds zero extra lines or height to certificate blocks, preserving the `976px` (`10.2in`) single-page calibration across all three templates.

## Open Questions

- [NEEDS CLARIFICATION: Should certificate URLs entered in YAML without a protocol (e.g., `aws.amazon.com/verification` instead of `https://aws.amazon.com/verification`) be auto-prefixed with `https://`, or should only explicit `http://` / `https://` URLs be rendered as hyperlinks?]
- [NEEDS CLARIFICATION: In `ClassicATS` (pure ATS text-first styling), should the certificate name be rendered as a clickable `<a>` link with subtle/default styling (no raw URL text printed inline), or should the raw URL also be printed next to it like `header.links` and `proj.link`?]
