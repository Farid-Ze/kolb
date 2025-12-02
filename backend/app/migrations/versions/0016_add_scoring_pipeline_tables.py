"""add scoring pipeline tables and session pipeline version

Revision ID: 0016_add_scoring_pipeline_tables
Revises: 0015_enforce_unique_lfi_context
Create Date: 2025-11-11
"""
from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0016_add_scoring_pipeline_tables"
down_revision = "0015_enforce_unique_lfi_context"
branch_labels = None
depends_on = None



def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    session_columns = {col["name"] for col in inspector.get_columns("assessment_sessions")}
    if "pipeline_version" not in session_columns:
        op.add_column(
            "assessment_sessions",
            sa.Column("pipeline_version", sa.String(length=40), nullable=True),
        )

    # Force clean state
    op.execute("DROP TABLE IF EXISTS scoring_pipeline_nodes")
    op.execute("DROP TABLE IF EXISTS scoring_pipelines")

    op.create_table(
        "scoring_pipelines",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("instrument_id", sa.Integer(), nullable=False),
        sa.Column("pipeline_code", sa.String(length=60), nullable=False),
        sa.Column("version", sa.String(length=20), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("metadata_payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
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
        sa.Column("is_terminal", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["pipeline_id"], ["scoring_pipelines.id"], name="fk_pipeline_nodes_pipeline"),
        sa.UniqueConstraint("pipeline_id", "node_key", name="uq_pipeline_node_key"),
        sa.UniqueConstraint("pipeline_id", "execution_order", name="uq_pipeline_order"),
    )

    connection = bind

    instrument_id = connection.execute(
        sa.text("SELECT id FROM instruments WHERE code = :code AND version = :version"),
        {"code": "KLSI", "version": "4.0"},
    ).scalar()

    pipeline_exists = connection.execute(
        sa.text(
            "SELECT id FROM scoring_pipelines WHERE instrument_id = :instrument_id AND pipeline_code = :code AND version = :version"
        ),
        {"instrument_id": instrument_id, "code": "KLSI4.0", "version": "v1"},
    ).scalar() if instrument_id else None

    if instrument_id and not pipeline_exists:
        import json
        metadata_json = json.dumps({
            "strategy_code": "KLSI4.0",
            "stages": [
                "compute_raw_scale_scores",
                "compute_combination_scores",
                "assign_learning_style",
                "compute_lfi",
                "apply_percentiles",
            ],
        })
        
        pipeline_result = connection.execute(
            sa.text("""
                INSERT INTO scoring_pipelines 
                (instrument_id, pipeline_code, version, description, is_active, metadata_payload, created_at)
                VALUES (:instrument_id, :pipeline_code, :version, :description, :is_active, CAST(:metadata_payload AS JSON), :created_at)
                RETURNING id
            """),
            {
                "instrument_id": instrument_id,
                "pipeline_code": "KLSI4.0",
                "version": "v1",
                "description": "Default scoring pipeline for KLSI 4.0",
                "is_active": True,
                "metadata_payload": metadata_json,
                "created_at": datetime.now(timezone.utc),
            }
        )
        pipeline_id = pipeline_result.scalar()

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
        import json
        for node in nodes:
            config_json = json.dumps(node["config"])
            connection.execute(
                sa.text("""
                    INSERT INTO scoring_pipeline_nodes 
                    (pipeline_id, node_key, node_type, execution_order, config, next_node_key, is_terminal, created_at)
                    VALUES (:pipeline_id, :node_key, :node_type, :execution_order, CAST(:config AS JSON), :next_node_key, :is_terminal, :created_at)
                """),
                {
                    "pipeline_id": pipeline_id,
                    "node_key": node["node_key"],
                    "node_type": node["node_type"],
                    "execution_order": node["execution_order"],
                    "config": config_json,
                    "next_node_key": node["next_node_key"],
                    "is_terminal": node["is_terminal"],
                    "created_at": datetime.now(timezone.utc),
                }
            )

        connection.execute(
            sa.text(
                "UPDATE assessment_sessions SET pipeline_version = :version "
                "WHERE instrument_id = :instrument_id AND pipeline_version IS NULL"
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
