# Quickstart & Validation Guide: Master Career Knowledge Base & Dynamic AI CV Generator

**Feature Branch**: `005-master-profile-cv`  
**Date**: 2026-11-09  
**Status**: Ready for Implementation  

This guide provides step-by-step verification procedures to validate that Feature 005 operates end-to-end, maintaining 100% client-side privacy, instant universal skill scoring, dynamic single-page CV generation, and dual ATS exports.

---

## 1. Prerequisites & Environment Setup

Ensure the local backend and frontend development environments are active:

```bash
# 1. Activate backend virtual environment
source .venv/bin/activate

# 2. Verify backend dependencies (including pypdf and pyyaml)
.venv/bin/python -c "import pypdf, yaml; print('Python dependencies OK')"

# 3. Start Backend API Server (Port 8000)
uvicorn mishoojobs.api.main:app --reload --port 8000

# 4. In a separate terminal, start Vite Frontend (Port 5173)
cd frontend
npm run dev
```

---

## 2. Validation Scenarios

### Scenario 1: Master Profile Ingestion & Structured YAML Editor
**Goal**: Verify that a candidate can bootstrap and update their Master Profile with 100% client-side persistence in IndexedDB.

1. Open `http://localhost:5173` in a modern browser.
2. Click the new **"Perfil Maestro"** action / navigation button in the header.
3. **Verify Starter Template**:
   - The in-browser YAML editor loads with a pre-populated Mexican engineering template (`personal_info`, `tech`, `experience`, `projects`, etc.).
   - The status badge shows `[ESTRUCTURA VÁLIDA]` in emerald.
4. **Syntax Validation Test**:
   - Introduce a YAML indentation error on line 5.
   - Verify the emerald badge immediately switches to a rose badge: `[ERROR EN LÍNEA 5: Indentación inválida]`.
   - Verify the "Guardar Cambios" button is disabled. Correct the syntax and verify save is re-enabled.
5. **Resume File Ingestion (PDF / Markdown)**:
   - Click "Importar Currículum".
   - Upload an unstructured PDF or Markdown resume.
   - Verify the ephemeral `POST /cv/parse-resume` parses the document and replaces/populates the editor within 15 seconds.
   - Verify that IndexedDB (`mishoojobs_local_db` -> `master_profile`) contains the updated record.
6. **Avatar Photo Upload**:
   - Click the avatar upload widget in the profile header and select an image.
   - Verify the image is rendered in the avatar preview.
   - Inspect IndexedDB: verify the binary Blob is saved in `master_profile_photo` (NOT inlined as Base64 in the YAML text).

---

### Scenario 2: Universal Platform Skills Synchronization & Fit Scoring
**Goal**: Verify that the technical skills curated in the Master Profile immediately dictate fit scores across the entire platform without manual re-entry.

1. In the Master Profile editor, add `"FastAPI"`, `"PostgreSQL"`, and `"Docker"` under `tech.backend` and `tech.databases`.
2. Save the Master Profile.
3. Navigate to the job search feed.
4. **Verify Heuristic Scores**:
   - Vacancies requiring FastAPI or PostgreSQL immediately show higher match percentages (e.g. 80-100%) and emerald match badges (`[FastAPI]`, `[PostgreSQL]`).
5. **Verify AI Fit Evaluation**:
   - Click on a vacancy requiring Python/FastAPI to open the detail modal.
   - Click "Evaluar Compatibilidad IA".
   - Verify the evaluation completes and recognizes the candidate's skills from the Master Profile without legacy regex errors.

---

### Scenario 3: One-Click Vacancy-Tailored CV Generation
**Goal**: Generate a single-page ATS CV tailored specifically to a live job vacancy.

1. In the Vacancy Detail Modal, click **"Generar CV Adaptado"**.
2. In the generation dialog:
   - Observe target vacancy details (Company, Title, Required Tech).
   - Toggle language selector between **ES** (Español) and **EN** (English). Leave as **ES**.
   - Click "Generar CV".
3. **Verify Output in Live CV Viewer**:
   - Resume renders within 20 seconds using the default **"Technical High-Density Formal"** layout.
   - **Anti-Hallucination Check**: Verify that dates, company names, and technologies originate strictly from the Master Profile.
   - **STAR Phrasing**: Verify experience bullets follow action-verb impact statements.
   - **Single-Page Constraint**: Verify word count is under 500 words and fits completely on a single letter page.
   - Inspect IndexedDB `resumes` table: verify new record created with `type: "vacancy"` and link to `vacancy_fingerprint`.

---

### Scenario 4: Role Archetype Generation
**Goal**: Generate an evergreen archetype CV for a career track (e.g., "AI Engineer").

1. Navigate to the **"Mis CVs"** tab in the main header.
2. Click **"Crear CV por Rol"**.
3. Enter Title: `"AI Engineer"` and Focus Tags: `"Python, PyTorch, LLMs, FastAPI"`.
4. Click "Generar".
5. Verify the resume generated prioritizes AI/data skills and machine learning projects from the Master Profile.
6. Verify the resume is saved in "Mis CVs" with an emerald badge: `[ROL: AI Engineer]`.

---

### Scenario 5: High-Density Layout, Inline Editing & Two-Way Sync
**Goal**: Verify instant template switching, in-place text editing, and syncing improvements back to the Master Profile.

1. Open a generated CV in the Live CV Viewer.
2. **Template Switching**:
   - Click the template selector and toggle between:
     1. *Technical High-Density Formal* (2 columns, categorized tech stack)
     2. *Classic ATS Single-Column*
     3. *Modern Executive*
   - Verify switching occurs in <100ms with zero network requests.
3. **Inline Click-to-Edit**:
   - Click directly on a bullet point or the `ABOUT ME` summary.
   - Edit the text inline.
   - Refresh the browser page.
   - Verify the edit persisted in Dexie `resumes`.
4. **Sync Back to Master Profile**:
   - Click the action button **"Guardar mejoras en Perfil Maestro"**.
   - In the diff modal, confirm pushing the updated bullet point.
   - Navigate to "Perfil Maestro" and verify the YAML was updated with the refined phrasing.

---

### Scenario 6: Vector PDF Export & ATS Plain Text Copy
**Goal**: Verify print-ready vector PDF rendering and clipboard formatting.

1. Open a tailored CV in the Live CV Viewer.
2. Click **"Descargar PDF"**:
   - Verify the browser's native print preview dialog opens.
   - Confirm pagination is strictly **1 of 1 pages** (no trailing blank page).
   - Confirm margins are 0.4-0.5in and colors/fonts print sharply.
3. Click **"Copiar Texto ATS (Plano)"**:
   - Paste the clipboard contents into a plain text editor (e.g. TextEdit / VS Code).
   - Confirm clean uppercase headers (`EXPERIENCIA PROFESIONAL`, `PROYECTOS TÉCNICOS`), clean dash bullets (`- `), and zero markdown punctuation (`**`, `#`).
4. Click the split dropdown and select **"Copiar Markdown"**:
   - Confirm formatted GitHub Flavored Markdown is copied.

---

### Scenario 7: "Mis CVs" Resume Library Management
**Goal**: Verify the centralized library for organizing all generated resumes.

1. Navigate to **"Mis CVs"** in the main header navigation.
2. Confirm all created resumes are listed with:
   - Creation date and revision tag.
   - Associated vacancy badge or role archetype badge.
   - Quick actions: *Previsualizar*, *Duplicar*, *Descargar PDF*, *Eliminar*.
3. Click "Duplicar" on a resume and verify an editable copy `(Copia)` appears in the library.
4. Click "Eliminar" and confirm deletion from IndexedDB.

---

## 3. Automated Verification Commands

Run full offline test suites:

```bash
# Backend unit & contract test suite (including CV parser & generator schemas)
.venv/bin/pytest backend/tests/ -v

# Frontend component & UX test suite (including YAML parser, templates & Dexie)
cd frontend
npm test -- --run
```
