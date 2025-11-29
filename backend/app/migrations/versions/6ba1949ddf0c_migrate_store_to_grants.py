"""migrate_store_to_grants

Revision ID: 6ba1949ddf0c
Revises: d9b2c3747197
Create Date: 2025-11-29 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '6ba1949ddf0c'
down_revision = 'd9b2c3747197'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 0. Drop old table if exists (from previous init migration)
    op.execute("DROP TABLE IF EXISTS access_grants CASCADE")

    # 1. Create access_grants table
    op.create_table('access_grants',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('grantor_id', sa.Integer(), nullable=True),
        sa.Column('grantee_id', sa.Integer(), nullable=True),
        sa.Column('instrument_id', sa.Integer(), nullable=False),
        sa.Column('credits_total', sa.Integer(), nullable=False),
        sa.Column('credits_used', sa.Integer(), nullable=False),
        sa.Column('source_order_id', sa.String(length=100), nullable=True),
        sa.Column('expiry_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['grantee_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['grantor_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['instrument_id'], ['instruments.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. Migrate Data from Store Orders
    # Assumption: All current store products map to Instrument ID 1 (KLSI)
    # Only migrate 'paid' or 'completed' orders.
    op.execute("""
        INSERT INTO access_grants (
            id, 
            grantee_id, 
            instrument_id, 
            credits_total, 
            credits_used, 
            source_order_id, 
            created_at, 
            updated_at
        )
        SELECT 
            gen_random_uuid(),
            so.user_id,
            1, -- Default to KLSI
            soi.quantity,
            0, -- Initial used count
            so.id,
            so.created_at,
            NOW()
        FROM store_orders so
        JOIN store_order_items soi ON so.id = soi.order_id
        WHERE so.payment_status IN ('paid', 'completed', 'settlement')
    """)


def downgrade() -> None:
    op.drop_table('access_grants')
