from typing import Any
from pydantic import BaseModel, Field


class ParseResumeResponse(BaseModel):
    yaml_content: str
    warnings: list[str] = Field(default_factory=list)


class GenerateTailoredCVRequest(BaseModel):
    master_profile: dict[str, Any]
    vacancy_title: str
    vacancy_company: str
    job_description: str
    vacancy_fingerprint: str | None = None
    desired_skills: list[str] = Field(default_factory=list)
    language: str = "es"


class GenerateRoleCVRequest(BaseModel):
    master_profile: dict[str, Any]
    target_role_title: str
    focus_tags: list[str] = Field(default_factory=list)
    language: str = "es"


class GenerateCVResponse(BaseModel):
    content: dict[str, Any]
    ats_match_score: int
    word_count: int
    curation_notes: str | None = None


class ErrorResponse(BaseModel):
    detail: str
