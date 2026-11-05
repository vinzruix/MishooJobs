import uuid
from datetime import datetime, timezone
from typing import List
from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from mishoojobs.database import Base

class ScamAssessment(Base):
    __tablename__ = "scam_assessments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    vacancy_fingerprint: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("vacancies.fingerprint", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    risk_level: Mapped[str] = mapped_column(
        Enum("safe", "warning", "critical", name="risk_level_enum"),
        default="safe",
        nullable=False,
    )
    risk_categories: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    matched_indicators: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    badge_label: Mapped[str] = mapped_column(String(100), nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    assessed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
