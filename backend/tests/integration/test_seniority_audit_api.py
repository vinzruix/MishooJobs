import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert

from mishoojobs.api.main import app
from mishoojobs.database import async_session_factory
from mishoojobs.models.vacancy import JobVacancy
from mishoojobs.services.agy_ai_client import AgyAIClient

@pytest.mark.asyncio
async def test_seniority_audit_api_workflow_and_caching(monkeypatch):
    test_fp = "test-seniority-audit-fp-001"
    audit_call_count = 0

    mock_audit_res = {
        "seniority_level": "primer_empleo",
        "years_required_min": 0,
        "is_real_first_job": True,
        "has_discrepancy": False,
        "reasoning": "La vacante no requiere experiencia previa, ofrece sueldo formal por nómina y capacitación pagada.",
    }

    async def mock_run_seniority_audit(self, title, company_name, job_description):
        nonlocal audit_call_count
        audit_call_count += 1
        return mock_audit_res

    monkeypatch.setattr(AgyAIClient, "run_seniority_audit", mock_run_seniority_audit)

    # 1. Seed preliminary vacancy in database
    async with async_session_factory() as session:
        await session.execute(delete(JobVacancy).where(JobVacancy.fingerprint.in_([test_fp, "unpersisted-fingerprint-test-002"])))
        stmt = insert(JobVacancy).values(
            fingerprint=test_fp,
            title="Desarrollador Trainee Python",
            company_name="TechStart CDMX",
            location_state="CDMX",
            modality="remoto",
            seniority_level="junior",
            years_required_min=0,
            is_real_first_job=False,
            audit_status="preliminary",
            reasoning="Preclasificación preliminar.",
            has_discrepancy=False,
            currency="MXN",
            description_clean="Empresa de software busca talento joven para incorporarse como programador trainee. Ofrecemos prestaciones de ley.",
            skills_extracted=["Python", "Git"],
            is_verified_active=True,
        )
        await session.execute(stmt)
        await session.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # First call: executes agy audit, updates DB to verified, is_cached=False
        res1 = await client.post(f"/api/v1/vacancies/{test_fp}/audit", json={})
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["vacancy_fingerprint"] == test_fp
        assert data1["seniority_level"] == "primer_empleo"
        assert data1["years_required_min"] == 0
        assert data1["is_real_first_job"] is True
        assert data1["audit_status"] == "verified"
        assert data1["is_cached"] is False
        assert audit_call_count == 1

        # Second call: returns cached verified status immediately without calling agy
        res2 = await client.post(f"/api/v1/vacancies/{test_fp}/audit", json={})
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["vacancy_fingerprint"] == test_fp
        assert data2["seniority_level"] == "primer_empleo"
        assert data2["audit_status"] == "verified"
        assert data2["is_cached"] is True
        assert audit_call_count == 1  # Unchanged!

        # Check 404 for nonexistent fingerprint with no description provided
        res404 = await client.post("/api/v1/vacancies/nonexistent-fingerprint-404/audit", json={})
        assert res404.status_code == 404

        # Check resilient audit for unpersisted vacancy when client provides job_description
        unpersisted_fp = "unpersisted-fingerprint-test-002"
        res_unpersisted = await client.post(
            f"/api/v1/vacancies/{unpersisted_fp}/audit",
            json={
                "vacancy_fingerprint": unpersisted_fp,
                "title": "Desarrollador Junior Python",
                "company_name": "InnovaSoft",
                "job_description": "Buscamos recién egresados para puesto de desarrollador junior python sin experiencia.",
            },
        )
        assert res_unpersisted.status_code == 200
        unpersisted_data = res_unpersisted.json()
        assert unpersisted_data["vacancy_fingerprint"] == unpersisted_fp
        assert unpersisted_data["audit_status"] == "verified"
        assert unpersisted_data["is_cached"] is False

        # Verify it was persisted to PostgreSQL and subsequent call returns cached
        res_cached = await client.post(f"/api/v1/vacancies/{unpersisted_fp}/audit", json={})
        assert res_cached.status_code == 200
        assert res_cached.json()["is_cached"] is True
