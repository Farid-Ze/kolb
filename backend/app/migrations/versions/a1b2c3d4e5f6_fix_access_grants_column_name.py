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
    op.alter_column('access_grants', 'credits_used', new_column_name='credits_consumed')


def downgrade() -> None:
    op.alter_column('access_grants', 'credits_consumed', new_column_name='credits_used')
