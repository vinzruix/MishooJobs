import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from mishoojobs.database import Base

class JobVacancy(Base):
    __tablename__ = "vacancies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    fingerprint: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    location_city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    location_state: Mapped[str] = mapped_column(String(50), nullable=False)
    modality: Mapped[str] = mapped_column(
        Enum("presencial", "hibrido", "remoto", name="modality_enum"),
        default="presencial",
        nullable=False,
    )
    category: Mapped[str] = mapped_column(
        Enum(
            "becario",
            "practicas",
            "residencias",
            "servicio_social",
            "dualidad",
            "trainee",
            "junior",
            name="category_enum",
        ),
        default="junior",
        nullable=False,
    )
    salary_min: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    salary_max: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    salary_period: Mapped[Optional[str]] = mapped_column(
        Enum("semanal", "quincenal", "mensual", "anual", name="salary_period_enum"),
        nullable=True,
    )
    currency: Mapped[str] = mapped_column(String(3), default="MXN", nullable=False)
    description_clean: Mapped[str] = mapped_column(Text, nullable=False)
    skills_extracted: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    published_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    is_verified_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    first_discovered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    last_verified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    external_links: Mapped[List["ExternalJobLink"]] = relationship(
        "ExternalJobLink", back_populates="vacancy", cascade="all, delete-orphan", lazy="selectin"
    )

    __table_args__ = (
        CheckConstraint(
            "salary_min IS NULL OR salary_max IS NULL OR salary_max >= salary_min",
            name="check_salary_range",
        ),
    )

class ExternalJobLink(Base):
    __tablename__ = "external_links"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    vacancy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vacancies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    portal_name: Mapped[str] = mapped_column(
        Enum("computrabajo", "indeed", "occ", name="portal_name_enum"),
        nullable=False,
    )
    external_job_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    direct_url: Mapped[str] = mapped_column(Text, nullable=False)
    http_status_code: Mapped[int] = mapped_column(Integer, default=200, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    verified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    vacancy: Mapped["JobVacancy"] = relationship("JobVacancy", back_populates="external_links")
