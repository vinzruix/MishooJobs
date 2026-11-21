"""allow nullable years_required_min

Revision ID: 006_nullable_years_min
Revises: 005_seniority
Create Date: 2026-11-16 16:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "006_nullable_years_min"
down_revision: Union[str, None] = "005_seniority"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.alter_column(
        "vacancies",
        "years_required_min",
        existing_type=sa.Integer(),
        nullable=True,
    )
    # Update check constraint
    op.drop_constraint("ck_vacancies_years_required_min", "vacancies", type_="check")
    op.create_check_constraint(
        "ck_vacancies_years_required_min",
        "vacancies",
        "years_required_min IS NULL OR years_required_min >= 0",
    )

def downgrade() -> None:
    # Set NULL values back to 0 before restoring NOT NULL
    op.execute("UPDATE vacancies SET years_required_min = 0 WHERE years_required_min IS NULL")
    op.alter_column(
        "vacancies",
        "years_required_min",
        existing_type=sa.Integer(),
        nullable=False,
        server_default="0",
    )
    op.drop_constraint("ck_vacancies_years_required_min", "vacancies", type_="check")
    op.create_check_constraint(
        "ck_vacancies_years_required_min",
        "vacancies",
        "years_required_min >= 0",
    )
