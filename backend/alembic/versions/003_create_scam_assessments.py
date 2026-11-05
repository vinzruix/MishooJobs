"""create scam_assessments table

Revision ID: 003_scam_assessments
Revises: 002_ai_evaluation_cache
Create Date: 2026-11-05 15:46:10.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "003_scam_assessments"
down_revision: Union[str, None] = "002_ai_evaluation_cache"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    risk_level_enum = postgresql.ENUM("safe", "warning", "critical", name="risk_level_enum", create_type=False)
    risk_level_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "scam_assessments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "vacancy_fingerprint",
            sa.String(length=64),
            sa.ForeignKey("vacancies.fingerprint", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("risk_level", risk_level_enum, nullable=False, server_default="safe"),
        sa.Column("risk_categories", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("matched_indicators", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("badge_label", sa.String(length=100), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column("assessed_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_scam_assessments_vacancy_fingerprint", "scam_assessments", ["vacancy_fingerprint"])

def downgrade() -> None:
    op.drop_index("ix_scam_assessments_vacancy_fingerprint", table_name="scam_assessments")
    op.drop_table("scam_assessments")
