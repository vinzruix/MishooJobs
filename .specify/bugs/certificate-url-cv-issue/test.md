# Bug Verification: Certificate Names in Generated CV / PDF Missing YAML `url` Links

- **Slug**: certificate-url-cv-issue
- **Tested**: 2026-11-11T00:37:00-06:00
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The fix holds across the entire pipeline: backend CV generation prompts and deterministic URL hydration preserve Master Profile `certificates[].url` values while blocking unsafe protocols, all three CV templates render certificate names as clickable `<a href="...">` links (with Dexie `master_profile` backfill for pre-existing resumes), and real headless Chrome PDF exports of all three templates embed clickable `/URI` link annotations (`https://aws.amazon.com/verification`) on Page 1 with zero regressions across backend, frontend, and production build checks.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix PDF export) | Rendered `TechnicalHighDensity`, `ClassicATS`, and `ModernExecutive` via Vite SSR from `STARTER_MASTER_PROFILE_YAML` + `hydrateCertificateUrls`, printed with Google Chrome `--headless=new --print-to-pdf`, and inspected PDF `/Annots` with `pypdf.PdfReader` | pass | All 3 templates produced 1-page PDFs with clickable `/URI` annotation `https://aws.amazon.com/verification` |
| New / updated backend tests | `.venv/bin/pytest backend/tests/test_cv_service.py -v` | pass | 11 passed (including `test_agy_ai_client_hydrates_certificate_urls_on_generation` with mocked `_run_cli_subprocess`) |
| New / updated frontend tests | `cd frontend && npm test -- --run tests/components/LiveCVViewer.test.tsx tests/services/ats_exporter.test.ts` | pass | 2 files, 14 passed (covers all 3 templates, `certs-logros`, XSS URL filtering, Dexie backfill, plain ATS & Markdown export) |
| Backend regression suite | `.venv/bin/pytest backend/tests/ -v` | pass | 56 passed, 1 Starlette deprecation warning |
| Frontend regression suite & build | `cd frontend && npm test -- --run && npm run build` | pass | 19 test files, 126 tests passed; `tsc && vite build` succeeded cleanly |
| Live `agy` CLI + interactive UI flow | Run live Vite + FastAPI servers and invoke `agy` CLI subprocess | skipped | Skipped per offline testing rules; covered via mocked `_run_cli_subprocess`, Vitest/JSDOM, and headless Chrome PDF check |

## Output Excerpts

```text
# Headless Chrome PDF + pypdf annotation verification across all 3 templates
RENDERED_HTML_OK [
  {
    name: 'AWS Certified Cloud Practitioner',
    issuer: 'Amazon Web Services',
    date: 'Mar 2024',
    url: 'https://aws.amazon.com/verification'
  }
]
technical: pages=1, uris=['https://github.com/smendoza', 'https://github.com/smendoza/mishoojobs', 'https://aws.amazon.com/verification']
classic: pages=1, uris=['https://aws.amazon.com/verification']
modern: pages=1, uris=['https://github.com/smendoza', 'https://github.com/smendoza/mishoojobs', 'https://aws.amazon.com/verification']
```

```text
# Backend CV service & full regression suite
11 passed, 1 warning in 0.58s
56 passed, 1 warning in 7.05s
```

```text
# Frontend tests & production build (tsc && vite build)
Test Files  19 passed (19)
      Tests  126 passed (126)
✓ 2188 modules transformed.
✓ built in 1.59s
```

## Residual Risks

- Live `agy` CLI subprocess output (`agy --print ... --output-format json`) was mocked in offline pytest per repository rules; deterministic `_hydrate_certificate_urls` in `AgyAIClient` protects against the LLM omitting `"url"` when certificate names match the Master Profile, though if an LLM renames/translates a certificate title away from the YAML `name`, deterministic lookup would not match it unless the prompt-included `"url"` field is preserved by the model.
- Headless Chrome PDF verification rendered the compiled React components and production CSS directly via Vite SSR rather than driving the full interactive React app through `window.print()`.

## Recommendation

Close the bug — verified across schema, backend URL hydration, template rendering, ATS/Markdown export, full offline test suites, TypeScript/Vite build, and headless Chrome PDF `/URI` annotation inspection.
