"""create team and research schema tables

Revision ID: 0004_team_research_schema
Revises: 0003_add_recommended_indexes
Create Date: 2025-11-08
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = '0004_team_research_schema'
down_revision = '0003_add_recommended_indexes'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = set(inspector.get_table_names())
    # teams
    if 'teams' not in existing_tables:
        op.create_table(
            'teams',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('name', sa.String(100), nullable=False, unique=True),
            sa.Column('kelas', sa.String(20), nullable=True),
            sa.Column('description', sa.String(500), nullable=True),
            sa.Column('created_at', sa.DateTime, nullable=False),
        )
    # team_members
    if 'team_members' not in existing_tables:
        op.create_table(
            'team_members',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('team_id', sa.Integer, sa.ForeignKey('teams.id'), nullable=False),
            sa.Column('user_id', sa.Integer, sa.ForeignKey('users.id'), nullable=False),
            sa.Column('role_in_team', sa.String(50), nullable=True),
            sa.Column('joined_at', sa.DateTime, nullable=False),
            sa.UniqueConstraint('team_id', 'user_id', name='uq_team_user_unique'),
        )
    # team_assessment_rollup
    table_rollup_exists = 'team_assessment_rollup' in existing_tables
    if not table_rollup_exists:
        op.create_table(
            'team_assessment_rollup',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('team_id', sa.Integer, sa.ForeignKey('teams.id'), nullable=False),
            sa.Column('date', sa.Date, nullable=False),
            sa.Column('total_sessions', sa.Integer, nullable=False),
            sa.Column('avg_lfi', sa.Float, nullable=True),
            sa.Column('style_counts', sa.JSON, nullable=True),
            sa.UniqueConstraint('team_id', 'date', name='uq_team_date_unique'),
        )
    if not table_rollup_exists:
        op.create_index('ix_team_rollup_team_date', 'team_assessment_rollup', ['team_id', 'date'])
    else:
        existing_indexes = {idx['name'] for idx in inspector.get_indexes('team_assessment_rollup')}
        if 'ix_team_rollup_team_date' not in existing_indexes:
            op.create_index('ix_team_rollup_team_date', 'team_assessment_rollup', ['team_id', 'date'])

    # research
    if 'research_studies' not in existing_tables:
        op.create_table(
            'research_studies',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('title', sa.String(200), nullable=False),
            sa.Column('description', sa.String(1000), nullable=True),
            sa.Column('started_at', sa.DateTime, nullable=True),
            sa.Column('completed_at', sa.DateTime, nullable=True),
            sa.Column('notes', sa.String(1000), nullable=True),
        )
    if 'reliability_results' not in existing_tables:
        op.create_table(
            'reliability_results',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('study_id', sa.Integer, sa.ForeignKey('research_studies.id'), nullable=False),
            sa.Column('metric_name', sa.String(100), nullable=False),
            sa.Column('value', sa.Float, nullable=False),
            sa.Column('notes', sa.String(500), nullable=True),
        )
    if 'validity_evidence' not in existing_tables:
        op.create_table(
            'validity_evidence',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('study_id', sa.Integer, sa.ForeignKey('research_studies.id'), nullable=False),
            sa.Column('evidence_type', sa.String(50), nullable=False),
            sa.Column('description', sa.String(1000), nullable=True),
            sa.Column('metric_name', sa.String(100), nullable=True),
            sa.Column('value', sa.Float, nullable=True),
        )


def downgrade() -> None:
    op.drop_table('validity_evidence')
    op.drop_table('reliability_results')
    op.drop_table('research_studies')
    op.drop_index('ix_team_rollup_team_date', table_name='team_assessment_rollup')
    op.drop_table('team_assessment_rollup')
    op.drop_table('team_members')
    op.drop_table('teams')
