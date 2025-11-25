"""enforce zenotika trinity constraints

Revision ID: 0026_trinity_constraints
Revises: 0025_store_commerce_alignment
Create Date: 2025-11-22
"""
from alembic import op
import sqlalchemy as sa

revision = "0026_trinity_constraints"
down_revision = "0025_store_commerce_alignment"
branch_labels = None
depends_on = None


def _deduplicate_rows(table: str, partition_cols: list[str]) -> None:
    partition_expr = ", ".join(partition_cols)
    statement = sa.text(
        f"""
        DELETE FROM {table}
        WHERE id IN (
            SELECT id
            FROM (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY {partition_expr} ORDER BY id) AS rn
                FROM {table}
            ) ranked
            WHERE ranked.rn > 1
        )
        """
    )
    op.execute(statement)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    def _ensure_unique(table: str, name: str, columns: list[str]) -> None:
        if table not in tables:
            return
        existing = {uc["name"] for uc in inspector.get_unique_constraints(table)}
        if name in existing:
            return
        op.create_unique_constraint(name, table, columns)

    def _ensure_check(table: str, name: str, condition: str) -> None:
        if table not in tables:
            return
        existing = {cc["name"] for cc in inspector.get_check_constraints(table)}
        if name in existing:
            return
        op.create_check_constraint(name, table, condition)

    def _ensure_index(table: str, name: str, columns: list[str], unique: bool = False) -> None:
        if table not in tables:
            return
        existing = {idx["name"] for idx in inspector.get_indexes(table)}
        if name in existing:
            return
        op.create_index(name, table, columns, unique=unique)

    if "assessment_item_responses" in tables:
        _deduplicate_rows("assessment_item_responses", ["session_id", "item_id"])
        _ensure_unique(
            "assessment_item_responses",
            "uq_assessment_item_responses_session_item",
            ["session_id", "item_id"],
        )
        _ensure_check(
            "assessment_item_responses",
            "ck_assessment_item_responses_rank_range",
            "response_rank BETWEEN 1 AND 4",
        )
        _ensure_check(
            "assessment_item_responses",
            "ck_assessment_item_responses_item_range",
            "item_id BETWEEN 1 AND 12",
        )
        _ensure_index(
            "assessment_item_responses",
            "ix_assessment_item_responses_session",
            ["session_id"],
        )

    if "user_achievements" in tables:
        _deduplicate_rows("user_achievements", ["user_id", "badge_id"])
        _ensure_unique(
            "user_achievements",
            "uq_user_achievements_user_badge",
            ["user_id", "badge_id"],
        )

    if "user_challenges" in tables:
        _deduplicate_rows("user_challenges", ["user_id", "challenge_id"])
        _ensure_unique(
            "user_challenges",
            "uq_user_challenges_user_challenge",
            ["user_id", "challenge_id"],
        )

    _ensure_index("sphere_nodes", "ix_sphere_nodes_user_id", ["user_id"])
    _ensure_index("memory_reflections", "ix_memory_reflections_user_id", ["user_id"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    def _drop_constraint(table: str, name: str, constraint_type: str) -> None:
        if table not in tables:
            return
        op.drop_constraint(name, table, type_=constraint_type)

    def _drop_index(table: str, name: str) -> None:
        if table not in tables:
            return
        op.drop_index(name, table_name=table)

    _drop_constraint("assessment_item_responses", "uq_assessment_item_responses_session_item", "unique")
    _drop_constraint("assessment_item_responses", "ck_assessment_item_responses_rank_range", "check")
    _drop_constraint("assessment_item_responses", "ck_assessment_item_responses_item_range", "check")
    _drop_constraint("user_achievements", "uq_user_achievements_user_badge", "unique")
    _drop_constraint("user_challenges", "uq_user_challenges_user_challenge", "unique")

    _drop_index("assessment_item_responses", "ix_assessment_item_responses_session")
    _drop_index("sphere_nodes", "ix_sphere_nodes_user_id")
    _drop_index("memory_reflections", "ix_memory_reflections_user_id")
