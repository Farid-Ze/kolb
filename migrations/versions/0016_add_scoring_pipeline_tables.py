"""add scoring pipeline tables and session pipeline version

Revision ID: 0016_add_scoring_pipeline_tables
Revises: 0015_enforce_unique_lfi_context
Create Date: 2025-11-11
"""
from __future__ import annotations

from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0016_add_scoring_pipeline_tables"
down_revision = "0015_enforce_unique_lfi_context"
branch_labels = None
depends_on = None


SCORING_PIPELINES = sa.Table(
    "scoring_pipelines",
    sa.MetaData(),
    sa.Column("id", sa.Integer(), primary_key=True),
    sa.Column("instrument_id", sa.Integer(), nullable=False),
    sa.Column("pipeline_code", sa.String(length=60), nullable=False),
    sa.Column("version", sa.String(length=20), nullable=False),
    sa.Column("description", sa.String(length=500), nullable=True),
    sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
    sa.Column("metadata_payload", sa.JSON(), nullable=True),
    sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
)

SCORING_PIPELINE_NODES = sa.Table(
    "scoring_pipeline_nodes",
    sa.MetaData(),
    sa.Column("id", sa.Integer(), primary_key=True),
    sa.Column("pipeline_id", sa.Integer(), nullable=False),
    sa.Column("node_key", sa.String(length=50), nullable=False),
    sa.Column("node_type", sa.String(length=40), nullable=False),
    sa.Column("execution_order", sa.Integer(), nullable=False),
    sa.Column("config", sa.JSON(), nullable=True),
    sa.Column("next_node_key", sa.String(length=50), nullable=True),
    sa.Column("is_terminal", sa.Boolean(), nullable=False, server_default=sa.text("0")),
    sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
)


def upgrade() -> None:
    op.add_column(
        "assessment_sessions",
        sa.Column("pipeline_version", sa.String(length=40), nullable=True),
    )
    op.create_table(
        "scoring_pipelines",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("instrument_id", sa.Integer(), nullable=False),
        sa.Column("pipeline_code", sa.String(length=60), nullable=False),
        sa.Column("version", sa.String(length=20), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("metadata_payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["instrument_id"], ["instruments.id"], name="fk_scoring_pipelines_instrument"),
        sa.UniqueConstraint(
            "instrument_id",
            "pipeline_code",
            "version",
            name="uq_pipeline_per_instrument_version",
        ),
    )
    op.create_table(
        "scoring_pipeline_nodes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("pipeline_id", sa.Integer(), nullable=False),
        sa.Column("node_key", sa.String(length=50), nullable=False),
        sa.Column("node_type", sa.String(length=40), nullable=False),
        sa.Column("execution_order", sa.Integer(), nullable=False),
        sa.Column("config", sa.JSON(), nullable=True),
        sa.Column("next_node_key", sa.String(length=50), nullable=True),
        sa.Column("is_terminal", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["pipeline_id"], ["scoring_pipelines.id"], name="fk_pipeline_nodes_pipeline"),
        sa.UniqueConstraint("pipeline_id", "node_key", name="uq_pipeline_node_key"),
        sa.UniqueConstraint("pipeline_id", "execution_order", name="uq_pipeline_order"),
    )

    connection = op.get_bind()

    instrument_id = connection.execute(
        sa.text("SELECT id FROM instruments WHERE code = :code AND version = :version"),
        {"code": "KLSI", "version": "4.0"},
    ).scalar()

    if instrument_id:
        now = datetime.now(timezone.utc)
        insert_pipeline = sa.insert(SCORING_PIPELINES).values(
            instrument_id=instrument_id,
            pipeline_code="KLSI4.0",
            version="v1",
            description="Default scoring pipeline for KLSI 4.0",
            is_active=True,
            metadata_payload={
                "strategy_code": "KLSI4.0",
                "stages": [
                    "compute_raw_scale_scores",
                    "compute_combination_scores",
                    "assign_learning_style",
                    "compute_lfi",
                    "apply_percentiles",
                ],
            },
            created_at=now,
        )
        pipeline_result = connection.execute(insert_pipeline)
        inserted_pk = pipeline_result.inserted_primary_key
        if not inserted_pk:
            raise RuntimeError("Failed to insert default scoring pipeline")
        pipeline_id = inserted_pk[0]

        nodes = [
            {
                "node_key": "compute_raw_scale_scores",
                "node_type": "service_call",
                "execution_order": 1,
                "config": {
                    "callable": "app.assessments.klsi_v4.logic.compute_raw_scale_scores",
                    "artifact_key": "raw_modes",
                },
                "next_node_key": "compute_combination_scores",
                "is_terminal": False,
            },
            {
                "node_key": "compute_combination_scores",
                "node_type": "service_call",
                "execution_order": 2,
                "config": {
                    "callable": "app.assessments.klsi_v4.logic.compute_combination_scores",
                    "artifact_key": "combination",
                },
                "next_node_key": "assign_learning_style",
                "is_terminal": False,
            },
            {
                "node_key": "assign_learning_style",
                "node_type": "service_call",
                "execution_order": 3,
                "config": {
                    "callable": "app.assessments.klsi_v4.logic.assign_learning_style",
                    "artifact_key": "style",
                },
                "next_node_key": "compute_lfi",
                "is_terminal": False,
            },
            {
                "node_key": "compute_lfi",
                "node_type": "service_call",
                "execution_order": 4,
                "config": {
                    "callable": "app.assessments.klsi_v4.logic.compute_lfi",
                    "artifact_key": "lfi",
                },
                "next_node_key": "apply_percentiles",
                "is_terminal": False,
            },
            {
                "node_key": "apply_percentiles",
                "node_type": "service_call",
                "execution_order": 5,
                "config": {
                    "callable": "app.assessments.klsi_v4.logic.apply_percentiles",
                    "artifact_key": "percentiles",
                },
                "next_node_key": None,
                "is_terminal": True,
            },
        ]
        for node in nodes:
            connection.execute(
                sa.insert(SCORING_PIPELINE_NODES).values(
                    pipeline_id=pipeline_id,
                    created_at=now,
                    **node,
                )
            )

        connection.execute(
            sa.text(
                "UPDATE assessment_sessions SET pipeline_version = :version "
                "WHERE instrument_id = :instrument_id"
            ),
            {
                "version": "KLSI4.0:v1",
                "instrument_id": instrument_id,
            },
        )


def downgrade() -> None:
    op.drop_table("scoring_pipeline_nodes")
    op.drop_table("scoring_pipelines")
    op.drop_column("assessment_sessions", "pipeline_version")
