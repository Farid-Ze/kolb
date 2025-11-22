"""add_store_order_table

Revision ID: 0024_store_orders_and_fund
Revises: 37aa3d6772e2
Create Date: 2025-11-22 15:45:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = "0024_store_orders_and_fund"
down_revision = "37aa3d6772e2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "store_orders" not in existing_tables:
        op.create_table(
            "store_orders",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("product_id", sa.Integer(), sa.ForeignKey("store_products.id"), nullable=False),
            sa.Column("points_spent", sa.Integer(), nullable=False),
            sa.Column("contribution_points", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        )

    existing_indexes = {idx["name"] for idx in inspector.get_indexes("store_orders")} if "store_orders" in existing_tables else set()
    if "ix_store_orders_user_id" not in existing_indexes:
        op.create_index("ix_store_orders_user_id", "store_orders", ["user_id"])
    if "ix_store_orders_product_id" not in existing_indexes:
        op.create_index("ix_store_orders_product_id", "store_orders", ["product_id"])


def downgrade() -> None:
    op.drop_index("ix_store_orders_product_id", table_name="store_orders")
    op.drop_index("ix_store_orders_user_id", table_name="store_orders")
    op.drop_table("store_orders")
