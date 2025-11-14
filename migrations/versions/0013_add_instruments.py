"""add instrument metadata tables and strategy tracking

Revision ID: 0013_add_instruments
Revises: 0012_backfill_scale_provenance
Create Date: 2025-11-10
"""
from __future__ import annotations

from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0013_add_instruments"
down_revision = "0012_backfill_scale_provenance"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "instruments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(length=40), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("version", sa.String(length=20), nullable=False),
        sa.Column("default_strategy_code", sa.String(length=40), nullable=True),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.UniqueConstraint("code", name="uq_instruments_code"),
    )
    op.create_index("ix_instruments_code", "instruments", ["code"], unique=True)

    op.create_table(
        "instrument_scales",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("instrument_id", sa.Integer(), nullable=False),
        sa.Column("scale_code", sa.String(length=20), nullable=False),
        sa.Column("display_name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("rendering_order", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["instrument_id"], ["instruments.id"], name="fk_instrument_scales_instrument"),
        sa.UniqueConstraint("instrument_id", "scale_code", name="uq_instrument_scale_code"),
    )

    op.add_column("assessment_sessions", sa.Column("instrument_id", sa.Integer(), nullable=True))
    op.add_column("assessment_sessions", sa.Column("strategy_code", sa.String(length=40), nullable=True))
    op.create_foreign_key(
        "fk_assessment_sessions_instrument",
        "assessment_sessions",
        "instruments",
        ["instrument_id"],
        ["id"],
    )

    connection = op.get_bind()

    now = datetime.now(timezone.utc)
    connection.execute(
        sa.text(
            "INSERT INTO instruments (code, name, version, default_strategy_code, description, is_active, created_at) "
            "VALUES (:code, :name, :version, :strategy, :description, :active, :created_at)"
        ),
        {
            "code": "KLSI",
            "name": "Kolb Learning Style Inventory",
            "version": "4.0",
            "strategy": "KLSI4.0",
            "description": "Kolb Learning Style Inventory 4.0",
            "active": True,
            "created_at": now,
        },
    )

    instrument_id = connection.execute(
        sa.text("SELECT id FROM instruments WHERE code = :code"),
        {"code": "KLSI"},
    ).scalar_one()

    scale_rows = [
        ("CE", "Concrete Experience", 1),
        ("RO", "Reflective Observation", 2),
        ("AC", "Abstract Conceptualization", 3),
        ("AE", "Active Experimentation", 4),
        ("ACCE", "AC - CE Dialectic", 5),
        ("AERO", "AE - RO Dialectic", 6),
        ("LFI", "Learning Flexibility Index", 7),
    ]
    for code, display_name, order in scale_rows:
        connection.execute(
            sa.text(
                "INSERT INTO instrument_scales (instrument_id, scale_code, display_name, rendering_order) "
                "VALUES (:instrument_id, :scale_code, :display_name, :rendering_order)"
            ),
            {
                "instrument_id": instrument_id,
                "scale_code": code,
                "display_name": display_name,
                "rendering_order": order,
            },
        )

    connection.execute(
        sa.text(
            "UPDATE assessment_sessions SET instrument_id = :instrument_id "
            "WHERE assessment_id = :assessment_id AND assessment_version = :assessment_version"
        ),
        {
            "instrument_id": instrument_id,
            "assessment_id": "KLSI",
            "assessment_version": "4.0",
        },
    )

    connection.execute(
        sa.text(
            "UPDATE assessment_sessions SET strategy_code = COALESCE(strategy_code, :strategy_code) "
            "WHERE assessment_id = :assessment_id AND assessment_version = :assessment_version"
        ),
        {
            "strategy_code": "KLSI4.0",
            "assessment_id": "KLSI",
            "assessment_version": "4.0",
        },
    )


def downgrade() -> None:
    op.drop_constraint("fk_assessment_sessions_instrument", "assessment_sessions", type_="foreignkey")
    op.drop_column("assessment_sessions", "strategy_code")
    op.drop_column("assessment_sessions", "instrument_id")
    op.drop_table("instrument_scales")
    op.drop_index("ix_instruments_code", table_name="instruments")
    op.drop_table("instruments")