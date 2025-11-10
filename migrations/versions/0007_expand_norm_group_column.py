"""expand norm_group column size to accommodate long country names

Revision ID: 0007_expand_norm_group
Revises: 0006_add_percentile_provenance
Create Date: 2025-11-10
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0007_expand_norm_group'
down_revision = '0006_add_percentile_provenance'
branch_labels = None
depends_on = None

def upgrade() -> None:
    """Expand norm_group columns from String(100) to String(150).
    
    Rationale:
        Long country names like 'COUNTRY:United States of America' (38 chars)
        combined with future subgroup qualifiers could exceed 100 chars.
        Expanding to 150 provides safety margin.
    
    Affected tables:
        - normative_conversion_table.norm_group
        - normative_statistics.norm_group (if exists)
    """
    # Expand normative_conversion_table.norm_group
    with op.batch_alter_table('normative_conversion_table') as batch_op:
        batch_op.alter_column(
            'norm_group',
            existing_type=sa.String(length=100),
            type_=sa.String(length=150),
            existing_nullable=False
        )
    
    # Expand normative_statistics.norm_group if table exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'normative_statistics' in inspector.get_table_names():
        with op.batch_alter_table('normative_statistics') as batch_op:
            batch_op.alter_column(
                'norm_group',
                existing_type=sa.String(length=30),
                type_=sa.String(length=150),
                existing_nullable=False
            )

def downgrade() -> None:
    """Revert norm_group columns to original sizes.
    
    Warning:
        This will truncate values if longer than original limits.
        Only safe if no long country names have been added.
    """
    with op.batch_alter_table('normative_conversion_table') as batch_op:
        batch_op.alter_column(
            'norm_group',
            existing_type=sa.String(length=150),
            type_=sa.String(length=100),
            existing_nullable=False
        )
    
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'normative_statistics' in inspector.get_table_names():
        with op.batch_alter_table('normative_statistics') as batch_op:
            batch_op.alter_column(
                'norm_group',
                existing_type=sa.String(length=150),
                type_=sa.String(length=30),
                existing_nullable=False
            )
