# MishooJobs Backend

FastAPI backend service for real-time job discovery, active link verification, smart seniority classification, and AI compatibility scoring.

---

## Architecture & Core Features

1. **Real-Time Job Aggregation**: Concurrently scrapes Computrabajo, Indeed México, and OCC Mundial, streaming results to the frontend via Server-Sent Events (SSE).
2. **Active Link Health Check**: In-flight asynchronous HTTP HEAD/GET verification validates application URLs before serving them.
3. **Smart Seniority Classification (5 Tiers)**:
   - `pasantia`: Academic internships, practical training (*becario*, *prácticas profesionales*, *servicio social*, *residencias*).
   - `primer_empleo`: Authentic 0-experience non-academic entry-level roles (*sin experiencia*, *primer empleo*).
   - `junior`: Early-career opportunities requiring 0 to 2 years of experience.
   - `mid`: Intermediate roles requiring 2 to 5 years of experience.
   - `senior`: Senior roles requiring 5+ years of experience.
4. **Two-Step Hybrid Seniority Architecture**:
   - **Step 1 (Fast-Pass)**: Deterministic regex parsing during the live SSE stream, extracting years of experience, detecting academic vs. entry terms, and reclassifying deceptive postings.
   - **Step 2 (Deep AI Audit)**: On-demand LLM audit via local Antigravity CLI (`agy`) with composite hash caching in PostgreSQL (`mishoojobs_db`).
5. **Deceptive "Fake Junior" Shield**: Detects listings branded as "Junior" or entry-level that mandate $\ge 2$ years of experience, automatically reclassifying them to `mid` or `senior` with `has_discrepancy = True`.
6. **Zero Candidate PII Guarantee**: PostgreSQL stores only vacancy fingerprints, verification caches, and AI audits. Resumes and candidate data never touch the backend.

---

## API Endpoints

### 1. Job Stream (SSE)
- **`GET /api/v1/jobs/stream`**
  - **Query Parameters**:
    - `query` (string, required): Job keywords (e.g., `python`, `frontend`).
    - `location` (string, optional): Target city or region (defaults to Mexico).
    - `limit_per_portal` (int, default: 10): Maximum results to scrape per portal.
    - `published_within` (string, optional): Timeframe filter (`24h`, `3d`, `7d`, `14d`, `30d`, `all`).
    - `seniority` (string, optional): Seniority filter (`all`, `pasantia`, `primer_empleo`, `junior`, `mid`, `senior`).
  - **Events Emitted**:
    - `status`: Scraping status updates (`searching`, `verifying`, `done`, `error`).
    - `batch`: Array of validated `VacancyDTO` objects.
    - `summary`: Final stream statistics.

### 2. Seniority Deep Audit (On-Demand)
- **`POST /api/v1/vacancies/{fingerprint}/audit`**
  - **Request Body**: `SeniorityAuditRequest`
    - `title` (string): Vacancy job title.
    - `company` (string): Hiring company.
    - `description` (string): Full or snippet job description.
    - `skills` (list of strings): Required/detected technical skills.
  - **Response**: `SeniorityAuditResponse`
    - `fingerprint` (string): Vacancy identifier hash.
    - `seniority_level` (string): Audited level (`pasantia`, `primer_empleo`, `junior`, `mid`, `senior`).
    - `years_required_min` (int): Verified minimum years of experience.
    - `is_real_first_job` (bool): True if authentic 0-experience non-academic role.
    - `audit_status` (string): `"verified"` or `"unverified"`.
    - `reasoning` (string): Explanation in Mexican Spanish.
    - `has_discrepancy` (bool): True if title conflicts with required years.
    - `is_cached` (bool): True if served from PostgreSQL cache.

### 3. AI Compatibility Evaluation
- **`POST /api/v1/vacancies/evaluate`**
  - **Request Body**: `AIEvaluationRequest` (profile skills, target role, vacancy metadata).
  - **Response**: `AIEvaluationResponse` (fit score, matched skills, missing skills, advice, seniority audit).

---

## Local Development & Setup

```bash
# 1. Activate Python virtual environment
source .venv/bin/activate

# 2. Install dependencies
pip install -e ".[dev]"

# 3. Apply database migrations
alembic upgrade head

# 4. Start the development server
uvicorn mishoojobs.api.main:app --reload --port 8000
```

---

## Testing & Quality Assurance

All automated backend tests run **100% offline** without live network connections using static fixtures in `backend/tests/fixtures/`:

```bash
# Run all backend tests
.venv/bin/pytest backend/tests/ -v

# Run seniority classification & audit tests
.venv/bin/pytest backend/tests/unit/test_seniority_classifier.py -v
.venv/bin/pytest backend/tests/integration/test_seniority_audit_api.py -v
```
