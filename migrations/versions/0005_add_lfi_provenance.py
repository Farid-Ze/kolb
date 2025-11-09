"""add LFI provenance column

Revision ID: 0005_add_lfi_provenance
Revises: 0004_team_research_schema
Create Date: 2025-11-10

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0005_add_lfi_provenance'
down_revision = '0004_team_research_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'learning_flexibility_index',
        sa.Column('norm_group_used', sa.String(length=50), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('learning_flexibility_index', 'norm_group_used')
