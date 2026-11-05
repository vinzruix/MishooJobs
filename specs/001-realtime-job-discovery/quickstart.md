# Quickstart & Validation Guide: Real-Time Mexican Job Discovery (MishooJobs)

**Feature Branch**: `001-realtime-job-discovery`  
**Date**: 2026-11-05  
**Artifacts Referenced**:
- [`spec.md`](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/specs/001-realtime-job-discovery/spec.md)
- [`plan.md`](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/specs/001-realtime-job-discovery/plan.md)
- [`data-model.md`](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/specs/001-realtime-job-discovery/data-model.md)
- [`contracts/openapi.yaml`](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/specs/001-realtime-job-discovery/contracts/openapi.yaml)
- [`contracts/sse-stream.json`](file:///Users/yairtejedahotmail.com/projects/mishooJobs/mishooJobs/specs/001-realtime-job-discovery/contracts/sse-stream.json)

---

## 1. Prerequisites & Environment Setup

### System Dependencies
- **Operating System**: macOS / Linux
- **Python**: 3.12+ (3.14 verified)
- **Node.js**: v20+ (v26 verified) & `npm`
- **PostgreSQL**: 15+ running locally on port 5432 (`/tmp:5432 - accepting connections`)
- **Antigravity CLI**: `agy` installed and verified in PATH (`agy --help`)

### Initial Workspace Configuration

```bash
# 1. Activate Python virtual environment and install backend dependencies
source .venv/bin/activate
pip install -e ".[dev]"

# 2. Setup PostgreSQL database for deduplication and AI caching
psql -h localhost -c "CREATE DATABASE mishoojobs_db;" || true

# 3. Apply database migrations
alembic upgrade head

# 4. Install frontend dependencies
cd frontend && npm install && cd ..
```

---

## 2. Running the Development Services

```bash
# Terminal 1: Start FastAPI backend (port 8000)
source .venv/bin/activate
uvicorn mishoojobs.api.main:app --reload --port 8000

# Terminal 2: Start Vite React frontend (port 5173)
cd frontend
npm run dev
```

---

## 3. End-to-End Validation Scenarios

### Scenario 1: Real-Time Live Job Discovery with Verified Links (P1, FR-001, FR-002, SC-001)

**Objective**: Verify that job searches execute live across external Mexican portals with zero preloaded data and 100% active links.

```bash
# Execute live SSE stream query for junior positions in Guadalajara
curl -N "http://localhost:8000/api/v1/jobs/stream?query=Python+Junior&location=Guadalajara&category=junior"
```

**Expected Outcome**:
1. Server emits `event: portal_status` within 1–2 seconds showing active scraping across Computrabajo, Indeed, and OCC.
2. First batch of verified vacancies arrives via `event: vacancy_batch` within <5 seconds.
3. Every vacancy record contains:
   - Verified active direct application URLs (`is_active: true`, HTTP 200/302).
   - Zero mock/dummy data markers.
   - Cleaned text description and extracted skill tokens.
4. Stream terminates with `event: stream_end` reporting duration <15 seconds.

---

### Scenario 2: Two-Tier Compatibility Scoring & Profile Switching (P1, FR-010, SC-008)

**Objective**: Verify instant local heuristic match calculation and on-demand deep AI evaluation via `agy` CLI without paid API keys.

#### Step 2A: Instant Heuristic Scoring (<2s)
1. Open the MishooJobs web interface at `http://localhost:5173`.
2. Load a sample resume file (e.g. `docs/samples/sample_resume_backend.md`).
3. Observe all discovered job cards update their 0–100% compatibility badge within 2 seconds.

#### Step 2B: On-Demand Deep AI Evaluation via `agy` CLI (<5s)
1. Click on a specific vacancy card (e.g., "Desarrollador Backend Junior").
2. The UI triggers `POST /api/v1/vacancies/evaluate`:

```bash
curl -X POST http://localhost:8000/api/v1/vacancies/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "vacancy_fingerprint": "8f3a9e102bc451da",
    "target_role": "Junior Backend Developer",
    "candidate_skills": ["Python", "FastAPI", "SQL", "Git"],
    "job_description": "Buscamos Desarrollador Python Junior con conocimientos en FastAPI, PostgreSQL y Docker."
  }'
```

**Expected Outcome**:
1. Backend calls local `agy --print ... --output-format json` using user's active Gemini session.
2. Response returns within 4 seconds:
   - `fit_score`: e.g. `82`
   - `fit_tier`: `"high"`
   - `matched_skills`: `["Python", "FastAPI", "SQL"]`
   - `missing_skills`: `["Docker", "PostgreSQL"]`
   - `role_readiness_summary`: Actionable Spanish overview.
   - `is_cached`: `false` (first execution).
3. Repeating the exact request immediately returns `is_cached: true` in <15ms from PostgreSQL.

---

### Scenario 3: Mexican Predatory & Scam Vacancy Detection (P2, FR-012, FR-013, SC-004)

**Objective**: Confirm that deceptive or predatory listings trigger high-contrast warning badges.

```bash
# Query scam assessment endpoint with known predatory pattern
curl -X GET http://localhost:8000/api/v1/vacancies/test-scam-fingerprint/scam-report
```

**Expected Outcome**:
- Listings containing phrases like *"3000 a 5000 semanales por actividades sencillas de oficina"* or *"pago de uniforme requerido"* receive:
  - `risk_level: "critical"`
  - `badge_label: "[POSIBLE FRAUDE / PIRAMIDAL]"` or `"[COBRO A CANDIDATO]"`
  - High-contrast visual pill rendered in the card header.
- Remote listings requiring *"US Citizen only"* or *"Must be authorized to work in the US without sponsorship"* are excluded from candidate feeds.

---

### Scenario 4: Local Application Pipeline Tracking & Privacy Check (P3, FR-006, FR-007)

**Objective**: Validate that user application progression persists strictly in the browser without server-side candidate account storage.

1. In the browser UI, click the "Guardar" (`Saved`) or "Postulado" (`Applied`) button on a vacancy card.
2. Open Chrome DevTools -> Application -> Storage -> IndexedDB -> `mishoojobs_local_db`.
3. Inspect `applications` store: verify record exists with `status: "applied"` and `applied_at` timestamp.
4. Inspect PostgreSQL database:
   ```bash
   psql -d mishoojobs_db -c "SELECT COUNT(*) FROM vacancies;"
   psql -d mishoojobs_db -c "SELECT * FROM information_schema.tables WHERE table_name = 'users' OR table_name = 'candidate_profiles';"
   ```
5. Confirm that **zero** candidate tables or candidate records exist in PostgreSQL.

---

## 4. Automated Offline Test Suite Execution

Per Constitution Testing & Quality Gates, automated test suites run completely offline using deterministic static fixtures:

```bash
# Run backend offline unit and contract tests
pytest tests/ -v

# Run frontend tests
cd frontend && npm test && cd ..
```
