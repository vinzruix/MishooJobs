"""replace category with seniority

Revision ID: 005_seniority
Revises: 004_published_at
Create Date: 2026-11-07 19:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "005_seniority"
down_revision: Union[str, None] = "004_published_at"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    bind = op.get_bind()

    # Create new enums safely
    seniority_level_enum = postgresql.ENUM(
        "pasantia", "primer_empleo", "junior", "mid", "senior",
        name="seniority_level_enum",
        create_type=False,
    )
    seniority_level_enum.create(bind, checkfirst=True)

    audit_status_enum = postgresql.ENUM(
        "preliminary", "verified",
        name="audit_status_enum",
        create_type=False,
    )
    audit_status_enum.create(bind, checkfirst=True)

    # Add new seniority columns to vacancies
    op.add_column(
        "vacancies",
        sa.Column("seniority_level", seniority_level_enum, nullable=False, server_default="junior"),
    )
    op.add_column(
        "vacancies",
        sa.Column("years_required_min", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "vacancies",
        sa.Column("is_real_first_job", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(
        "vacancies",
        sa.Column("audit_status", audit_status_enum, nullable=False, server_default="preliminary"),
    )
    op.add_column(
        "vacancies",
        sa.Column("reasoning", sa.Text(), nullable=False, server_default=""),
    )
    op.add_column(
        "vacancies",
        sa.Column("has_discrepancy", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )

    # Check constraint for years_required_min >= 0
    op.create_check_constraint(
        "ck_vacancies_years_required_min",
        "vacancies",
        "years_required_min >= 0",
    )

    # Create indexes
    op.create_index(
        "ix_vacancies_seniority_level",
        "vacancies",
        ["seniority_level"],
    )
    op.create_index(
        "ix_vacancies_is_real_first_job",
        "vacancies",
        ["is_real_first_job"],
    )
    op.create_index(
        "ix_vacancies_audit_status",
        "vacancies",
        ["audit_status"],
    )

    # Drop legacy category column
    op.drop_column("vacancies", "category")

    # Drop legacy category_enum type
    category_enum = postgresql.ENUM(name="category_enum")
    category_enum.drop(bind, checkfirst=True)


def downgrade() -> None:
    bind = op.get_bind()

    # Recreate category_enum
    category_enum = postgresql.ENUM(
        "becario", "practicas", "residencias", "servicio_social", "dualidad", "trainee", "junior",
        name="category_enum",
        create_type=False,
    )
    category_enum.create(bind, checkfirst=True)

    # Re-add category column
    op.add_column(
        "vacancies",
        sa.Column("category", category_enum, nullable=False, server_default="junior"),
    )
    op.create_index("ix_vacancies_category", "vacancies", ["category"])

    # Drop indexes and constraint
    op.drop_index("ix_vacancies_audit_status", table_name="vacancies")
    op.drop_index("ix_vacancies_is_real_first_job", table_name="vacancies")
    op.drop_index("ix_vacancies_seniority_level", table_name="vacancies")
    op.drop_constraint("ck_vacancies_years_required_min", "vacancies", type_="check")

    # Drop new columns
    op.drop_column("vacancies", "has_discrepancy")
    op.drop_column("vacancies", "reasoning")
    op.drop_column("vacancies", "audit_status")
    op.drop_column("vacancies", "is_real_first_job")
    op.drop_column("vacancies", "years_required_min")
    op.drop_column("vacancies", "seniority_level")

    # Drop new enum types
    audit_status_enum = postgresql.ENUM(name="audit_status_enum")
    audit_status_enum.drop(bind, checkfirst=True)

    seniority_level_enum = postgresql.ENUM(name="seniority_level_enum")
    seniority_level_enum.drop(bind, checkfirst=True)
