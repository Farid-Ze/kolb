"""assessment engine scaffold

Revision ID: 0008_assessment_engine_scaffold
Revises: 0007_expand_norm_group
Create Date: 2025-11-10
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = "0008_assessment_engine_scaffold"
down_revision = "0007_expand_norm_group"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    table_names = set(inspector.get_table_names())

    # Assessment session metadata
    if "assessment_sessions" not in table_names:
        raise RuntimeError("assessment_sessions table must exist before running this migration")

    session_columns = {col["name"] for col in inspector.get_columns("assessment_sessions")}
    added_assessment_id = False
    if "assessment_id" not in session_columns:
        op.add_column(
            "assessment_sessions",
            sa.Column("assessment_id", sa.String(length=40), nullable=True, server_default="KLSI"),
        )
        added_assessment_id = True
    added_assessment_version = False
    if "assessment_version" not in session_columns:
        op.add_column(
            "assessment_sessions",
            sa.Column("assessment_version", sa.String(length=10), nullable=True, server_default="4.0"),
        )
        added_assessment_version = True
    if added_assessment_id:
        op.execute("UPDATE assessment_sessions SET assessment_id='KLSI' WHERE assessment_id IS NULL")
        op.alter_column("assessment_sessions", "assessment_id", existing_type=sa.String(length=40), nullable=False, server_default=None)
    if added_assessment_version:
        op.execute("UPDATE assessment_sessions SET assessment_version='4.0' WHERE assessment_version IS NULL")
        op.alter_column("assessment_sessions", "assessment_version", existing_type=sa.String(length=10), nullable=False, server_default=None)
    if "version" in session_columns:
        with op.batch_alter_table("assessment_sessions") as batch_op:
            batch_op.drop_column("version")

    # Percentile provenance & flags
    if "percentile_scores" not in table_names:
        raise RuntimeError("percentile_scores table must exist before running this migration")

    percentile_columns = {col["name"] for col in inspector.get_columns("percentile_scores")}
    if "norm_provenance" not in percentile_columns:
        op.add_column(
            "percentile_scores",
            sa.Column("norm_provenance", sa.JSON(), nullable=True),
        )
    if "raw_outside_norm_range" not in percentile_columns:
        op.add_column(
            "percentile_scores",
            sa.Column(
                "raw_outside_norm_range",
                sa.Boolean(),
                nullable=False,
                server_default=sa.sql.expression.false(),
            ),
        )
    if "truncated_scales" not in percentile_columns:
        op.add_column(
            "percentile_scores",
            sa.Column("truncated_scales", sa.JSON(), nullable=True),
        )

    if "used_fallback_any" in percentile_columns:
        if bind.dialect.name != "sqlite":
            op.alter_column(
                "percentile_scores",
                "used_fallback_any",
                existing_type=sa.Integer(),
                type_=sa.Boolean(),
                existing_nullable=True,
                server_default=sa.sql.expression.true(),
            )
            op.execute(
                "UPDATE percentile_scores SET used_fallback_any = CASE WHEN used_fallback_any IN (1, '1', 't', 'true') THEN 1 ELSE 0 END"
            )
            op.alter_column(
                "percentile_scores",
                "used_fallback_any",
                existing_type=sa.Boolean(),
                nullable=False,
                server_default=None,
            )
        else:
            op.execute(
                "UPDATE percentile_scores SET used_fallback_any = CASE WHEN used_fallback_any IN (1, '1', 't', 'true') THEN 1 ELSE 0 END"
            )

    # LFI context guard
    if "lfi_context_scores" in table_names:
        constraints = {c["name"] for c in inspector.get_check_constraints("lfi_context_scores")}
        if "ck_context_name_not_blank" not in constraints:
            op.create_check_constraint(
                "ck_context_name_not_blank",
                "lfi_context_scores",
                "context_name <> ''",
            )

    # Longitudinal deltas table
    if "assessment_session_deltas" not in table_names:
        op.create_table(
            "assessment_session_deltas",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("session_id", sa.Integer(), sa.ForeignKey("assessment_sessions.id"), unique=True, nullable=False),
            sa.Column("previous_session_id", sa.Integer(), nullable=True),
            sa.Column("delta_acce", sa.Integer(), nullable=True),
            sa.Column("delta_aero", sa.Integer(), nullable=True),
            sa.Column("delta_lfi", sa.Float(), nullable=True),
            sa.Column("delta_intensity", sa.Integer(), nullable=True),
            sa.Column("computed_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )


def downgrade() -> None:
    op.drop_table("assessment_session_deltas")
    op.drop_constraint("ck_context_name_not_blank", "lfi_context_scores", type_="check")

    op.alter_column(
        "percentile_scores",
        "used_fallback_any",
        existing_type=sa.Boolean(),
        type_=sa.Integer(),
        existing_nullable=False,
        server_default=None,
    )
    op.execute(
        "UPDATE percentile_scores SET used_fallback_any = CASE WHEN used_fallback_any IN ('t', 'true', 1) THEN 1 ELSE 0 END"
    )
    op.drop_column("percentile_scores", "truncated_scales")
    op.drop_column("percentile_scores", "raw_outside_norm_range")
    op.drop_column("percentile_scores", "norm_provenance")

    with op.batch_alter_table("assessment_sessions") as batch_op:
        batch_op.add_column(sa.Column("version", sa.String(length=10), nullable=True))
    op.execute("UPDATE assessment_sessions SET version='KLSI 4.0' WHERE version IS NULL")
    op.alter_column("assessment_sessions", "assessment_version", server_default="4.0")
    op.alter_column("assessment_sessions", "assessment_id", server_default="KLSI")
    op.drop_column("assessment_sessions", "assessment_version")
    op.drop_column("assessment_sessions", "assessment_id")
