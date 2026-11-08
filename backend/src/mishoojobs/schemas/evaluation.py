from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

from mishoojobs.schemas.job import AuditStatusEnum, SeniorityLevelEnum

class FitTierEnum(str, Enum):
    HIGH = "high"
    MODERATE = "moderate"
    LOW = "low"

class SeniorityAuditRequest(BaseModel):
    vacancy_fingerprint: Optional[str] = Field(default=None, max_length=64, description="Fingerprint hash of the target vacancy")
    direct_url: Optional[str] = Field(default=None, description="Direct URL of the vacancy posting")
    job_description: Optional[str] = Field(default=None, description="Job description text if already loaded on client")

class SeniorityAuditResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    vacancy_fingerprint: str = Field(..., max_length=64)
    seniority_level: SeniorityLevelEnum
    years_required_min: int = Field(default=0, ge=0)
    is_real_first_job: bool = Field(default=False)
    audit_status: AuditStatusEnum = Field(default=AuditStatusEnum.VERIFIED)
    reasoning: str = Field(default="")
    has_discrepancy: bool = Field(default=False)
    is_cached: bool = Field(default=False)
    audited_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AIEvaluationRequest(BaseModel):
    vacancy_fingerprint: str = Field(..., max_length=64, description="Fingerprint hash of the target vacancy")
    target_role: str = Field(..., max_length=100, description="Desired role (e.g. Junior Backend Developer)")
    candidate_skills: List[str] = Field(..., min_length=1, description="List of technical skills extracted from resume")
    job_description: str = Field(..., min_length=10, description="Cleaned description of the job posting")
    direct_url: Optional[str] = Field(default=None, description="Direct URL of the vacancy posting")
    desired_skills: Optional[List[str]] = Field(default=None, description="Skills required or desired by the vacancy")

class AIEvaluationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    fit_score: int = Field(..., ge=0, le=100, description="0-100 compatibility score")
    fit_tier: FitTierEnum = Field(..., description="High (80-100), Moderate (50-79), Low (<50)")
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    role_readiness_summary: str = Field(..., description="Actionable summary in Mexican Spanish")
    actionable_advice: str = Field(..., description="Practical learning advice to close skill gaps")
    is_cached: bool = Field(default=False, description="True if served from PostgreSQL cache")
    evaluated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    full_description: Optional[str] = Field(default=None, description="Full enriched job description")
    extracted_skills: Optional[List[str]] = Field(default=None, description="Newly extracted technical skills from full job description")
    seniority_audit: Optional[SeniorityAuditResponse] = Field(default=None, description="Seniority audit details")
