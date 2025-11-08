"""initial schema with unique constraint, view and partial index

Revision ID: 0001_initial
Revises: 
Create Date: 2025-11-08
"""
from __future__ import annotations
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create all tables from SQLAlchemy metadata
    # We rely on autogenerate-like approach: create_missing tables
    # For simplicity, call op.create_table for key tables if not exists would be complex;
    # instead, execute metadata.create_all prior to migrations. Here we add constraints and views.

    # Add unique constraint to normative_conversion_table
    conn = op.get_bind()
    dialect = conn.dialect.name
    if dialect == 'postgresql':
        op.execute(
            sa.text(
                """
                DO $$ BEGIN
                  IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'uq_norm_group_scale_raw'
                  ) THEN
                    ALTER TABLE normative_conversion_table
                    ADD CONSTRAINT uq_norm_group_scale_raw UNIQUE (norm_group, scale_name, raw_score);
                  END IF;
                END $$;
                """
            )
        )
    else:
        # For SQLite and others, try to add constraint directly (may not be supported)
        try:
            op.create_unique_constraint(
                'uq_norm_group_scale_raw', 'normative_conversion_table', ['norm_group','scale_name','raw_score']
            )
        except Exception:
            pass

    # Create or replace view v_style_grid (PostgreSQL & SQLite compatible SELECT)
    op.execute(
        sa.text(
            """
            CREATE VIEW IF NOT EXISTS v_style_grid AS
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
              LEFT JOIN learning_style_types lst ON lst.id = uls.primary_style_type_id
            """
        )
    )

    # Create partial index for completed sessions (PostgreSQL only)
    if dialect == 'postgresql':
        op.execute(
            sa.text(
                """
                DO $$ BEGIN
                  IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'ix_assessment_sessions_completed'
                  ) THEN
                    EXECUTE 'CREATE INDEX ix_assessment_sessions_completed ON assessment_sessions (user_id, end_time) WHERE status = ''Completed''';
                  END IF;
                END $$;
                """
            )
        )


def downgrade() -> None:
    conn = op.get_bind()
    dialect = conn.dialect.name
    # Drop view
    op.execute(sa.text("DROP VIEW IF EXISTS v_style_grid"))
    # Drop index
    if dialect == 'postgresql':
        op.execute(sa.text("DROP INDEX IF EXISTS ix_assessment_sessions_completed"))
    # Drop unique constraint
    try:
        op.drop_constraint('uq_norm_group_scale_raw', 'normative_conversion_table', type_='unique')
    except Exception:
        pass
