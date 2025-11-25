"""zenotika_3_0_models

Revision ID: 37aa3d6772e2
Revises: 0023_zen_identity_upgrade
Create Date: 2025-11-22 14:33:07.497448
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects import sqlite
# revision identifiers, used by Alembic.
revision = "37aa3d6772e2"
down_revision = '0023_zen_identity_upgrade'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = set(inspector.get_table_names())

    def _create_table_if_missing(name: str, factory) -> None:
        nonlocal existing_tables
        if name in existing_tables:
            return
        factory()
        existing_tables.add(name)

    def _ensure_index(table: str, name: str, columns: list[str], unique: bool = False) -> None:
        existing = {idx["name"] for idx in inspector.get_indexes(table)} if table in existing_tables else set()
        if name in existing:
            return
        op.create_index(name, table, columns, unique=unique)

    _create_table_if_missing(
        "gamification_badges",
        lambda: op.create_table(
            "gamification_badges",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("slug", sa.String(length=100), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("rarity", sa.Enum("common", "rare", "legendary", name="badgerarity"), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        ),
    )
    _ensure_index("gamification_badges", op.f("ix_gamification_badges_slug"), ["slug"], unique=True)

    _create_table_if_missing(
        "growth_challenges",
        lambda: op.create_table(
            "growth_challenges",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("target_style_deficiency", sa.String(length=100), nullable=False),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column("societal_impact", sa.Text(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        ),
    )

    _create_table_if_missing(
        "sphere_nodes",
        lambda: op.create_table(
            "sphere_nodes",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("pos_x", sa.Float(), nullable=False),
            sa.Column("pos_y", sa.Float(), nullable=False),
            sa.Column("pos_z", sa.Float(), nullable=False),
            sa.Column("unlock_date", sa.DateTime(), nullable=False),
            sa.Column("meta", sa.JSON(), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        ),
    )

    _create_table_if_missing(
        "store_products",
        lambda: op.create_table(
            "store_products",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column("base_price", sa.Integer(), nullable=False),
            sa.Column("required_badge_id", sa.Integer(), nullable=True),
            sa.Column("meta", sa.JSON(), nullable=True),
            sa.ForeignKeyConstraint(["required_badge_id"], ["gamification_badges.id"]),
            sa.PrimaryKeyConstraint("id"),
        ),
    )

    _create_table_if_missing(
        "user_achievements",
        lambda: op.create_table(
            "user_achievements",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("badge_id", sa.Integer(), nullable=False),
            sa.Column("awarded_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["badge_id"], ["gamification_badges.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        ),
    )

    _create_table_if_missing(
        "user_challenges",
        lambda: op.create_table(
            "user_challenges",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("challenge_id", sa.Integer(), nullable=False),
            sa.Column("status", sa.Enum("active", "completed", name="challengestatus"), nullable=False),
            sa.Column("proof_url", sa.String(length=255), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("completed_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["challenge_id"], ["growth_challenges.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        ),
    )

    _create_table_if_missing(
        "assessment_item_responses",
        lambda: op.create_table(
            "assessment_item_responses",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("session_id", sa.Integer(), nullable=False),
            sa.Column("item_id", sa.Integer(), nullable=False),
            sa.Column("response_rank", sa.Integer(), nullable=False),
            sa.Column("response_latency_ms", sa.Integer(), nullable=False),
            sa.Column("telemetry", sa.JSON(), nullable=True),
            sa.ForeignKeyConstraint(["session_id"], ["assessment_sessions.id"]),
            sa.PrimaryKeyConstraint("id"),
        ),
    )

    _create_table_if_missing(
        "memory_reflections",
        lambda: op.create_table(
            "memory_reflections",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("sphere_node_id", sa.Integer(), nullable=True),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("reflection_type", sa.Enum("thinking", "feeling", "acting", "watching", name="reflectiontype"), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["sphere_node_id"], ["sphere_nodes.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        ),
    )

    session_columns = {col["name"] for col in inspector.get_columns("assessment_sessions")}
    if "is_finalized" not in session_columns:
        op.add_column("assessment_sessions", sa.Column("is_finalized", sa.Boolean(), nullable=False, server_default='false'))
        op.execute("UPDATE assessment_sessions SET is_finalized = 0 WHERE is_finalized IS NULL")
        op.alter_column("assessment_sessions", "is_finalized", server_default=None)
    if "results_json" not in session_columns:
        op.add_column("assessment_sessions", sa.Column("results_json", sa.JSON(), nullable=True))

    user_columns = {col["name"] for col in inspector.get_columns("users")}
    if "avatar_url" not in user_columns:
        op.add_column('users', sa.Column('avatar_url', sa.String(length=255), nullable=True))
    if "zen_points" not in user_columns:
        op.add_column('users', sa.Column('zen_points', sa.Integer(), nullable=False, server_default='0'))
        op.alter_column('users', 'zen_points', server_default=None)
    if "current_lvl" not in user_columns:
        op.add_column('users', sa.Column('current_lvl', sa.Integer(), nullable=False, server_default='1'))
        op.alter_column('users', 'current_lvl', server_default=None)
    if "life_motto" not in user_columns:
        op.add_column('users', sa.Column('life_motto', sa.Text(), nullable=True))


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('users', 'life_motto')
    op.drop_column('users', 'current_lvl')
    op.drop_column('users', 'zen_points')
    op.drop_column('users', 'avatar_url')
    op.create_index('ix_team_rollup_team_date', 'team_assessment_rollup', ['team_id', 'date'], unique=False)
    op.drop_column('assessment_sessions', 'results_json')
    op.drop_column('assessment_sessions', 'is_finalized')
    op.create_table('engine_pages',
    sa.Column('id', sa.INTEGER(), nullable=False),
    sa.Column('form_id', sa.INTEGER(), nullable=False),
    sa.Column('page_code', sa.VARCHAR(length=60), nullable=False),
    sa.Column('title', sa.VARCHAR(length=200), nullable=True),
    sa.Column('page_order', sa.INTEGER(), nullable=False),
    sa.Column('created_at', sa.DATETIME(), nullable=False),
    sa.ForeignKeyConstraint(['form_id'], ['engine_forms.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('form_id', 'page_code', name='uq_engine_page_code_per_form')
    )
    op.create_table('engine_items',
    sa.Column('id', sa.INTEGER(), nullable=False),
    sa.Column('page_id', sa.INTEGER(), nullable=False),
    sa.Column('item_code', sa.VARCHAR(length=60), nullable=False),
    sa.Column('item_type', sa.VARCHAR(length=13), nullable=False),
    sa.Column('stem', sa.VARCHAR(length=1000), nullable=False),
    sa.Column('sequence_order', sa.INTEGER(), nullable=False),
    sa.Column('metadata_payload', sqlite.JSON(), nullable=True),
    sa.Column('created_at', sa.DATETIME(), nullable=False),
    sa.ForeignKeyConstraint(['page_id'], ['engine_pages.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('page_id', 'item_code', name='uq_engine_item_code_per_page')
    )
    op.create_table('engine_scales',
    sa.Column('id', sa.INTEGER(), nullable=False),
    sa.Column('instrument_id', sa.INTEGER(), nullable=False),
    sa.Column('scale_code', sa.VARCHAR(length=40), nullable=False),
    sa.Column('name', sa.VARCHAR(length=200), nullable=True),
    sa.Column('description', sa.VARCHAR(length=1000), nullable=True),
    sa.Column('ordering', sa.INTEGER(), nullable=False),
    sa.Column('created_at', sa.DATETIME(), nullable=False),
    sa.ForeignKeyConstraint(['instrument_id'], ['engine_instruments.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('instrument_id', 'scale_code', name='uq_engine_scale_code_per_instrument')
    )
    op.create_table('engine_item_options',
    sa.Column('id', sa.INTEGER(), nullable=False),
    sa.Column('item_id', sa.INTEGER(), nullable=False),
    sa.Column('option_code', sa.VARCHAR(length=40), nullable=False),
    sa.Column('option_text', sa.VARCHAR(length=500), nullable=False),
    sa.Column('learning_mode', sa.VARCHAR(length=10), nullable=True),
    sa.Column('value', sa.VARCHAR(length=40), nullable=True),
    sa.Column('metadata_payload', sqlite.JSON(), nullable=True),
    sa.ForeignKeyConstraint(['item_id'], ['engine_items.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('item_id', 'option_code', name='uq_engine_item_option_code')
    )
    op.create_table('engine_instruments',
    sa.Column('id', sa.INTEGER(), nullable=False),
    sa.Column('code', sa.VARCHAR(length=60), nullable=False),
    sa.Column('version', sa.VARCHAR(length=20), nullable=False),
    sa.Column('name', sa.VARCHAR(length=200), nullable=False),
    sa.Column('status', sa.VARCHAR(length=7), nullable=False),
    sa.Column('description', sa.VARCHAR(length=1000), nullable=True),
    sa.Column('created_at', sa.DATETIME(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('code', 'version', name='uq_engine_instrument_code_version')
    )
    op.create_table('engine_forms',
    sa.Column('id', sa.INTEGER(), nullable=False),
    sa.Column('instrument_id', sa.INTEGER(), nullable=False),
    sa.Column('form_code', sa.VARCHAR(length=60), nullable=False),
    sa.Column('title', sa.VARCHAR(length=200), nullable=True),
    sa.Column('ordering', sa.INTEGER(), nullable=False),
    sa.Column('is_active', sa.BOOLEAN(), nullable=False),
    sa.Column('created_at', sa.DATETIME(), nullable=False),
    sa.ForeignKeyConstraint(['instrument_id'], ['engine_instruments.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('instrument_id', 'form_code', name='uq_engine_form_code_per_instrument')
    )
    op.create_table('engine_scoring_rules',
    sa.Column('id', sa.INTEGER(), nullable=False),
    sa.Column('instrument_id', sa.INTEGER(), nullable=False),
    sa.Column('rule_code', sa.VARCHAR(length=60), nullable=False),
    sa.Column('rule_type', sa.VARCHAR(length=10), nullable=False),
    sa.Column('target', sa.VARCHAR(length=60), nullable=True),
    sa.Column('expression', sa.VARCHAR(length=1000), nullable=True),
    sa.Column('config', sqlite.JSON(), nullable=True),
    sa.Column('position', sa.INTEGER(), nullable=False),
    sa.Column('is_active', sa.BOOLEAN(), nullable=False),
    sa.Column('created_at', sa.DATETIME(), nullable=False),
    sa.CheckConstraint('position >= 0', name='ck_engine_rule_position_non_negative'),
    sa.ForeignKeyConstraint(['instrument_id'], ['engine_instruments.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('instrument_id', 'rule_code', name='uq_engine_rule_code_per_instrument')
    )
    op.drop_table('memory_reflections')
    op.drop_table('assessment_item_responses')
    op.drop_table('user_challenges')
    op.drop_table('user_achievements')
    op.drop_table('store_products')
    op.drop_table('sphere_nodes')
    op.drop_table('growth_challenges')
    op.drop_index(op.f('ix_gamification_badges_slug'), table_name='gamification_badges')
    op.drop_table('gamification_badges')
    # ### end Alembic commands ###
