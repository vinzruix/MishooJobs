# Research & Technical Decisions: Smart Seniority Classification & "First REAL Job" Detection

**Feature Branch**: `003-smart-seniority-classification`  
**Date**: 2026-11-07  
**Status**: Completed  

---

## 1. Fast-Pass Deterministic Seniority Classification (Step 1 Heuristics)

### Decision
Implement a deterministic regex- and keyword-based classifier `SeniorityClassifier.classify_fast(title: str, text: str)` executed synchronously during scraper parsing and in-flight stream processing. It extracts experience years, identifies student/academic terminology, detects title-vs-requirement discrepancies ("Fake Junior"), and assigns structured classification attributes:
- `seniority_level`: `pasantia` | `primer_empleo` | `junior` | `mid` | `senior`
- `years_required_min`: Non-negative integer (e.g. 0, 1, 2, 5)
- `is_real_first_job`: `true` strictly when `years_required_min == 0` and position is commercial employment (not academic student placement) and free of scam/unpaid flags
- `audit_status`: `"preliminary"`
- `reasoning`: Localized explanation (e.g. "Preclasificación rápida: detección de 0 años de experiencia requerida")
- `has_discrepancy`: `true` if nominal title claims junior/internship but text mandates $\ge 2$ years

### Rationale
- High-velocity SSE streaming demands sub-millisecond classification per card so that progressive rendering and live filter counters are immediate and non-blocking.
- Mexican job postings adhere to recurring lexical patterns for entry-level work:
  - *Pasantía/Prácticas*: "servicio social", "residencias profesionales", "prácticas profesionales", "estancias", "estadías", "formación dual", "becario", "estudiante de últimos semestres", "convenio escolar".
  - *Primer Empleo (0 Exp)*: "sin experiencia", "0 años", "no se requiere experiencia", "experiencia no necesaria", "primer empleo", "recién egresado", "experiencia deseable pero no indispensable" (when paired with training/mentorship).
  - *Junior (1-2 años)*: "1 a 2 años", "mínimo 1 año", "1 año de experiencia", "experiencia previa comprobable".
  - *Mid (2-4 años)*: "2 a 4 años", "mínimo 3 años", "3+ años", "autonomía técnica".
  - *Senior (5+ años)*: "5+ años", "5 a 8 años", "arquitecto", "tech lead", "liderazgo técnico".
  - *Neutral/Ambiguous*: Titles like "Programador Web" without experience mentions default to `junior` (`preliminary`) per clarification FR-014.

### Discrepancy & "Fake Junior" Shield Logic
1. If the job title contains entry markers ("junior", "jr", "trainee", "becario", "practicante"):
   - If requirement clauses state $\ge 2$ years and $< 5$ years $\rightarrow$ reclassify to `mid`, set `years_required_min`, and mark `has_discrepancy = True` with explanation "Título marcado como Junior pero el cuerpo exige 2+ años de experiencia laboral."
   - If requirement clauses state $\ge 5$ years $\rightarrow$ reclassify to `senior`, set `years_required_min`, and mark `has_discrepancy = True` with explanation "Título marcado como Junior pero el cuerpo exige 5+ años de experiencia laboral."
2. This strictly excludes deceptive postings from the `primer_empleo` and `junior` feeds (FR-005, SC-002).

### Alternatives Considered
- *Running LLM on every incoming vacancy during streaming*: Rejected because invoking `agy` for dozens of vacancies simultaneously introduces 3-10 second latency per batch, degrades UX, and exceeds the local CLI execution concurrency limits.
- *Keeping legacy category alongside seniority*: Rejected per Clarification Option B (Full-Stack Purge) because dual taxonomy introduces confusing UI filters, database schema bloat, and count discrepancies.

---

## 2. On-Demand Deep AI Audit Architecture (Step 2 Orchestration)

### Decision
Integrate a dedicated deep audit workflow orchestrated via the local Antigravity CLI (`agy`) using the developer's Gemini subscription. The audit runs on-demand when a candidate clicks to inspect vacancy details in `VacancyDetailModal` or triggers compatibility evaluation.

### Workflow & Contract
1. **Endpoint**: `POST /api/v1/vacancies/{fingerprint}/audit`
   - Accepts: `{ "vacancy_fingerprint": str, "direct_url": Optional[str], "job_description": Optional[str] }`
   - Checks PostgreSQL `vacancies` table by fingerprint.
   - If `audit_status == "verified"`, returns the cached verified classification immediately (0ms LLM overhead).
   - If `audit_status == "preliminary"`:
     - Ensures full job description is loaded (using multi-portal enrichment scrapers for Computrabajo, OCC, Indeed if description is truncated).
     - Calls `AgyAIClient.run_seniority_audit(title, company, description)`.
     - Updates `JobVacancy` in PostgreSQL:
       - `seniority_level = audit_result.seniority_level`
       - `years_required_min = audit_result.years_required_min`
       - `is_real_first_job = audit_result.is_real_first_job`
       - `audit_status = "verified"`
       - `reasoning = audit_result.reasoning`
       - `has_discrepancy = audit_result.has_discrepancy`
     - Commits to PostgreSQL and returns updated `VacancyDTO`.

### Prompt Design & JSON Contract
The `agy` audit prompt enforces strict JSON output:
```json
{
  "seniority_level": "primer_empleo",
  "years_required_min": 0,
  "is_real_first_job": true,
  "has_discrepancy": false,
  "reasoning": "La vacante acepta recién egresados sin experiencia laboral previa y ofrece contrato formal de nómina con capacitación."
}
```

### Rationale
- Preserves Zero-API-Key requirement (Constitution Principle V).
- Permanent PostgreSQL caching by fingerprint ensures each vacancy is audited at most once across all candidate sessions.
- Streaming stays lightning-fast; deep analysis is lazily evaluated when human intent is established (modal open).

### Alternatives Considered
- *Background worker pre-auditing all listings*: Rejected to minimize compute overhead and avoid unnecessary CPU/battery consumption on listings never inspected by the candidate.

---

## 3. Database Schema Migration & Full-Stack Purge

### Decision
Create Alembic migration `005_replace_category_with_seniority.py`:
1. Drop column `category` and enum `category_enum` from `vacancies`.
2. Create PostgreSQL enums:
   - `seniority_level_enum`: `'pasantia'`, `'primer_empleo'`, `'junior'`, `'mid'`, `'senior'`
   - `audit_status_enum`: `'preliminary'`, `'verified'`
3. Add columns to `vacancies`:
   - `seniority_level` (`seniority_level_enum`, default `'junior'`, indexed)
   - `years_required_min` (`Integer`, default 0, nullable=False)
   - `is_real_first_job` (`Boolean`, default False, nullable=False, indexed)
   - `audit_status` (`audit_status_enum`, default `'preliminary'`, nullable=False)
   - `reasoning` (`Text`, default '', nullable=False)
   - `has_discrepancy` (`Boolean`, default False, nullable=False)
4. In `sse.py` background persistence, use PostgreSQL `ON CONFLICT (fingerprint) DO UPDATE`:
   - Preserve existing `audit_status == 'verified'` so that repeated streaming does not overwrite deep AI audit results with preliminary regex results.

### Rationale
- Completely removes legacy `category` column as mandated by FR-001 and the project clarification.
- Directly storing classification on `JobVacancy` enables indexed lookups and avoids redundant joined tables.

### Alternatives Considered
- *Separate `seniority_audits` 1-to-1 table*: Adds unnecessary SQL joins for every vacancy query. Consolidating onto `JobVacancy` simplifies queries, DTO serialization, and indexing.

---

## 4. Experience Filtering, Real-Time Counts & Smart Sorting

### Decision
1. **Frontend State & URL Synchronization**:
   - Filter state: `seniority: "all" | "primer_empleo" | "pasantia" | "junior" | "mid" | "senior"`
   - Synchronized to URL parameter: `?seniority=<value>` (e.g. `?seniority=primer_empleo`).
   - Single-select model: selecting one tier switches to that tier; clicking active tier or "Todos los niveles" resets to `"all"`.
2. **Real-Time Counters**:
   - Computed client-side over the deduplicated vacancy pool in the active query/location/date scope:
     ```typescript
     tierCounts: {
       all: number;
       primer_empleo: number;
       pasantia: number;
       junior: number;
       mid: number;
       senior: number;
     }
     ```
   - Dynamically displayed next to each filter option in both `FilterDrawer` and quick filter pills.
3. **Smart Sorting for "Primer Empleo Real" (FR-011)**:
   - When `seniority === "primer_empleo"`, default sort orders:
     1. `audit_status === "verified"` listings first
     2. `audit_status === "preliminary"` listings second
     3. Within each group, ordered by `published_at` descending (most recent first)
   - If the candidate explicitly selects a different sort dropdown option (e.g. "Más antiguos primero" or "Compatibilidad"), candidate override takes precedence.
4. **Empty State & Recovery (FR-015)**:
   - When active filter has 0 matches, display clean Midudev-styled alert card:
     - Message: "No se encontraron vacantes para el nivel seleccionado en esta búsqueda."
     - Suggestion: "Prueba ampliando tu búsqueda a Pasantía / Prácticas o Junior."
     - Action button: `[ Limpiar filtro de experiencia ]` resetting `seniority` to `"all"`.

---

## 5. Visual Hierarchy & Badge Design System

### Decision
Adhere strictly to Geist Mono monospace design tokens and contrast standards:
- **`[ PRIMER EMPLEO REAL ]`**: High-contrast emerald badge (`bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 font-mono text-xs`).
  - If `audit_status === "verified"`: Display emerald checkmark verification icon `[ ✓ AUDITADO 0 EXP ]`.
  - If `audit_status === "preliminary"`: Display `[ 0 EXP PRELIMINAR ]`.
- **`[ PASANTÍA ]`**: Cyan badge (`bg-cyan-950/60 text-cyan-400 border border-cyan-500/30`).
- **`[ JR ]`**: Violet/indigo badge (`bg-violet-950/60 text-violet-400 border border-violet-500/30`).
- **`[ MID ]`**: Amber badge (`bg-amber-950/60 text-amber-400 border border-amber-500/30`).
- **`[ SR ]`**: Rose/red badge (`bg-rose-950/60 text-rose-400 border border-rose-500/30`).
- **`[ REQUISITOS DISCREPANTES ]`**: Warning badge (`bg-amber-500/20 text-amber-300 border border-amber-500/50`) shown when `has_discrepancy === true`.
- **Tooltip / Modal Explanation**: On hover or inside modal, display the `reasoning` text explaining why the tier was assigned.

---

## Summary of Architectural Approvals

| Decision Point | Approved Approach | Constitution Alignment |
|---|---|---|
| Classification Speed | Two-step hybrid (Step 1 fast-pass in stream, Step 2 on-demand AI audit) | Principle IV & V |
| AI Tooling | Subprocess `agy` CLI calls with PostgreSQL fingerprint caching | Principle V (Zero-API-Key) |
| Data Model | Full purge of `category` $\rightarrow$ `seniority_level` + audit fields | Principle I & IV |
| Privacy | Anonymous local storage for candidates; zero candidate tables in DB | Principle I |
| Fraud Protection | Anti-Scam Shield integration; fake junior discrepancy tag | Principle VI |
| UX & Design | Geist Mono, emerald 0-Exp highlight, real-time counters, URL sync | Principle II & IV |
