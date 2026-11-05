import uuid
from datetime import datetime, timezone
from typing import List
from sqlalchemy import DateTime, Enum, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from mishoojobs.database import Base

class AIEvaluationCache(Base):
    __tablename__ = "ai_evaluation_cache"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    cache_key: Mapped[str] = mapped_column(
        String(128), unique=True, index=True, nullable=False
    )
    vacancy_fingerprint: Mapped[str] = mapped_column(
        String(64), index=True, nullable=False
    )
    target_role: Mapped[str] = mapped_column(String(100), nullable=False)
    skills_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    fit_score: Mapped[int] = mapped_column(Integer, nullable=False)
    fit_tier: Mapped[str] = mapped_column(
        Enum("high", "moderate", "low", name="fit_tier_enum"), nullable=False
    )
    matched_skills: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    missing_skills: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    role_readiness_summary: Mapped[str] = mapped_column(Text, nullable=False)
    actionable_advice: Mapped[str] = mapped_column(Text, nullable=False)
    evaluated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
