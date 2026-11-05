"""create ai_evaluation_cache table

Revision ID: 002_ai_evaluation_cache
Revises: 001_vacancies
Create Date: 2026-11-05 15:42:35.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002_ai_evaluation_cache"
down_revision: Union[str, None] = "001_vacancies"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    fit_tier_enum = postgresql.ENUM("high", "moderate", "low", name="fit_tier_enum", create_type=False)
    fit_tier_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "ai_evaluation_cache",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("cache_key", sa.String(length=128), nullable=False),
        sa.Column("vacancy_fingerprint", sa.String(length=64), nullable=False),
        sa.Column("target_role", sa.String(length=100), nullable=False),
        sa.Column("skills_hash", sa.String(length=64), nullable=False),
        sa.Column("fit_score", sa.Integer(), nullable=False),
        sa.Column("fit_tier", fit_tier_enum, nullable=False),
        sa.Column("matched_skills", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("missing_skills", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("role_readiness_summary", sa.Text(), nullable=False),
        sa.Column("actionable_advice", sa.Text(), nullable=False),
        sa.Column("evaluated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_ai_evaluation_cache_cache_key", "ai_evaluation_cache", ["cache_key"], unique=True)
    op.create_index("ix_ai_evaluation_cache_vacancy_fingerprint", "ai_evaluation_cache", ["vacancy_fingerprint"])

def downgrade() -> None:
    op.drop_index("ix_ai_evaluation_cache_vacancy_fingerprint", table_name="ai_evaluation_cache")
    op.drop_index("ix_ai_evaluation_cache_cache_key", table_name="ai_evaluation_cache")
    op.drop_table("ai_evaluation_cache")
