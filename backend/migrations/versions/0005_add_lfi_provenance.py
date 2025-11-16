"""add LFI provenance column

Revision ID: 0005_add_lfi_provenance
Revises: 0004_team_research_schema
Create Date: 2025-11-10

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '0005_add_lfi_provenance'
down_revision = '0004_team_research_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "learning_flexibility_index" not in inspector.get_table_names():
        op.create_table(
            "learning_flexibility_index",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column(
                "session_id",
                sa.Integer,
                sa.ForeignKey("assessment_sessions.id"),
                nullable=False,
                unique=True,
            ),
            sa.Column("W_coefficient", sa.Float, nullable=False),
            sa.Column("LFI_score", sa.Float, nullable=False),
            sa.Column("LFI_percentile", sa.Float, nullable=True),
            sa.Column("flexibility_level", sa.String(length=20), nullable=True),
        )
    columns = {col['name'] for col in inspector.get_columns('learning_flexibility_index')}
    if 'norm_group_used' not in columns:
        op.add_column(
            'learning_flexibility_index',
            sa.Column('norm_group_used', sa.String(length=50), nullable=True),
        )


def downgrade() -> None:
    op.drop_column('learning_flexibility_index', 'norm_group_used')
