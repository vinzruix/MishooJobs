# Feature Specification: Master Career Knowledge Base & Dynamic AI CV Generator

**Feature Branch**: `005-master-profile-cv`

**Created**: 2026-11-09

**Status**: Draft

**Input**: User description: "Feature: Master Career Knowledge Base & Dynamic AI CV Generator. Deprecate and completely replace the legacy static CV upload mechanism and regex-based skill parser with an intelligent, centralized Master Career Knowledge Base (direct .yml/.yaml, Markdown, and PDF upload) that stores 100% of a candidate’s career history. Stored permanently in client-side IndexedDB so the user can continuously enrich their career history and academic achievements over time. This Master Profile serves as the new canonical, single source of truth across the entire platform for candidate information and technical skills (powering real-time job fit scores and AI gap analyses). Leverage AI to dynamically curate, rephrase, and generate hyper-tailored, ATS-optimized CVs in two scenarios: One-Click Vacancy Tailoring (contextual to a job post) and Role Archetype Generation (custom career tracks like 'AI Engineer' or 'Web Developer'). CV templates must be strictly professional, formal, and high-density (two-column layout: photo, About Me, Contact, Categorized Tech Stack [Backend, Frontend, Databases, Messaging, AI], Projects/Experience with STAR bullets, Education, Certificates, and Logros Académicos), maximizing page coverage with zero wasted whitespace, print-ready PDF, ATS text export, and strictly zero server-side candidate data storage."

## Clarifications

### Session 2026-11-09
- Q: How should the system determine the target language (Spanish vs. English) when generating a vacancy-tailored CV or role archetype? (FR-008, FR-012) → A: Default to Spanish with an interactive language toggle (ES / EN) in the generation dialog allowing candidates to switch to English on demand.
- Q: How should the candidate profile headshot photo be stored and represented in the Master Profile YAML and in-browser editor? (FR-001, FR-016) → A: Store the image as an isolated Blob asset in a dedicated IndexedDB table (`master_profile_photo`) managed via an avatar upload UI widget, keeping the YAML text document clean, performant, and human-readable with a lightweight reference flag (`photo: true`).
- Q: When a candidate edits bullet points, summaries, or skills inline in the Live CV Viewer, should those edits remain exclusive to that specific CV or offer an option to sync back to the Master Profile? (FR-017) → A: Keep edits isolated to the active CV by default, with an explicit optional action ("Guardar mejoras en Perfil Maestro") to push polished bullet points or summary phrasing back to the Master Profile.
- Q: How should existing legacy candidate data in IndexedDB (`candidate_profiles`) be handled when a returning user opens the new Master Profile interface for the first time? (FR-001, FR-007) → A: Do not migrate legacy profile data; cleanly deprecate legacy records and initialize the Master Profile with a clean structured YAML starter template, allowing the candidate to upload their complete YAML/PDF/Markdown file fresh.
- Q: What format should the clipboard text export produce to ensure maximum compatibility across different applicant tracking systems and recruitment platforms? (FR-018) → A: Split copy action defaulting to "Copiar Texto ATS (Plano)" (clean unadorned text without Markdown punctuation) with a secondary "Copiar Markdown" option.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Master Career Knowledge Base Ingestion & Structured Management (Priority: P1)

As an early-career developer or engineering student, I want to upload my complete career data (via direct `.yml`/`.yaml` file, PDF, or Markdown) to bootstrap a centralized, structured Master Career Knowledge Base that stores 100% of my academic and professional history locally, so that it persists permanently in my browser for ongoing enrichment and I never have to re-enter my background when generating resumes.

**Why this priority**: Fundamental cornerstone of the entire feature. Without a validated, locally persisted single source of truth containing 100% of the candidate's career history (work experience, projects, categorized tech stack, education, certifications, and academic achievements), dynamic tailoring and universal skill scoring cannot function.

**Independent Test**: Upload a structured `.yml` file (or PDF/Markdown resume). Verify that the system loads the content into a structured YAML editor with distinct typed sections (`personal_info`, `tech`, `languages`, `experience`, `projects`, `education`, `certificates`, `logros_academicos`), validates syntax in real time, saves it permanently to IndexedDB, and maintains state across browser reloads so the candidate can continuously add new entries over time.

**Acceptance Scenarios**:

1. **Given** a candidate with an existing `.yml`/`.yaml` file, **When** they upload or paste it into the Master Profile view, **Then** the system loads the structured data into the in-browser YAML editor with line numbers and syntax validation.
2. **Given** a candidate with an unstructured PDF or Markdown resume, **When** they upload the file, **Then** an ephemeral stateless backend endpoint extracts the text (using `pypdf` for PDF / UTF-8 text for Markdown) and structures the data into the canonical YAML schema via local `agy` CLI, returning it in-memory with strictly zero database persistence.
3. **Given** an existing populated Master Profile in IndexedDB, **When** the candidate attempts to upload a new resume file, **Then** the system presents a destructive confirmation modal warning that uploading will replace current profile data, requiring explicit confirmation before overwriting.
4. **Given** the candidate editing their YAML document, **When** syntax errors occur, **Then** the system displays a clear rose diagnostic error badge; when syntax is valid, it displays an emerald confirmation badge.
5. **Given** a candidate saves their Master Profile, **Then** all profile data (including optional headshot photo, categorized tech stack, education, certifications, and academic achievements) is saved permanently in client-side IndexedDB (`mishoojobs_local_db`), surviving page reloads and browser sessions without transmitting candidate PII to external servers or databases.

---

### User Story 2 - Universal Platform Skills Synchronization & Fit Scoring (Priority: P1)

As a candidate browsing the live job feed, I want the technical skills curated in my Master Profile to serve as the platform-wide source of truth for all job matching, so that search card compatibility scores and in-depth AI gap analyses reflect my complete and up-to-date skillset without manual re-entry.

**Why this priority**: Replaces the legacy, fragile regex parser (`resume_parser.ts`) with a unified skills engine. Job fit calculations must immediately reflect the candidate's actual qualifications from their master repository.

**Independent Test**: Add new technical skills (e.g., "FastAPI", "PostgreSQL", "Kafka") under the categorized `tech` section in the Master Profile and save. Navigate to the job search feed and verify that vacancies requiring those skills immediately reflect updated compatibility percentages and match badges.

**Acceptance Scenarios**:

1. **Given** an active Master Profile containing categorized skills, **When** the candidate views job search cards, **Then** real-time heuristic match scores (`calculateHeuristicScore`) and matching skill badges are calculated directly against the Master Profile skills.
2. **Given** the candidate requests an in-depth AI vacancy fit evaluation (`evaluateVacancyFit`), **Then** the evaluation engine evaluates qualifications using the comprehensive Master Profile skills, experience, and academic background.
3. **Given** an update to skills in the Master Profile, **When** the candidate returns to the search feed, **Then** all compatibility indicators update dynamically without requiring a full page refresh.

---

### User Story 3 - One-Click Vacancy-Tailored CV Generation (Priority: P1)

As a candidate viewing an attractive job posting, I want to click a single action button to generate an ATS-optimized, 1-page CV tailored specifically to that vacancy's requirements, so that I can apply with a compelling, highly relevant resume in seconds.

**Why this priority**: Core value proposition. Eliminates hours of manual resume tweaking while ensuring high relevance, STAR-method impact phrasing, and strict ATS readability.

**Independent Test**: Navigate to any vacancy detail view, click the "Generar CV Adaptado" action, observe progress feedback, and verify that the generated CV highlights the vacancy's core skills, curates the top relevant experiences (2-4 roles) and projects (2-3 projects), rephrases bullet points with action verbs, and links to the target vacancy in the candidate's resume library.

**Acceptance Scenarios**:

1. **Given** a candidate viewing a job vacancy, **When** they click "Generar CV Adaptado", **Then** the generation dialog defaults to Spanish with an interactive toggle (ES / EN) allowing generation in English, analyzing the vacancy requirements (tech stack, seniority level, domain keywords) against the Master Profile and producing a curated resume in the chosen language.
2. **Given** generated resume content, **When** evaluating experience bullet points, **Then** bullets are rephrased using the STAR method emphasizing relevant technologies and outcomes without inventing unlisted metrics, companies, or dates (anti-hallucination fact shield).
3. **Given** the generated CV, **When** checking the total word count and layout, **Then** the content conforms to a strict 1-page budget (max 500 words) ensuring it fits on a single printed page.
4. **Given** completion of generation, **Then** the new tailored CV is automatically saved to the local Resume Library in IndexedDB with an association to the target vacancy and opens in the Live CV Viewer.

---

### User Story 4 - Role Archetype Baseline CV Generation (Priority: P2)

As a candidate pursuing multiple career tracks (e.g., "AI Engineer" and "Fullstack Web Developer"), I want to generate evergreen archetype resumes tailored to specific roles without linking to a specific vacancy, so that I have ready-to-use baseline resumes for general networking and career fairs.

**Why this priority**: Provides broad flexibility for candidates applying proactively to general talent pools or career tracks that do not have a single specific job listing.

**Independent Test**: Open the role archetype creation dialog, enter a target role title (e.g., "Frontend Developer") and optional focus tags (e.g., "React, TypeScript, Tailwind"), generate the CV, and verify that the resulting resume emphasizes frontend skills, projects, and experiences, tagged with an emerald role badge in the library.

**Acceptance Scenarios**:

1. **Given** a candidate initiating role archetype generation, **When** they specify a target role title and focus tags, **Then** the dialog defaults to Spanish with an interactive toggle (ES / EN) for English generation, and the system curates a baseline resume rebalancing headlines, summary, and experience highlights for that specialization in the selected language.
2. **Given** the generated role CV, **When** saved to the Resume Library, **Then** it is visually tagged with a distinct role archetype badge (e.g., `[ ROL: Frontend Developer ]`).
3. **Given** a role archetype CV in the library, **When** the candidate opens it, **Then** they can preview, customize, and export it identical to vacancy-linked CVs.

---

### User Story 5 - High-Density Formal Templates, Inline Editing & Dual Export (Priority: P2)

As a candidate preparing to submit an application, I want to preview my tailored CV in a professional, formal high-density layout (with photo, categorized tech stack, academic achievements, and zero dead whitespace), edit any text inline on the preview, and export cleanly to print-ready PDF or copy ATS-friendly text, so that I can submit my application in the required format for any hiring platform.

**Why this priority**: High-fidelity delivery mechanism. Candidates need versatile, professional formats: a dense visual PDF for human recruiters that completely fills the single-page canvas without empty gaps, and clean text for ATS portals.

**Independent Test**: Open a generated CV in the viewer. Observe the default "Technical High-Density Formal" two-column layout modeled after engineering standards (photo, contact, categorized tech stack, languages, projects with dense STAR bullets, education, certifications, and academic achievements). Click on any summary or bullet point to edit it inline and verify instant layout reflow and auto-save. Click "Descargar PDF" to trigger calibrated print styling; click "Copiar Markdown" and verify formatted text is copied to clipboard.

**Acceptance Scenarios**:

1. **Given** a generated CV in the Live CV Viewer, **When** rendered, **Then** it defaults to the "Technical High-Density Formal" layout featuring:
   - Full-width header: Candidate photo (left), Name + Subtitle (uppercase bold), and concise `ABOUT ME` summary statement.
   - Left column (~35% width): `CONTACT` (email, phone, location, links), `TECH` (categorized breakdown of Backend, Frontend, Databases, Messages, AI with Languages, Frameworks, Architectures, Patterns), and `LANGUAGES`.
   - Right column (~65% width): `PROJECTS` / `EXPERIENCE` with dense action-verb STAR bullet points, `EDUCATION`, `CERTIFICATES`, and `LOGROS ACADEMICOS`.
   - Zero wasted whitespace: Layout styles actively distribute content to fill the page canvas without awkward blank voids.
2. **Given** a generated CV in the Live CV Viewer, **When** switching to alternate built-in templates ("Classic ATS Single-Column", "Modern Executive"), **Then** the layout switches instantly in the client without re-running AI generation or making network requests.
3. **Given** a candidate toggling the photo option, **When** the photo is disabled, **Then** the layout dynamically reflows text containers to fill available whitespace without blank gaps.
4. **Given** a candidate viewing a generated CV, **When** they click directly on any text element (headline, summary, experience bullets, project highlights, skills), **Then** they can edit the text inline with immediate visual reflow and auto-save to that CV in IndexedDB, with an optional action ("Guardar mejoras en Perfil Maestro") allowing them to sync refined bullet points or summary text back to the Master Profile.
5. **Given** the candidate clicks "Descargar PDF", **Then** the system triggers a print-calibrated view producing a clean, single-page vector PDF without awkward pagination splits.
6. **Given** the candidate copies resume text, **When** clicking "Copiar Texto ATS", **Then** the split-action defaults to "Copiar Texto ATS (Plano)" producing unadorned text (clean uppercase headers, unicode bullet dashes, zero Markdown symbols) optimized for universal ATS form pasting, with an accessible secondary action to "Copiar Markdown".

---

### User Story 6 - Dedicated "Mis CVs" Resume Library Management (Priority: P3)

As an active job seeker with multiple applications underway, I want a dedicated top-level "Mis CVs" tab in the main header navigation to review, duplicate, inline-edit, and delete all my tailored and role-based resumes in a centralized local Resume Library, so that I can easily keep track of which resume version was used for each company.

**Why this priority**: Organizational convenience. Prevents confusion when managing dozens of concurrent job applications and provides 1-click access to the candidate's portfolio of generated CVs.

**Independent Test**: Navigate to the "Mis CVs" tab in the header. Verify that all saved CVs are displayed with clear category badges (Vacancy-linked vs. Role Archetype), active counter badge, creation dates, and quick action buttons (Preview, Edit Content, Duplicate, Delete).

**Acceptance Scenarios**:

1. **Given** a candidate navigating the platform, **When** they click the "Mis CVs" tab in the header, **Then** the system renders the Resume Library view displaying each saved resume with its target title, creation timestamp, and distinctive badge indicating whether it is vacancy-linked or role-based.
2. **Given** a vacancy-linked resume, **When** viewing its entry, **Then** it displays the associated company name and job title.
3. **Given** a candidate selecting "Duplicar" or "Editar Contenido", **Then** they can create an editable copy or update content directly via inline editing in the Live CV Viewer.
4. **Given** a candidate deleting a resume, **Then** the record is permanently removed from local browser storage after confirmation.

---

### Edge Cases

- **Incomplete / Empty Master Profile**: If a candidate attempts to generate a tailored or role CV while their Master Profile contains fewer than 1 experience/project or fewer than 2 technical skills, generation halts immediately with a helpful guidance message instructing them to complete their core profile first.
- **Missing or Failed Photo Upload**: If no photo is uploaded, or if the photo file is corrupted, all templates automatically expand text containers to fill whitespace gracefully without visual broken-image artifacts.
- **Career Switcher / Extensive Irrelevant History**: When a candidate has extensive past experience unrelated to the target role, the curation engine condenses unrelated roles into single-line summaries, reserving maximum space and prominence for relevant projects and transferable skills.
- **Page Overflow Prevention on Inline Edits**: If a candidate manually adds text that exceeds the 1-page canvas height, the Live CV Viewer displays a high-contrast warning badge alerting the candidate that content exceeds 1 physical page.
- **Multiple CVs for Same Vacancy**: If a candidate generates a tailored CV for a vacancy that already has a linked resume, the system generates a new revision with an incremented revision identifier (e.g., "Stripe - AI Engineer (Rev 2)") without overwriting the previous record unless chosen.
- **Syntax Corruption in Master Profile Editor**: If the candidate manually edits the structured YAML and introduces formatting errors, the system prevents saving, highlights the error location with a rose badge, and preserves the last valid state in storage until corrected.
- **Mobile Device Access**: When viewed on smaller screens, the Live CV Viewer provides horizontal pan/zoom or scaled-down viewport rendering while preserving exact print geometry when triggering PDF download.
- **Local Storage Limitations**: If local browser storage quota is near capacity, the system warns the candidate before large photo additions and suggests optimizing image dimensions.
- **Clean Deprecation of Legacy Profiles**: Existing records in the legacy `candidate_profiles` table are ignored; the Master Profile initializes with a clean, fully commented structured YAML starter template, prompting the candidate to import their comprehensive resume file fresh.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a centralized Master Career Knowledge Base storing complete, unbounded candidate career data serialized as a structured YAML document with strict hierarchical typed keys (`personal_info`, `tech`, `languages`, `experience`, `projects`, `education`, `certificates`, `logros_academicos`, `links`), storing candidate headshot photo binaries as isolated IndexedDB Blob assets referenced via a lightweight flag (`photo: true`) to prevent Base64 clutter in the YAML text editor.
- **FR-002**: System MUST allow direct upload and export of `.yml` and `.yaml` files into and out of the Master Career Knowledge Base.
- **FR-003**: System MUST parse uploaded PDF and Markdown resume documents into the standardized structured YAML format via an ephemeral stateless backend endpoint that extracts raw text (using `pypdf` for PDF / UTF-8 text for Markdown) and structures data with local `agy` CLI, returning the YAML directly to the client with strictly zero server-side persistence or disk retention.
- **FR-004**: System MUST require explicit candidate confirmation through a destructive confirmation modal before overwriting an existing populated Master Profile during file upload.
- **FR-005**: System MUST validate the structured YAML document syntax in real-time in the editor, displaying line-by-line diagnostic error badges (rose) or confirmation badge (emerald) and disabling save while invalid.
- **FR-006**: System MUST persist the Master Profile permanently in client-side IndexedDB (`mishoojobs_local_db`), maintaining all candidate data across browser sessions and reloads with zero server-side transmission.
- **FR-007**: System MUST synchronize the active technical skills from the Master Profile across the platform, completely replacing legacy regex parsing for search card compatibility scoring and deep AI fit evaluations, cleanly deprecating legacy candidate profile data without automatic migration.
- **FR-008**: System MUST generate a vacancy-tailored CV directly from any job vacancy detail view, defaulting to Spanish with an interactive toggle (ES / EN) allowing generation in English, curating the top relevant experiences (2-4 roles) and projects (2-3 projects) matching the vacancy requirements.
- **FR-009**: System MUST rephrase experience and project bullet points using the STAR method (Situation, Task, Action, Result) with strong action verbs aligning with target vacancy keywords.
- **FR-010**: System MUST enforce an anti-hallucination fact shield prohibiting the invention of metrics, company names, dates, degrees, certifications, or technologies not present in the Master Profile.
- **FR-011**: System MUST enforce a strict 1-page budget on all generated resumes via AI generation word limits (max 500 words, capped bullets per role), print-calibrated CSS (`@page { size: letter; margin: 0.5in; }`, `break-inside: avoid; overflow: hidden`), and a visual page-boundary indicator in the Live CV Viewer warning the candidate if manual edits exceed single-page height.
- **FR-012**: System MUST support on-demand generation of evergreen Role Archetype CVs based on candidate-specified target role titles and focus tags without requiring a vacancy link, defaulting to Spanish with an interactive toggle (ES / EN) allowing generation in English.
- **FR-013**: System MUST provide a primary "Technical High-Density Formal" two-column template modeled after professional engineering standards, featuring photo, `ABOUT ME` summary, `CONTACT`, categorized `TECH` stack, `LANGUAGES`, `PROJECTS`/`EXPERIENCE` with STAR bullets, `EDUCATION`, `CERTIFICATES`, and `LOGROS ACADEMICOS`, designed to eliminate dead white space.
- **FR-014**: System MUST provide at least two additional built-in ATS-compliant visual templates ("Classic ATS Single-Column", "Modern Executive") that switch instantly client-side without network requests.
- **FR-015**: System MUST strictly restrict templates to built-in system designs, prohibiting custom user HTML/CSS upload to ensure formatting stability and print reliability.
- **FR-016**: System MUST provide an optional photo toggle switch and dedicated avatar uploader that dynamically adjusts layout grids and text margins when the photo is omitted, eliminating blank gaps, while storing the photo image as an isolated IndexedDB Blob in `master_profile_photo`.
- **FR-017**: System MUST enable in-place click-to-edit directly on rendered template elements (headline, summary, bullets, skill badges) in the Live CV Viewer with instant visual reflow and auto-save to that specific CV in IndexedDB, providing an explicit optional action ("Guardar mejoras en Perfil Maestro") to sync chosen refined phrasing back to the Master Profile.
- **FR-018**: System MUST provide dual export capabilities: a print-calibrated single-page vector PDF download and a clipboard export action featuring a split copy control defaulting to "Copiar Texto ATS (Plano)" (clean unadorned text without Markdown syntax errors) with an accessible secondary "Copiar Markdown" option.
- **FR-019**: System MUST persist all candidate data, master profile contents, photos, and generated resumes strictly in local browser storage with zero candidate records transmitted to external servers or databases.
- **FR-020**: System MUST halt CV generation with clear explanatory guidance if the candidate's Master Profile contains fewer than 1 experience/project entry or fewer than 2 technical skills.
- **FR-021**: System MUST provide a dedicated "Mis CVs" top-level navigation tab housing the local Resume Library interface, allowing candidates to view, preview, duplicate, inline-edit content directly within the Live CV Viewer, and delete all generated resumes with automatic local persistence to IndexedDB.

### Key Entities *(include if feature involves data)*

- **Master Profile**: The canonical, unbounded career repository representing 100% of a candidate's background serialized as a structured YAML document. Contains `personal_info` (name, target role, contact details, location, links, `photo: true/false`), `tech` (categorized technical stack breakdown: Backend, Frontend, Databases, Messages, AI, etc. with Languages, Frameworks, Architectures, Patterns), `languages` (language proficiency), `experience` (array of historical roles with employer, title, dates, and bullet points), `projects` (array of projects with title, tech stack, summary, and links), `education` (degrees, institutions, dates), `certificates` (certifications, issuers, dates), and `logros_academicos` (academic competitions, awards, hackathons). Candidate headshot binary data is isolated in a separate IndexedDB table (`master_profile_photo`) to keep YAML text lightweight.
- **Tailored Resume (CV Vacante)**: A curated, vacancy-specific resume document derived from the Master Profile. Contains a tailored headline, targeted executive summary (2-3 sentences), curated experiences and projects with STAR-rephrased bullets, matched skill groups, an estimated ATS match score, and a direct binding to the target vacancy fingerprint.
- **Role Archetype Resume (CV Rol)**: An evergreen career resume derived from the Master Profile tailored to a broad job title or career track (e.g., "AI Engineer", "Frontend Developer") without a specific vacancy link.
- **Visual Template**: Predefined layout configuration ("Technical High-Density Formal", "Classic ATS Single-Column", "Modern Executive") defining typography, spacing, multi-column or single-column layout, and photo placement calibrated for screen rendering and single-page physical printing with zero dead whitespace.
- **Resume Library**: The local collection of all generated resumes persisted in browser storage under `mishoojobs_local_db`, accessible via the "Mis CVs" navigation tab.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Candidates can import an existing `.yml`, Markdown, or PDF resume into a populated, structured Master Profile in under 15 seconds.
- **SC-002**: Generating a tailored 1-page CV from a job vacancy takes under 20 seconds from clicking the action button to viewing the rendered resume.
- **SC-003**: 100% of generated resumes fit onto a single printed page (standard Letter and A4) with zero orphan trailing pages across all built-in templates.
- **SC-004**: Zero hallucinations rate: 100% of factual assertions (employment dates, company names, educational credentials, and technologies) in generated CVs originate directly from the candidate's Master Profile.
- **SC-005**: 100% of candidate data, Master Profile contents, uploaded photos, and generated resumes remain strictly on the candidate's local device, with zero candidate PII or resume records stored on backend servers.
- **SC-006**: Visual template switching between built-in templates executes in under 100 milliseconds with zero layout reflow delays and zero network requests.
- **SC-007**: Job search card compatibility scores and matching badges update immediately across the entire search feed when skills are updated in the Master Profile.
- **SC-008**: 90% of candidates can generate, preview, inline-edit, and export a vacancy-tailored resume in under 2 minutes during initial use.
- **SC-009**: The default "Technical High-Density Formal" template achieves zero wasted whitespace by utilizing at least 90% of the printable vertical canvas area on standard Letter/A4 pages for standard candidate profiles.

## Assumptions

- Candidates have access to a modern web browser supporting local client-side storage (IndexedDB) and native browser print capabilities.
- Candidates can upload an existing `.yml`, PDF, or Markdown resume to bootstrap their Master Profile, or enter their background directly into the structured in-browser editor.
- The standard PDF export utilizes native browser print engine capabilities calibrated via dedicated print styling, preserving total privacy without sending rendered documents to external rendering servers.
- Profile photos uploaded by candidates are stored in optimized web image formats directly within local browser storage.
- The clipboard copy action exports clean Markdown with standard headers and bullet points that paste cleanly into web forms without markup clutter.
- If multiple tailored CVs are created for the same vacancy, the system retains existing versions and creates a new numbered revision by default.
