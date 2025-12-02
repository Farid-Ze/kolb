"""fix_access_grants_column_name

Revision ID: a1b2c3d4e5f6
Revises: 99ddd415795d
Create Date: 2025-12-01 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '99ddd415795d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [c['name'] for c in inspector.get_columns('access_grants')]
    
    if 'credits_used' in columns and 'credits_consumed' not in columns:
        with op.batch_alter_table('access_grants', schema=None) as batch_op:
            batch_op.alter_column('credits_used', new_column_name='credits_consumed')
    elif 'credits_consumed' in columns:
        pass # Already correct



def downgrade() -> None:
    op.alter_column('access_grants', 'credits_consumed', new_column_name='credits_used')
