"""add per-scale provenance columns to percentile_scores

Revision ID: 0006_add_percentile_provenance
Revises: 0005_add_lfi_provenance
Create Date: 2025-11-10
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0006_add_percentile_provenance'
down_revision = '0005_add_lfi_provenance'
branch_labels = None
depends_on = None

def upgrade() -> None:
    with op.batch_alter_table('percentile_scores') as batch_op:
        batch_op.add_column(sa.Column('CE_source', sa.String(length=60), nullable=False, server_default='AppendixFallback'))
        batch_op.add_column(sa.Column('RO_source', sa.String(length=60), nullable=False, server_default='AppendixFallback'))
        batch_op.add_column(sa.Column('AC_source', sa.String(length=60), nullable=False, server_default='AppendixFallback'))
        batch_op.add_column(sa.Column('AE_source', sa.String(length=60), nullable=False, server_default='AppendixFallback'))
        batch_op.add_column(sa.Column('ACCE_source', sa.String(length=60), nullable=False, server_default='AppendixFallback'))
        batch_op.add_column(sa.Column('AERO_source', sa.String(length=60), nullable=False, server_default='AppendixFallback'))
        batch_op.add_column(sa.Column('used_fallback_any', sa.Integer(), nullable=False, server_default='1'))

    # Drop server defaults after backfilling existing rows
    with op.batch_alter_table('percentile_scores') as batch_op:
        batch_op.alter_column('CE_source', server_default=None)
        batch_op.alter_column('RO_source', server_default=None)
        batch_op.alter_column('AC_source', server_default=None)
        batch_op.alter_column('AE_source', server_default=None)
        batch_op.alter_column('ACCE_source', server_default=None)
        batch_op.alter_column('AERO_source', server_default=None)
        batch_op.alter_column('used_fallback_any', server_default=None)

def downgrade() -> None:
    with op.batch_alter_table('percentile_scores') as batch_op:
        batch_op.drop_column('AERO_source')
        batch_op.drop_column('ACCE_source')
        batch_op.drop_column('AE_source')
        batch_op.drop_column('AC_source')
        batch_op.drop_column('RO_source')
        batch_op.drop_column('CE_source')
        batch_op.drop_column('used_fallback_any')
