"""add session lookup indexes for finalize pipeline

Adds explicit indexes on session_id columns for tables frequently joined
during the finalize pipeline and reporting queries. These indexes optimize
the hot path queries for percentile scores, combination scores, learning
styles, and scale provenance lookups.

Revision ID: 0020_add_session_lookup_indexes
Revises: 0019_normative_conv_composite_index
Create Date: 2025-11-14
"""
from __future__ import annotations

from alembic import op

# revision identifiers, used by Alembic.
revision = "0020_add_session_lookup_indexes"
down_revision = "0019_normative_conv_composite_index"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add indexes for hot path session lookups.
    
    These indexes optimize:
    1. PercentileScore lookups by session_id (finalize pipeline)
    2. CombinationScore lookups by session_id (finalize pipeline)
    3. UserLearningStyle lookups by session_id (reporting)
    4. ScaleProvenance composite lookup by (session_id, scale_code)
    
    Note: SQLite creates implicit indexes for unique constraints,
    but explicit indexes improve query planning and are portable
    across database backends.
    """
    # Get database dialect to check if we're using PostgreSQL
    bind = op.get_bind()
    dialect = bind.dialect.name
    
    # Index on percentile_scores.session_id
    # Unique constraint already exists, but explicit index improves portability
    # Use postgresql_include only on PostgreSQL (not supported on SQLite)
    include_columns: list[str] | None = None
    if dialect == "postgresql":
        include_columns = ["norm_group_used"]  # Include for index-only scans

    op.create_index(
        "ix_percentile_scores_session_id",
        "percentile_scores",
        ["session_id"],
        unique=True,
        postgresql_include=include_columns,
    )
    
    # Index on combination_scores.session_id
    op.create_index(
        "ix_combination_scores_session_id",
        "combination_scores",
        ["session_id"],
        unique=True,
    )
    
    # Index on user_learning_styles.session_id
    op.create_index(
        "ix_user_learning_styles_session_id",
        "user_learning_styles",
        ["session_id"],
        unique=True,
    )
    
    # Composite index on scale_provenance(session_id, scale_code)
    # This supports both lookups by session and by (session, scale) pairs
    op.create_index(
        "ix_scale_provenance_session_scale",
        "scale_provenance",
        ["session_id", "scale_code"],
        unique=False,
    )


def downgrade() -> None:
    """Remove session lookup indexes."""
    op.drop_index("ix_scale_provenance_session_scale", table_name="scale_provenance")
    op.drop_index("ix_user_learning_styles_session_id", table_name="user_learning_styles")
    op.drop_index("ix_combination_scores_session_id", table_name="combination_scores")
    op.drop_index("ix_percentile_scores_session_id", table_name="percentile_scores")
