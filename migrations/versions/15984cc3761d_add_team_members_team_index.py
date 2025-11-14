"""add team members team index

Revision ID: 15984cc3761d
Revises: 0020_add_session_lookup_indexes
Create Date: 2025-11-14 22:34:11.480577
"""
from __future__ import annotations

from alembic import op

# revision identifiers, used by Alembic.
revision = "15984cc3761d"
down_revision = "0020_add_session_lookup_indexes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_team_members_team_id",
        "team_members",
        ["team_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_team_members_team_id", table_name="team_members")
