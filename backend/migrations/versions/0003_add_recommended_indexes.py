"""add recommended performance indexes

Revision ID: 0003_add_recommended_indexes
Revises: 0002_materialized_class_stats
Create Date: 2025-11-08
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = '0003_add_recommended_indexes'
down_revision = '0002_materialized_class_stats'
branch_labels = None
depends_on = None

INDEX_SPECS = [
    # (index_name, table, columns, condition)
    ("ix_user_responses_session_item", "user_responses", ["session_id", "item_id"], None),
    ("ix_item_choices_item", "item_choices", ["item_id"], None),
    ("ix_assessment_items_number_type", "assessment_items", ["item_number", "item_type"], None),
    ("ix_scale_scores_session", "scale_scores", ["session_id"], None),
    ("ix_combination_scores_session", "combination_scores", ["session_id"], None),
    ("ix_user_learning_styles_session", "user_learning_styles", ["session_id"], None),
    ("ix_percentile_scores_session", "percentile_scores", ["session_id"], None),
    ("ix_lfi_context_scores_session", "lfi_context_scores", ["session_id"], None),
    ("ix_backup_learning_styles_session", "backup_learning_styles", ["session_id"], None),
]


def upgrade() -> None:
    conn = op.get_bind()
    dialect = conn.dialect.name
    for name, table, cols, _condition in INDEX_SPECS:
        col_list = ",".join(cols)
        if dialect == 'postgresql':
            op.execute(sa.text(f"CREATE INDEX IF NOT EXISTS {name} ON {table} ({col_list})"))
        else:
            # SQLite has no IF NOT EXISTS for index creation; attempt then ignore if exists
            try:
                op.create_index(name, table, cols)
            except Exception:
                pass


def downgrade() -> None:
    for name, table, _cols, _condition in INDEX_SPECS:
        try:
            op.drop_index(name, table_name=table)
        except Exception:
            pass
