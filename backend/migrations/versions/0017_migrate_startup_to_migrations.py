"""migrate startup seeding and DDL from app.main to Alembic

Revision ID: 0017_migrate_startup_to_migrations
Revises: 0016_add_scoring_pipeline_tables
Create Date: 2025-11-11
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy import String, Integer

# revision identifiers, used by Alembic.
revision = "0017_migrate_startup_to_migrations"
down_revision = "0016_add_scoring_pipeline_tables"
branch_labels = None
depends_on = None


def _is_postgres() -> bool:
    bind = op.get_bind()
    return bind.dialect.name == "postgresql"


def upgrade() -> None:
    # Seed essential lookup: learning_style_types (idempotent)
    conn = op.get_bind()
    try:
        count = conn.execute(sa.text("SELECT COUNT(*) FROM learning_style_types")).scalar() or 0
    except Exception:
        count = 0
    if count == 0:
        # Import style definitions and windows from application seeds to avoid duplication
        try:
            from app.services.seeds import STYLE_DEFS, STYLE_WINDOWS  # type: ignore
        except Exception:
            STYLE_DEFS = [
                ("Initiating", "INIT"),
                ("Experiencing", "EXPR"),
                ("Imagining", "IMAG"),
                ("Reflecting", "REFL"),
                ("Analyzing", "ANAL"),
                ("Thinking", "THNK"),
                ("Deciding", "DECI"),
                ("Acting", "ACTN"),
                ("Balancing", "BALN"),
            ]
            # Conservative fallback windows (will be corrected by app seeds if run later)
            STYLE_WINDOWS = {
                name: {"ACCE_min": None, "ACCE_max": None, "AERO_min": None, "AERO_max": None}
                for name, _ in STYLE_DEFS
            }
        lst_table = table(
            "learning_style_types",
            column("style_name", String),
            column("style_code", String),
            column("ACCE_min", Integer),
            column("ACCE_max", Integer),
            column("AERO_min", Integer),
            column("AERO_max", Integer),
            column("description", String),
        )
        rows = []
        for name, code in STYLE_DEFS:
            w = STYLE_WINDOWS.get(name, {})
            rows.append(
                {
                    "style_name": name,
                    "style_code": code,
                    "ACCE_min": w.get("ACCE_min"),
                    "ACCE_max": w.get("ACCE_max"),
                    "AERO_min": w.get("AERO_min"),
                    "AERO_max": w.get("AERO_max"),
                    "description": None,
                }
            )
        if rows:
            op.bulk_insert(lst_table, rows)

    # Postgres-specific DDL: partial index and reporting view
    if _is_postgres():
        # Create partial index for completed sessions
        op.execute(
            """
            CREATE INDEX IF NOT EXISTS ix_assessment_sessions_completed 
            ON assessment_sessions (user_id, end_time)
            WHERE status = 'Completed';
            """
        )
        # Create or replace view for style grid
        op.execute(
            """
            CREATE OR REPLACE VIEW v_style_grid AS
            SELECT s.id AS session_id,
                   s.user_id,
                   cs.ACCE_raw,
                   cs.AERO_raw,
                   CASE
                       WHEN cs.ACCE_raw <= 5 THEN 'Low'
                       WHEN cs.ACCE_raw <= 14 THEN 'Mid'
                       ELSE 'High'
                   END AS acce_band,
                   CASE
                       WHEN cs.AERO_raw <= 0 THEN 'Low'
                       WHEN cs.AERO_raw <= 11 THEN 'Mid'
                       ELSE 'High'
                   END AS aero_band,
                   lst.style_name
            FROM assessment_sessions s
            JOIN combination_scores cs ON cs.session_id = s.id
            LEFT JOIN user_learning_styles uls ON uls.session_id = s.id
            LEFT JOIN learning_style_types lst ON lst.id = uls.primary_style_type_id;
            """
        )


def downgrade() -> None:
    # Best-effort cleanup for Postgres objects
    if _is_postgres():
        try:
            op.execute("DROP VIEW IF EXISTS v_style_grid")
        except Exception:
            pass
        try:
            op.execute("DROP INDEX IF EXISTS ix_assessment_sessions_completed")
        except Exception:
            pass
    # Do not delete seeded lookup rows on downgrade to avoid breaking references
