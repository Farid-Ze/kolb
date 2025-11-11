"""enforce unique lfi context per session

Revision ID: 0015_enforce_unique_lfi_context
Revises: 0014_norm_version_tracking
Create Date: 2025-11-11
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0015_enforce_unique_lfi_context"
down_revision = "0014_norm_version_tracking"
branch_labels = None
depends_on = None


def _cleanup_duplicates() -> None:
    op.execute(
        sa.text(
            """
            DELETE FROM lfi_context_scores
            WHERE id NOT IN (
                SELECT min_id FROM (
                    SELECT MIN(id) AS min_id
                    FROM lfi_context_scores
                    GROUP BY session_id, context_name
                ) AS keepers
            )
            """
        )
    )


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    existing = {c["name"] for c in inspector.get_unique_constraints("lfi_context_scores")}
    if "uq_lfi_context_per_session" in existing:
        return

    _cleanup_duplicates()

    if bind.dialect.name == "sqlite":
        with op.batch_alter_table("lfi_context_scores") as batch_op:
            batch_op.create_unique_constraint(
                "uq_lfi_context_per_session", ["session_id", "context_name"]
            )
    else:
        op.create_unique_constraint(
            "uq_lfi_context_per_session",
            "lfi_context_scores",
            ["session_id", "context_name"],
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = {c["name"] for c in inspector.get_unique_constraints("lfi_context_scores")}
    if "uq_lfi_context_per_session" not in existing:
        return

    if bind.dialect.name == "sqlite":
        with op.batch_alter_table("lfi_context_scores") as batch_op:
            batch_op.drop_constraint("uq_lfi_context_per_session", type_="unique")
    else:
        op.drop_constraint("uq_lfi_context_per_session", "lfi_context_scores", type_="unique")
