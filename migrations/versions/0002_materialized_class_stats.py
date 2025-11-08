"""materialized view for class style stats (PostgreSQL only)

Revision ID: 0002_materialized_class_stats
Revises: 0001_initial
Create Date: 2025-11-08
"""
from __future__ import annotations
from alembic import op
import sqlalchemy as sa

revision = '0002_materialized_class_stats'
down_revision = '0001_initial'
branch_labels = None
depends_on = None

def upgrade() -> None:
    conn = op.get_bind()
    if conn.dialect.name != 'postgresql':
        return
    # Create materialized view aggregating counts by kelas, style band and style name
    op.execute(sa.text(
        """
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_class_style_stats AS
        SELECT u.kelas,
               s.end_time::date AS date,
               cs.ACCE_raw,
               cs.AERO_raw,
               CASE WHEN cs.ACCE_raw <= 5 THEN 'Low' WHEN cs.ACCE_raw <= 14 THEN 'Mid' ELSE 'High' END AS acce_band,
               CASE WHEN cs.AERO_raw <= 0 THEN 'Low' WHEN cs.AERO_raw <= 11 THEN 'Mid' ELSE 'High' END AS aero_band,
               lst.style_name,
               COUNT(*) AS cnt
        FROM assessment_sessions s
        JOIN users u ON u.id = s.user_id
        JOIN combination_scores cs ON cs.session_id = s.id
        LEFT JOIN user_learning_styles uls ON uls.session_id = s.id
        LEFT JOIN learning_style_types lst ON lst.id = uls.primary_style_type_id
        WHERE s.status = 'Completed'
        GROUP BY u.kelas, s.end_time::date, cs.ACCE_raw, cs.AERO_raw, acce_band, aero_band, lst.style_name;
        """
    ))
    # Indexes to speed up refresh and querying
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_mv_class_style_kelas_date ON mv_class_style_stats (kelas, date)"))


def downgrade() -> None:
    conn = op.get_bind()
    if conn.dialect.name != 'postgresql':
        return
    op.execute(sa.text("DROP MATERIALIZED VIEW IF EXISTS mv_class_style_stats"))
