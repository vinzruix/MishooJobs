# Bug Fix: Certificate Names in Generated CV / PDF Missing YAML `url` Links

- **Slug**: certificate-url-cv-issue
- **Fixed**: 2026-11-11T00:35:00-06:00
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Preserved candidate certificate `url` fields end-to-end across the generated CV contract, backend `agy` prompts and deterministic hydration, IndexedDB legacy resume backfill in `LiveCVViewer`, all three CV/PDF templates, and plain ATS / Markdown exports. Certificate names with safe `http(s)` URLs now render as clickable `<a href="...">` hyperlinks so browser `window.print()` PDF exports embed clickable links to each certificate website.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `specs/005-master-profile-cv/contracts/generated-cv-schema.json` | modified | Added optional `url` property to `certificates` items |
| `backend/src/mishoojobs/services/agy_ai_client.py` | modified | Added `"url"` to CV generation prompts, `_sanitize_http_url`, `_hydrate_certificate_urls`, and shared `_build_cv_generation_result` |
| `frontend/src/types/resume.ts` | modified | Added `url?: string` to `GeneratedCVCertificateItem` |
| `frontend/src/services/cv_links.ts` | added | Shared `getSafeExternalUrl` and `hydrateCertificateUrls` helpers |
| `frontend/src/components/templates/CertificateNameLink.tsx` | added | Shared template link component rendering clickable `<a>` for safe `http(s)` URLs |
| `frontend/src/components/LiveCVViewer.tsx` | modified | Loaded `db.master_profile.get("current")` read-only to hydrate missing certificate URLs for pre-existing CVs and exports |
| `frontend/src/components/templates/TechnicalHighDensity.tsx` | modified | Rendered certificate names via `CertificateNameLink` in both `cert-row-*` and `certs-logros` blocks |
| `frontend/src/components/templates/ModernExecutive.tsx` | modified | Rendered certificate names via `CertificateNameLink` in both `cert-row-*` and `certs-logros` blocks |
| `frontend/src/components/templates/ClassicATS.tsx` | modified | Rendered certificate names via `CertificateNameLink` inside `<strong>` in both `cert-*` and `certs-logros` blocks |
| `frontend/src/services/ats_exporter.ts` | modified | Included sanitized `cert.url` in `exportToPlainATS` and `exportToMarkdown` |
| `backend/tests/test_cv_service.py` | modified | Added `test_agy_ai_client_hydrates_certificate_urls_on_generation` |
| `frontend/tests/components/LiveCVViewer.test.tsx` | modified | Added tests for clickable certificate links across all 3 templates, XSS/unsafe URL rejection, and Dexie Master Profile backfill |
| `frontend/tests/services/ats_exporter.test.ts` | modified | Updated sample CV and assertions to verify certificate URL output in plain ATS and Markdown exports |

## Diff Highlights (optional)

```python
# backend/src/mishoojobs/services/agy_ai_client.py
def _hydrate_certificate_urls(content: Dict[str, Any], master_profile: Dict[str, Any]) -> None:
    """Ensure generated CV certificates retain valid http(s) URLs from the Master Profile."""
    ...
    matched_url = by_name_issuer.get((name_key, issuer_key)) or by_name.get(name_key)
    if matched_url:
        cert["url"] = matched_url
        continue
    safe_existing = _sanitize_http_url(cert.get("url"))
    if safe_existing:
        cert["url"] = safe_existing
    else:
        cert.pop("url", None)
```

```tsx
// frontend/src/components/templates/CertificateNameLink.tsx
export const CertificateNameLink: React.FC<CertificateNameLinkProps> = ({
  name,
  url,
  className,
  linkClassName = "underline",
}) => {
  const safeUrl = getSafeExternalUrl(url);
  if (!safeUrl) {
    return <span className={className}>{name}</span>;
  }

  return (
    <a href={safeUrl} target="_blank" rel="noreferrer" className={[className, linkClassName].filter(Boolean).join(" ")}>
      {name}
    </a>
  );
};
```

## Tests Added or Updated

- `backend/tests/test_cv_service.py::test_agy_ai_client_hydrates_certificate_urls_on_generation` — Pins prompt schema inclusion of `"url"`, deterministic URL backfill from `master_profile["certificates"]` across both tailored and role CV generation, `www.` normalization to `https://`, and rejection of unsafe `javascript:` URLs.
- `frontend/tests/components/LiveCVViewer.test.tsx` (`renders certificate names as clickable https links across all 3 templates and omits unsafe URLs`) — Pins `<a href="https://..." target="_blank" rel="noreferrer">` rendering across `TechnicalHighDensity`, `ClassicATS`, and `ModernExecutive` (both standalone and `certs-logros` layouts) and verifies `javascript:`/empty URLs render as plain text.
- `frontend/tests/components/LiveCVViewer.test.tsx` (`hydrates missing certificate URLs from Master Profile in Dexie for previously saved resumes`) — Pins read-only `db.master_profile.get("current")` backfill for pre-existing IndexedDB resumes lacking `certificates[].url`.
- `frontend/tests/services/ats_exporter.test.ts` — Pins certificate URL inclusion in both `exportToPlainATS` and `exportToMarkdown`.

## Local Verification

- Commands run: `.venv/bin/pytest backend/tests/ -v` → `56 passed, 1 warning in 7.51s`
- Commands run: `cd frontend && npm test -- --run` → `19 passed` test files, `126 passed` tests in `2.35s`
- Commands run: `cd frontend && npx tsc --noEmit` → exit code `0` (zero TypeScript errors)

## Deviations from Assessment

- Extracted two small shared modules (`frontend/src/services/cv_links.ts` and `frontend/src/components/templates/CertificateNameLink.tsx`) instead of duplicating URL sanitization and `<a>` link rendering across `LiveCVViewer.tsx`, `ats_exporter.ts`, and six certificate blocks in the three template components.
- Resolved the open URL-scheme question by auto-prefixing `www.` URLs with `https://` while requiring explicit `http://` or `https://` protocols for all other values, preventing arbitrary strings or `javascript:` payloads from becoming hyperlinks.
- Resolved the `ClassicATS` display question by wrapping `{c.name}` in an `<a>` inside `<strong>` without printing raw URL text inline, keeping the certificate line compact and matching the user's request that certificate names link to the certificate website.

## Follow-ups

- Manual verification in a browser: open a generated CV in `LiveCVViewer`, click **Descargar PDF**, save as PDF, and confirm clicking the certificate name in the PDF viewer navigates to the YAML `url`.
