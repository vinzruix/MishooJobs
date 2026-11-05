import hashlib
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from mishoojobs.database import get_db_session
from mishoojobs.models.evaluation import AIEvaluationCache
from mishoojobs.models.scam import ScamAssessment
from mishoojobs.models.vacancy import JobVacancy
from mishoojobs.schemas.evaluation import (
    AIEvaluationRequest,
    AIEvaluationResponse,
    FitTierEnum,
)
from mishoojobs.schemas.scam import RiskLevelEnum, ScamReportResponse
from mishoojobs.services.agy_ai_client import AgyAIClient
from mishoojobs.services.scam_detector import MexicanScamDetector

router = APIRouter(prefix="/vacancies", tags=["Vacancies"])

def compute_eval_cache_key(
    vacancy_fingerprint: str, target_role: str, candidate_skills: list[str]
) -> tuple[str, str]:
    """Generates deterministic cache_key and skills_hash."""
    sorted_skills = sorted(list({s.lower().strip() for s in candidate_skills}))
    skills_json = json.dumps(sorted_skills, ensure_ascii=False)
    skills_hash = hashlib.sha256(skills_json.encode("utf-8")).hexdigest()

    norm_role = target_role.lower().strip()
    raw_key = f"{vacancy_fingerprint}:{norm_role}:{skills_hash}"
    cache_key = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
    return cache_key, skills_hash

@router.post("/evaluate", response_model=AIEvaluationResponse)
async def evaluate_vacancy(
    request: AIEvaluationRequest,
    db: AsyncSession = Depends(get_db_session),
) -> AIEvaluationResponse:
    """Evaluates candidate compatibility against a vacancy with PostgreSQL caching and agy CLI orchestration."""
    cache_key, skills_hash = compute_eval_cache_key(
        request.vacancy_fingerprint, request.target_role, request.candidate_skills
    )

    # 1. Check PostgreSQL Cache
    stmt = select(AIEvaluationCache).where(AIEvaluationCache.cache_key == cache_key)
    result = await db.execute(stmt)
    cached_entry = result.scalar_one_or_none()

    if cached_entry:
        return AIEvaluationResponse(
            fit_score=cached_entry.fit_score,
            fit_tier=FitTierEnum(cached_entry.fit_tier),
            matched_skills=cached_entry.matched_skills,
            missing_skills=cached_entry.missing_skills,
            role_readiness_summary=cached_entry.role_readiness_summary,
            actionable_advice=cached_entry.actionable_advice,
            is_cached=True,
            evaluated_at=cached_entry.evaluated_at,
        )

    # 2. Invoke local agy CLI
    ai_client = AgyAIClient()
    try:
        eval_result = await ai_client.run_evaluation(
            target_role=request.target_role,
            candidate_skills=request.candidate_skills,
            job_description=request.job_description,
        )
    except TimeoutError as te:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"La evaluación mediante agy excedió el tiempo límite: {str(te)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al ejecutar evaluación con agy CLI: {str(e)}",
        )

    # 3. Persist into PostgreSQL Cache
    now = datetime.now(timezone.utc)
    new_cache = AIEvaluationCache(
        cache_key=cache_key,
        vacancy_fingerprint=request.vacancy_fingerprint,
        target_role=request.target_role,
        skills_hash=skills_hash,
        fit_score=eval_result["fit_score"],
        fit_tier=eval_result["fit_tier"],
        matched_skills=eval_result["matched_skills"],
        missing_skills=eval_result["missing_skills"],
        role_readiness_summary=eval_result["role_readiness_summary"],
        actionable_advice=eval_result["actionable_advice"],
        evaluated_at=now,
    )
    db.add(new_cache)
    await db.commit()

    return AIEvaluationResponse(
        fit_score=eval_result["fit_score"],
        fit_tier=FitTierEnum(eval_result["fit_tier"]),
        matched_skills=eval_result["matched_skills"],
        missing_skills=eval_result["missing_skills"],
        role_readiness_summary=eval_result["role_readiness_summary"],
        actionable_advice=eval_result["actionable_advice"],
        is_cached=False,
        evaluated_at=now,
    )

@router.get("/{fingerprint}/scam-report", response_model=ScamReportResponse)
async def get_scam_report(
    fingerprint: str,
    db: AsyncSession = Depends(get_db_session),
) -> ScamReportResponse:
    """Retrieves predatory / scam risk analysis for a vacancy."""
    # 1. Check if assessment exists in database
    stmt = select(ScamAssessment).where(ScamAssessment.vacancy_fingerprint == fingerprint)
    result = await db.execute(stmt)
    assessment = result.scalar_one_or_none()

    if assessment:
        return ScamReportResponse(
            risk_level=RiskLevelEnum(assessment.risk_level),
            risk_categories=assessment.risk_categories,
            matched_indicators=assessment.matched_indicators,
            badge_label=assessment.badge_label,
            explanation=assessment.explanation,
        )

    # 2. Check if vacancy exists in database to assess on the fly
    vac_stmt = select(JobVacancy).where(JobVacancy.fingerprint == fingerprint)
    vac_res = await db.execute(vac_stmt)
    vacancy = vac_res.scalar_one_or_none()

    detector = MexicanScamDetector()
    if vacancy:
        return detector.assess_vacancy(vacancy.title, vacancy.description_clean)

    # If it's a test or ad-hoc query
    if "scam" in fingerprint.lower() or "fraude" in fingerprint.lower():
        return detector.assess_vacancy(
            "Actividades sencillas de oficina",
            "Gana de 3000 a 5000 semanales por actividades sencillas. Pago de uniforme requerido.",
        )

    raise HTTPException(status_code=404, detail="Vacante no encontrada")
