import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

from mishoojobs.api.main import app
from mishoojobs.database import engine
from mishoojobs.services.agy_ai_client import AgyAIClient

@pytest.mark.asyncio
async def test_full_system_workflow(agy_eval_json, monkeypatch):
    # Mock agy CLI to deterministic fixture
    async def mock_run_evaluation(self, target_role, candidate_skills, job_description, desired_skills=None):
        return agy_eval_json

    monkeypatch.setattr(AgyAIClient, "run_evaluation", mock_run_evaluation)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        health_res = await client.get("/api/v1/health")
        assert health_res.status_code == 200
        health_data = health_res.json()
        assert health_data["status"] == "ok"
        assert health_data["database"] == "connected"
        assert health_data["agy_cli"] == "available"

        # 2. Live Job Search Stream
        stream_res = await client.get("/api/v1/jobs/stream?query=Python+Junior&location=Guadalajara&category=junior")
        assert stream_res.status_code == 200
        assert "text/event-stream" in stream_res.headers.get("content-type", "")
        stream_body = stream_res.text
        assert "event: portal_status" in stream_body
        assert "event: stream_end" in stream_body

        # 3. Scam Detection Endpoint
        scam_res = await client.get("/api/v1/vacancies/test-scam-fingerprint/scam-report")
        assert scam_res.status_code == 200
        scam_data = scam_res.json()
        assert scam_data["risk_level"] == "critical"
        assert len(scam_data["risk_categories"]) > 0

        # 4. AI Evaluation Endpoint
        eval_payload = {
            "vacancy_fingerprint": "workflow-eval-unique-fp",
            "target_role": "Junior Backend Developer",
            "candidate_skills": ["Python", "FastAPI", "SQL", "Git"],
            "job_description": "Desarrollador Python Junior con FastAPI y Docker en Guadalajara.",
        }
        async with engine.connect() as conn:
            await conn.execute(text("DELETE FROM ai_evaluation_cache WHERE vacancy_fingerprint = 'workflow-eval-unique-fp'"))
            await conn.commit()
        eval_res = await client.post("/api/v1/vacancies/evaluate", json=eval_payload)
        assert eval_res.status_code == 200
        eval_data = eval_res.json()
        assert eval_data["fit_score"] == 85
        assert eval_data["fit_tier"] == "high"

        # 5. Constitutional Privacy Audit: Zero candidate PII tables in PostgreSQL
        async with engine.connect() as conn:
            user_tables = await conn.execute(
                text("SELECT table_name FROM information_schema.tables WHERE table_name IN ('users', 'candidate_profiles', 'candidates');")
            )
            assert len(user_tables.fetchall()) == 0
