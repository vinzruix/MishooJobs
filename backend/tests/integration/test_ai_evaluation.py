import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete
from mishoojobs.api.main import app
from mishoojobs.database import async_session_factory
from mishoojobs.models.evaluation import AIEvaluationCache
from mishoojobs.services.agy_ai_client import AgyAIClient

@pytest.mark.asyncio
async def test_ai_evaluation_endpoint_and_cache(agy_eval_json, monkeypatch):
    captured_desired_skills = []

    # Mock agy CLI run to return offline fixture
    async def mock_run_evaluation(self, target_role, candidate_skills, job_description, desired_skills=None):
        nonlocal captured_desired_skills
        captured_desired_skills = desired_skills or []
        return agy_eval_json

    monkeypatch.setattr(AgyAIClient, "run_evaluation", mock_run_evaluation)

    test_fingerprint = "test-ai-eval-fp-unique"

    # Ensure clean state for test
    async with async_session_factory() as session:
        await session.execute(
            delete(AIEvaluationCache).where(AIEvaluationCache.vacancy_fingerprint == test_fingerprint)
        )
        await session.commit()

    payload = {
        "vacancy_fingerprint": test_fingerprint,
        "target_role": "Junior Backend Developer",
        "candidate_skills": ["Python", "FastAPI", "SQL", "Git"],
        "job_description": "Buscamos Desarrollador Python Junior con conocimientos en FastAPI, PostgreSQL y Docker.",
        "desired_skills": ["Python", "FastAPI", "Docker", "PostgreSQL"],
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # First call: cache miss, invokes agy
        res1 = await client.post("/api/v1/vacancies/evaluate", json=payload)
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["fit_score"] == 85
        assert data1["fit_tier"] == "high"
        assert data1["is_cached"] is False
        assert "Python" in data1["matched_skills"]
        assert captured_desired_skills == ["Python", "FastAPI", "Docker", "PostgreSQL"]

        # Second call: cache hit from PostgreSQL
        res2 = await client.post("/api/v1/vacancies/evaluate", json=payload)
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["fit_score"] == 85
        assert data2["is_cached"] is True

def test_agy_ai_client_prompt_includes_desired_skills():
    client = AgyAIClient()
    prompt = (
        client.PROMPT_TEMPLATE
        .replace("{candidate_skills_json}", '["Python", "Git"]')
        .replace("{target_role}", "Backend Developer Jr")
        .replace("{desired_skills_json}", '["Python", "FastAPI", "Docker"]')
        .replace("{job_description}", "Desarrollador Python Jr")
    )
    assert "HABILIDADES DESEADAS / REQUERIDAS POR LA VACANTE:" in prompt
    assert '["Python", "FastAPI", "Docker"]' in prompt
    assert "Backend Developer Jr" in prompt
