"""create vacancies and external links

Revision ID: 001_vacancies
Revises: 
Create Date: 2026-11-05 15:37:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001_vacancies"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Create enum types safely
    modality_enum = postgresql.ENUM("presencial", "hibrido", "remoto", name="modality_enum", create_type=False)
    category_enum = postgresql.ENUM(
        "becario", "practicas", "residencias", "servicio_social", "dualidad", "trainee", "junior",
        name="category_enum", create_type=False
    )
    salary_period_enum = postgresql.ENUM("semanal", "quincenal", "mensual", "anual", name="salary_period_enum", create_type=False)
    portal_name_enum = postgresql.ENUM("computrabajo", "indeed", "occ", name="portal_name_enum", create_type=False)

    modality_enum.create(op.get_bind(), checkfirst=True)
    category_enum.create(op.get_bind(), checkfirst=True)
    salary_period_enum.create(op.get_bind(), checkfirst=True)
    portal_name_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "vacancies",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("fingerprint", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("company_name", sa.String(length=255), nullable=False),
        sa.Column("location_city", sa.String(length=100), nullable=True),
        sa.Column("location_state", sa.String(length=50), nullable=False),
        sa.Column("modality", modality_enum, nullable=False, server_default="presencial"),
        sa.Column("category", category_enum, nullable=False, server_default="junior"),
        sa.Column("salary_min", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("salary_max", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("salary_period", salary_period_enum, nullable=True),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="MXN"),
        sa.Column("description_clean", sa.Text(), nullable=False),
        sa.Column("skills_extracted", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("is_verified_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("first_discovered_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_verified_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "salary_min IS NULL OR salary_max IS NULL OR salary_max >= salary_min",
            name="check_salary_range",
        ),
    )
    op.create_index("ix_vacancies_fingerprint", "vacancies", ["fingerprint"], unique=True)

    op.create_table(
        "external_links",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("vacancy_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("vacancies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("portal_name", portal_name_enum, nullable=False),
        sa.Column("external_job_id", sa.String(length=100), nullable=True),
        sa.Column("direct_url", sa.Text(), nullable=False),
        sa.Column("http_status_code", sa.Integer(), nullable=False, server_default="200"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_external_links_vacancy_id", "external_links", ["vacancy_id"])

def downgrade() -> None:
    op.drop_index("ix_external_links_vacancy_id", table_name="external_links")
    op.drop_table("external_links")
    op.drop_index("ix_vacancies_fingerprint", table_name="vacancies")
    op.drop_table("vacancies")
