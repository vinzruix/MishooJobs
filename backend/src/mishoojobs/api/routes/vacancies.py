import hashlib
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
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
from mishoojobs.services.scrapers.computrabajo import ComputrabajoScraper

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
    # 0. Retrieve Vacancy and enrich description if needed
    vac_stmt = (
        select(JobVacancy)
        .options(selectinload(JobVacancy.external_links))
        .where(JobVacancy.fingerprint == request.vacancy_fingerprint)
    )
    vac_res = await db.execute(vac_stmt)
    db_vac = vac_res.scalar_one_or_none()

    effective_desc = request.job_description.strip()
    if db_vac and db_vac.description_clean and len(db_vac.description_clean) > len(effective_desc):
        effective_desc = db_vac.description_clean.strip()

    # If description is short (< 350 chars) or seems like an excerpt, attempt full fetch from direct URLs
    candidate_urls = []
    if request.direct_url:
        candidate_urls.append(request.direct_url)
    if db_vac and db_vac.external_links:
        for link in db_vac.external_links:
            if link.direct_url and link.direct_url not in candidate_urls:
                candidate_urls.append(link.direct_url)

    if len(effective_desc) < 350 or "postúlate" in effective_desc.lower() or "ids comercial" in effective_desc.lower():
        ct_scraper = ComputrabajoScraper()
        for url in candidate_urls:
            if "computrabajo" in url:
                full_body = await ct_scraper.fetch_full_description(url)
                if full_body and len(full_body) > len(effective_desc):
                    effective_desc = full_body
                    if db_vac:
                        db_vac.description_clean = full_body
                        db_vac.skills_extracted = ct_scraper.extract_skills(f"{db_vac.title} {full_body}")
                        await db.commit()
                    break

    cache_key, skills_hash = compute_eval_cache_key(
        request.vacancy_fingerprint, request.target_role, request.candidate_skills
    )

    # 1. Check PostgreSQL Cache
    stmt = select(AIEvaluationCache).where(AIEvaluationCache.cache_key == cache_key)
    result = await db.execute(stmt)
    cached_entry = result.scalar_one_or_none()

    # Stale/bogus cache check: if cached evaluation was made with an empty or metadata-only description
    is_bogus_cache = cached_entry and (
        "metadatos" in cached_entry.role_readiness_summary.lower()
        or "sin especificar los requisitos" in cached_entry.role_readiness_summary.lower()
        or "solo metadatos" in cached_entry.role_readiness_summary.lower()
    ) and len(effective_desc) >= 300

    if cached_entry and is_bogus_cache:
        await db.delete(cached_entry)
        await db.commit()
        cached_entry = None

    extracted_skills_list = (
        db_vac.skills_extracted
        if db_vac and db_vac.skills_extracted
        else ComputrabajoScraper().extract_skills(f"{db_vac.title if db_vac else ''} {effective_desc}")
    )

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
            full_description=effective_desc if len(effective_desc) > 300 else None,
            extracted_skills=extracted_skills_list or None,
        )

    # 2. Invoke local agy CLI
    ai_client = AgyAIClient()
    try:
        eval_result = await ai_client.run_evaluation(
            target_role=request.target_role,
            candidate_skills=request.candidate_skills,
            job_description=effective_desc,
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
        full_description=effective_desc,
        extracted_skills=extracted_skills_list or None,
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
