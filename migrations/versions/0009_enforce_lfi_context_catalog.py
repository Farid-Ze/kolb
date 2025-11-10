"""enforce canonical LFI context names

Revision ID: 0009_enforce_lfi_context_catalog
Revises: 0008_assessment_engine_scaffold
Create Date: 2025-11-10
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0009_enforce_lfi_context_catalog"
down_revision = "0008_assessment_engine_scaffold"
branch_labels = None
depends_on = None

_CANONICAL_CONTEXTS = (
    "Starting_Something_New",
    "Influencing_Someone",
    "Getting_To_Know_Someone",
    "Learning_In_A_Group",
    "Planning_Something",
    "Analyzing_Something",
    "Evaluating_An_Opportunity",
    "Choosing_Between_Alternatives",
)


def _constraint_sql() -> str:
    joined = ",".join(f"'{ctx}'" for ctx in _CANONICAL_CONTEXTS)
    return f"context_name IN ({joined})"


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = {c["name"] for c in inspector.get_check_constraints("lfi_context_scores")}
    if "ck_context_name_allowed" in existing:
        return

    if bind.dialect.name == "sqlite":
        with op.batch_alter_table("lfi_context_scores") as batch_op:
            batch_op.create_check_constraint("ck_context_name_allowed", _constraint_sql())
    else:
        op.create_check_constraint(
            "ck_context_name_allowed",
            "lfi_context_scores",
            _constraint_sql(),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = {c["name"] for c in inspector.get_check_constraints("lfi_context_scores")}
    if "ck_context_name_allowed" not in existing:
        return

    if bind.dialect.name == "sqlite":
        with op.batch_alter_table("lfi_context_scores") as batch_op:
            batch_op.drop_constraint("ck_context_name_allowed", type_="check")
    else:
        op.drop_constraint("ck_context_name_allowed", "lfi_context_scores", type_="check")
