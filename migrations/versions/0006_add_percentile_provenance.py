"""add per-scale provenance columns to percentile_scores

Revision ID: 0006_add_percentile_provenance
Revises: 0005_add_lfi_provenance
Create Date: 2025-11-10
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '0006_add_percentile_provenance'
down_revision = '0005_add_lfi_provenance'
branch_labels = None
depends_on = None

def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_columns = {col['name'] for col in inspector.get_columns('percentile_scores')}

    columns_to_add = []
    if 'CE_source' not in existing_columns:
        columns_to_add.append(sa.Column('CE_source', sa.String(length=60), nullable=False, server_default='AppendixFallback'))
    if 'RO_source' not in existing_columns:
        columns_to_add.append(sa.Column('RO_source', sa.String(length=60), nullable=False, server_default='AppendixFallback'))
    if 'AC_source' not in existing_columns:
        columns_to_add.append(sa.Column('AC_source', sa.String(length=60), nullable=False, server_default='AppendixFallback'))
    if 'AE_source' not in existing_columns:
        columns_to_add.append(sa.Column('AE_source', sa.String(length=60), nullable=False, server_default='AppendixFallback'))
    if 'ACCE_source' not in existing_columns:
        columns_to_add.append(sa.Column('ACCE_source', sa.String(length=60), nullable=False, server_default='AppendixFallback'))
    if 'AERO_source' not in existing_columns:
        columns_to_add.append(sa.Column('AERO_source', sa.String(length=60), nullable=False, server_default='AppendixFallback'))
    if 'used_fallback_any' not in existing_columns:
        columns_to_add.append(sa.Column('used_fallback_any', sa.Integer(), nullable=False, server_default='1'))

    if columns_to_add:
        with op.batch_alter_table('percentile_scores') as batch_op:
            for column in columns_to_add:
                batch_op.add_column(column)

        # Drop server defaults after backfilling existing rows
        with op.batch_alter_table('percentile_scores') as batch_op:
            for column in columns_to_add:
                batch_op.alter_column(column.name, server_default=None)

def downgrade() -> None:
    with op.batch_alter_table('percentile_scores') as batch_op:
        batch_op.drop_column('AERO_source')
        batch_op.drop_column('ACCE_source')
        batch_op.drop_column('AE_source')
        batch_op.drop_column('AC_source')
        batch_op.drop_column('RO_source')
        batch_op.drop_column('CE_source')
        batch_op.drop_column('used_fallback_any')
