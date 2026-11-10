# Research & Technical Decisions: Master Career Knowledge Base & Dynamic AI CV Generator

**Feature Branch**: `005-master-profile-cv`  
**Date**: 2026-11-09  
**Status**: Completed  

---

## 1. Master Profile Storage & Client-Side YAML Parsing

### Context & Problem
Candidates need to maintain an exhaustive, single source of truth containing 100% of their academic, personal, and professional history without server storage or cloud accounts (Principle I & Principle IV). The format must be human-readable, structured, editable by developers, and easily extensible over time.

### Decision
Use **YAML** as the canonical serialization format for the Master Profile document, parsed and validated entirely client-side using the **`yaml`** npm package (v2.7+). Store the current document in Dexie (`mishoojobs_local_db` version 2) in a dedicated table `master_profile`.

### Rationale
1. **Developer Experience**: YAML supports comments, multi-line string preservation (e.g., STAR bullet highlights, summaries), and clean nested categorization without the JSON quote/comma clutter.
2. **Zero-Dependency Lightweight Client Parsing**: The standard `yaml` package has 0 dependencies, weighs <45KB minified, supports exact line/column error reporting for syntax validation, and runs identically in browser and headless Vitest environments.
3. **Reactive In-Browser Editor**: A high-contrast zinc monospace editor (`Geist Mono`) with line numbers, instant error highlighting (rose badge displaying line number and error detail), and valid status (emerald badge) prevents saving corrupted state.

### Alternatives Considered
- *JSON*: Rejected due to rigid syntax, absence of comments, and high friction for manual multi-line text editing.
- *Monaco Editor / CodeMirror 6*: Rejected as overly heavy (>2MB bundle overhead); a custom Geist Mono textarea with line gutter and real-time AST validation gives faster rendering, <10KB bundle impact, and identical UX.
- *IndexedDB Object Tree Only (No YAML)*: Rejected because candidates cannot easily import, export, or version-control their career knowledge base as a single clean file.

---

## 2. Headshot Photo Management & Storage Isolation

### Context & Problem
Resumes for early-career developers in Mexico frequently feature an optional headshot photo (FR-016). Inlining Base64 image data inside the Master Profile YAML would expand the text file by 10,000+ lines, destroying editor performance and readability.

### Decision
Isolate the candidate's photo binary in a dedicated Dexie table:
- Table: `master_profile_photo`
- Primary Key: `id: "current"`
- Schema: `{ id: "current", blob: Blob, mime_type: string, updated_at: string }`
- Reference in YAML: `personal_info.photo: true | false`

### Rationale
1. **Decoupled Text & Binary**: Keeps the YAML document lightweight (<10KB) and instant to serialize/parse.
2. **Memory Efficiency**: The photo is retrieved only when rendering templates or avatar previews via `URL.createObjectURL(blob)`, revoked on unmount to prevent browser memory leaks.
3. **Client-Side Optimization**: Uploaded images are pre-processed via an off-screen HTML5 `<canvas>` to max 512x512 resolution (WEBP or JPEG, ~80KB max), avoiding IndexedDB quota bloat.

### Alternatives Considered
- *Inlining Base64 in YAML*: Rejected due to severe editor lag and unreadable YAML files.
- *Local File System API*: Rejected due to browser permission hurdles and lack of Safari support.

---

## 3. Stateless Ephemeral Resume Parser Backend (`POST /cv/parse-resume`)

### Context & Problem
Candidates often have existing resumes in PDF or Markdown format that need to be ingested into the canonical Master Profile YAML schema without manual copy-pasting (FR-003). MishooJobs strictly forbids saving candidate PII on backend servers or databases (Principle I).

### Decision
Implement an ephemeral, stateless FastAPI endpoint `POST /cv/parse-resume` using `multipart/form-data`:
1. **Extraction**:
   - `.pdf`: Extracted via `pypdf.PdfReader` directly in-memory from bytes.
   - `.md` / `.txt`: Decoded directly as UTF-8 string.
   - `.yml` / `.yaml`: Validated directly without AI if already matching canonical schema.
2. **Structuring via `agy` CLI**:
   - `AgyAIClient` invokes local `agy` CLI subprocess with a structured prompt instructing the model to map unstructured text into the canonical `MasterProfileData` JSON schema.
3. **Conversion & Zero Storage**:
   - Validates JSON with Pydantic v2 `MasterProfileSchema`.
   - Serializes into clean, formatted YAML with `pyyaml`.
   - Returns `{ yaml_content: str, warnings: list[str] }` directly to the client in HTTP 200 response.
   - Strictly zero database rows created; zero temp files persisted on disk.

### Rationale
- Complies 100% with Principle I (Zero Candidate PII in PostgreSQL).
- Reuses the zero-cost `agy` CLI infrastructure already operational in `backend/src/mishoojobs/services/agy_ai_client.py`.
- Tested 100% offline via static PDF/Markdown mock fixtures in `backend/tests/fixtures/`.

### Alternatives Considered
- *In-browser PDF text extraction via PDF.js*: While `pdfjs-dist` is in `package.json`, browser-only extraction struggles with complex two-column PDF streams and requires a massive client-side LLM call. Delegating to the local `agy` CLI via a stateless endpoint leverages Python's mature `pypdf` + `agy` pairing cleanly.

---

## 4. Dynamic AI CV Generation: Vacancy Tailoring & Role Archetypes

### Context & Problem
Generating a compelling, ATS-optimized, 1-page CV requires curating the most relevant 2-4 experiences and 2-3 projects, rephrasing bullets into the STAR format (Situation, Task, Action, Result) with strong action verbs, and matching vacancy tech stack, all while strictly adhering to an anti-hallucination fact shield (FR-008, FR-009, FR-010, FR-011, FR-012).

### Decision
Add two dedicated methods to `AgyAIClient` and corresponding FastAPI routes:
1. `POST /cv/generate-tailored`: Contextual to a target job vacancy.
2. `POST /cv/generate-role`: Contextual to a target role title and focus tags.

Both endpoints:
- Accept candidate's parsed Master Profile JSON + Target Context + Target Language (`es` or `en`).
- Execute local `agy` CLI with rigid prompt constraints:
  - **STAR Rephrasing**: Action verb + context + measurable result (if present in master data).
  - **Anti-Hallucination Fact Shield**: Model must use ONLY skills, dates, companies, and achievements explicitly provided. Adding fictitious metrics (e.g., "improved performance by 47%" when master says "optimized queries") is forbidden.
  - **1-Page Word Budget**: Max 500 total words, capped at 3-4 bullets per role, ensuring 100% fit on a single letter page.
  - **Language Localization**: Mexican Spanish by default, or professional US/UK English when toggled to EN.
- Return structured `GeneratedCVData` JSON. The client saves the result directly into Dexie's `resumes` table.

### Rationale
- Completely decoupled from PostgreSQL: resumes live in the candidate's browser.
- Sub-20s response time utilizing local Gemini subscription without external API rate limits or costs.

---

## 5. High-Density Formal Templates, Inline Editing & Two-Way Sync

### Context & Problem
Recruiters in engineering demand high data density with zero wasted whitespace. At the same time, candidates need immediate editing flexibility in the browser and the ability to export a perfect single-page PDF or ATS text (FR-013, FR-014, FR-015, FR-017, FR-018).

### Decision
1. **Three Built-in High-Density Templates**:
   - **Technical High-Density Formal** (Default): 2-column layout (Header: Photo + Name/Title + About Me; Left 35%: Contact + Categorized Tech Stack + Languages; Right 65%: Projects/Experience with STAR bullets + Education + Certificates + Logros Académicos).
   - **Classic ATS Single-Column**: Linear layout strictly following traditional corporate ATS guidelines.
   - **Modern Executive**: Minimalist zinc border styling with prominent project highlights.
2. **Inline Click-to-Edit Engine**:
   - Every text element in the Live CV Viewer is editable in-place (`contentEditable` or controlled inputs).
   - Edits immediately mutate the active CV object and persist to Dexie (`resumes` table).
   - Includes a "Guardar mejoras en Perfil Maestro" modal that displays diffs and lets the candidate cherry-pick polished STAR bullets or improved summaries to commit back into the Master Profile YAML.
3. **Single-Page Constraint & Height Boundary Warning**:
   - Uses CSS print rules:
     ```css
     @page { size: letter; margin: 0.4in; }
     @media print {
       body { background: white !important; }
       .cv-canvas { width: 100% !important; margin: 0 !important; }
     }
     ```
   - Client-side DOM measurement calculates vertical height against a standard 1-page canvas ratio. If content spills over, a high-contrast warning badge (`[PÁGINA EXCEDIDA: El contenido excede 1 página]`) alerts the candidate.

---

## 6. Universal Platform Skills Synchronization & Deprecation of Legacy Parser

### Context & Problem
The legacy `resume_parser.ts` relied on fragile hardcoded regex dictionaries to extract skills for job compatibility matching. The new Master Profile contains a comprehensive categorized `tech` section that should serve as the canonical source of truth for the entire platform (FR-007).

### Decision
1. Create `frontend/src/services/master_profile_skills.ts`:
   - Extracts all technical skills across `tech.backend`, `tech.frontend`, `tech.databases`, `tech.messaging_distributed`, `tech.ai_data`, `tech.devops_cloud`, `tech.tools`, and `projects.technologies`.
   - Returns normalized lowercase unique string array.
2. Refactor `heuristic_scorer.ts`:
   - Consume skills directly from the active Master Profile.
3. Clean Deprecation:
   - Upgrade Dexie to `version(2)`.
   - Deprecate `candidate_profiles` table without destructive data loss; initialize `master_profile` with a comprehensive Mexican engineering starter template if empty.

---

## 7. Dual ATS Text & Markdown Clipboard Export

### Context & Problem
Different applicant tracking systems (Workday, Taleo, Greenhouse) behave unpredictably when candidates paste rich text or Markdown containing asterisks, brackets, or emojis.

### Decision
Provide a split-action copy button:
1. **Copiar Texto ATS (Plano)** (Default):
   - Strips all markdown syntax.
   - Uppercase standardized headings: `INFORMACIÓN DE CONTACTO`, `RESUMEN PROFESIONAL`, `EXPERIENCIA LABORAL`, `PROYECTOS TÉCNICOS`, `HABILIDADES TÉCNICAS`, `EDUCACIÓN`, `CERTIFICACIONES`, `LOGROS ACADÉMICOS`.
   - Unicode dash bullets (`- `) and pipe-separated contact links (`correo@ejemplo.com | +52 55... | github.com/...`).
2. **Copiar Markdown**:
   - Full GitHub Flavored Markdown with `#`, `**`, and bullet lists.

---

## 8. Summary of Technical Decisions Matrix

| Area | Decision | Primary Rationale |
|---|---|---|
| Master Profile Format | YAML via `yaml` npm package | Human-editable, supports comments, clean nested tech stack |
| Photo Storage | Dexie `master_profile_photo` (Blob) | Prevents base64 bloating of YAML text editor |
| PDF/MD Ingestion | Ephemeral `POST /cv/parse-resume` via `pypdf` + `agy` | Zero candidate data stored on backend; reuses local LLM |
| CV Generation | Ephemeral `POST /cv/generate-tailored` & `/generate-role` | Anti-hallucination STAR rephrasing with single-page budget |
| Local Persistence | Dexie `version(2)` (`master_profile`, `master_profile_photo`, `resumes`) | 100% client-side privacy; survives reloads |
| Navigation | Top-level "Mis CVs" tab | Easy management and switching between generated resumes |
