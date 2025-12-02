"""add_is_finalized_to_sessions

Revision ID: a31c8eaffb97
Revises: a1b2c3d4e5f6
Create Date: 2025-12-02 21:03:56.263761

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a31c8eaffb97'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col['name'] for col in inspector.get_columns('assessment_sessions')]
    if 'is_finalized' not in columns:
        op.add_column('assessment_sessions', sa.Column('is_finalized', sa.Boolean(), nullable=False, server_default=sa.text('0')))


def downgrade() -> None:
    with op.batch_alter_table('assessment_sessions') as batch_op:
        batch_op.drop_column('is_finalized')
