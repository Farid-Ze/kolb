"""add performance indexes for hot paths

Revision ID: 0018_perf_indexes
Revises: 0017_migrate_startup_to_migrations
Create Date: 2025-11-11
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0018_perf_indexes"
down_revision = "0017_migrate_startup_to_migrations"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Index: user_responses(session_id)
    op.create_index(
        "ix_user_responses_session_id",
        "user_responses",
        ["session_id"],
        unique=False,
    )
    # LFI contexts ordered access
    op.create_index(
        "ix_lfi_context_scores_session_context",
        "lfi_context_scores",
        ["session_id", "context_name"],
        unique=False,
    )
    # Filter by item_type (learning_style vs learning_flexibility)
    op.create_index(
        "ix_assessment_items_item_type",
        "assessment_items",
        ["item_type"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_assessment_items_item_type", table_name="assessment_items")
    op.drop_index("ix_lfi_context_scores_session_context", table_name="lfi_context_scores")
    op.drop_index("ix_user_responses_session_id", table_name="user_responses")
