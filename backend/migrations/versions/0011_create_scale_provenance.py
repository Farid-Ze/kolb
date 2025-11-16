"""create scale provenance table

Revision ID: 0011_create_scale_provenance
Revises: 0010_allow_null_style_bounds
Create Date: 2025-11-10
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0011_create_scale_provenance"
down_revision = "0010_allow_null_style_bounds"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "scale_provenance",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("session_id", sa.Integer(), sa.ForeignKey("assessment_sessions.id"), nullable=False),
        sa.Column("scale_code", sa.String(length=10), nullable=False),
        sa.Column("raw_score", sa.Float(), nullable=False),
        sa.Column("percentile_value", sa.Float(), nullable=True),
        sa.Column("provenance_tag", sa.String(length=80), nullable=False),
        sa.Column("source_kind", sa.String(length=20), nullable=False),
        sa.Column("norm_group", sa.String(length=150), nullable=True),
        sa.Column(
            "truncated",
            sa.Boolean(),
            nullable=False,
            server_default=sa.sql.expression.false(),
        ),
        sa.UniqueConstraint("session_id", "scale_code", name="uq_scale_provenance_session_scale"),
    )
    op.create_index(
        "ix_scale_provenance_session_id",
        "scale_provenance",
        ["session_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_scale_provenance_session_id", table_name="scale_provenance")
    op.drop_table("scale_provenance")
