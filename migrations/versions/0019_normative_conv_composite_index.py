"""Add composite index for normative_conversion_table lookups

Revision ID: 0019_normative_conv_composite_index
Revises: 0018_perf_indexes
Create Date: 2025-11-11
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0019_normative_conv_composite_index"
down_revision = "0018_perf_indexes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Composite index to accelerate (norm_group, norm_version, scale_name, raw_score) lookups
    try:
        op.create_index(
            "ix_normative_conv_group_ver_scale_raw",
            "normative_conversion_table",
            ["norm_group", "norm_version", "scale_name", "raw_score"],
            unique=False,
        )
    except Exception:
        # Some dialects or environments may already have a similar index; ignore
        pass


def downgrade() -> None:
    try:
        op.drop_index("ix_normative_conv_group_ver_scale_raw", table_name="normative_conversion_table")
    except Exception:
        pass
