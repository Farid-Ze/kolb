"""add contribution points to store orders

Revision ID: 0027_store_order_contributions
Revises: 0026_trinity_constraints
Create Date: 2025-11-23
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0027_store_order_contributions"
down_revision = "0026_trinity_constraints"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [c["name"] for c in inspector.get_columns("store_orders")]

    if "contribution_points" not in columns:
        op.add_column(
            "store_orders",
            sa.Column("contribution_points", sa.Integer(), nullable=False, server_default="0"),
        )

    op.alter_column(
        "store_orders",
        "contribution_points",
        server_default=None,
        existing_type=sa.Integer(),
    )


def downgrade() -> None:
    op.drop_column("store_orders", "contribution_points")
