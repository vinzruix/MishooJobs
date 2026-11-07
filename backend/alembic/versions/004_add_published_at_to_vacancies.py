"""add published_at to vacancies

Revision ID: 004_published_at
Revises: 003_scam_assessments
Create Date: 2026-11-06 23:17:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "004_published_at"
down_revision: Union[str, None] = "003_scam_assessments"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column(
        "vacancies",
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_vacancies_published_at",
        "vacancies",
        ["published_at"],
    )

def downgrade() -> None:
    op.drop_index("ix_vacancies_published_at", table_name="vacancies")
    op.drop_column("vacancies", "published_at")
