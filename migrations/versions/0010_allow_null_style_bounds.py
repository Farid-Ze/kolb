"""allow null style window bounds for open intervals

Revision ID: 0010_allow_null_style_bounds
Revises: 0009_enforce_lfi_context_catalog
Create Date: 2025-11-10
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0010_allow_null_style_bounds"
down_revision = "0009_enforce_lfi_context_catalog"
branch_labels = None
depends_on = None


_COLUMNS = ("ACCE_min", "ACCE_max", "AERO_min", "AERO_max")

_VIEW_SQL = sa.text(
    """
    CREATE VIEW IF NOT EXISTS v_style_grid AS
    SELECT s.id AS session_id,
                 s.user_id,
                 cs.ACCE_raw,
                 cs.AERO_raw,
                 CASE
                     WHEN cs.ACCE_raw <= 5 THEN 'Low'
                     WHEN cs.ACCE_raw <= 14 THEN 'Mid'
                     ELSE 'High'
                 END AS acce_band,
                 CASE
                     WHEN cs.AERO_raw <= 0 THEN 'Low'
                     WHEN cs.AERO_raw <= 11 THEN 'Mid'
                     ELSE 'High'
                 END AS aero_band,
                 lst.style_name
    FROM assessment_sessions s
        JOIN combination_scores cs ON cs.session_id = s.id
        LEFT JOIN user_learning_styles uls ON uls.session_id = s.id
        LEFT JOIN learning_style_types lst ON lst.id = uls.primary_style_type_id
    """
)


def upgrade() -> None:
    op.execute(sa.text("DROP VIEW IF EXISTS v_style_grid"))
    with op.batch_alter_table("learning_style_types") as batch_op:
        for column in _COLUMNS:
            batch_op.alter_column(column, existing_type=sa.Integer(), nullable=True)
    op.execute(_VIEW_SQL)


def downgrade() -> None:
    op.execute(sa.text("DROP VIEW IF EXISTS v_style_grid"))
    with op.batch_alter_table("learning_style_types") as batch_op:
        for column in _COLUMNS:
            batch_op.alter_column(column, existing_type=sa.Integer(), nullable=False)
    op.execute(_VIEW_SQL)
