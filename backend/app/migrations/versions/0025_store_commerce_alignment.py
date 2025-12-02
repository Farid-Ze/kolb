"""align store models with commerce spec

Revision ID: 0025_store_commerce_alignment
Revises: 0024_store_orders_and_fund
Create Date: 2025-11-22
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = "0025_store_commerce_alignment"
down_revision = "0024_store_orders_and_fund"
branch_labels = None
depends_on = None


def _ensure_badge_columns(bind) -> None:
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("gamification_badges")}
    if "description" not in columns:
        op.add_column("gamification_badges", sa.Column("description", sa.Text(), nullable=True))
    if "icon_url" not in columns:
        op.add_column("gamification_badges", sa.Column("icon_url", sa.String(length=255), nullable=True))


def _upgrade_store_products(bind) -> None:
    inspector = sa.inspect(bind)
    if "store_products" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("store_products")}
    indexes = {idx["name"] for idx in inspector.get_indexes("store_products")}

    if "slug" not in columns:
        op.add_column(
            "store_products",
            sa.Column("slug", sa.String(length=100), nullable=True),
        )
        op.execute(text("UPDATE store_products SET slug = 'product-' || id WHERE slug IS NULL"))
        with op.batch_alter_table("store_products") as batch_op:
            batch_op.alter_column("slug", nullable=False, existing_type=sa.String(length=100))
        columns.add("slug")

    if "slug" in columns and "ix_store_products_slug" not in indexes:
        op.create_index(
            "ix_store_products_slug",
            "store_products",
            ["slug"],
            unique=True,
        )

    if "base_price" not in columns:
        op.add_column(
            "store_products",
            sa.Column("base_price", sa.Integer(), nullable=False, server_default="0"),
        )
        op.execute(text("UPDATE store_products SET base_price = COALESCE(price_points, 0)"))
        with op.batch_alter_table("store_products") as batch_op:
            batch_op.alter_column(
                "base_price",
                server_default=None,
                existing_type=sa.Integer(),
                nullable=False,
            )
        columns.add("base_price")

    if "price_points" in columns:
        op.execute(text("UPDATE store_products SET base_price = COALESCE(price_points, base_price, 0)"))
        with op.batch_alter_table("store_products", recreate="always") as batch_op:
            batch_op.drop_column("price_points")


def _recreate_store_orders(bind) -> None:
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("store_orders")} if "store_orders" in inspector.get_table_names() else set()
    needs_rebuild = bool(columns) and ("points_spent" in columns or "total_amount" not in columns)

    if not columns:
        needs_rebuild = True

    if not needs_rebuild:
        return

    # Force clean state for new table
    op.execute("DROP TABLE IF EXISTS store_orders_new")

    op.create_table(
        "store_orders_new",
        sa.Column("id", sa.String(length=50), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("total_amount", sa.Integer(), nullable=False),
        sa.Column("payment_status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("snap_token", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    # Index creation moved to after drop_table to avoid name collision

    if columns:
        copy_stmt = text(
            "INSERT INTO store_orders_new (id, user_id, total_amount, payment_status, snap_token, created_at) "
            "SELECT CAST(id AS TEXT), user_id, COALESCE(points_spent, 0), 'pending', NULL, created_at "
            "FROM store_orders"
        )
        bind.execute(copy_stmt)
        op.drop_table("store_orders")

    # Create index after old table (and its index) are gone
    op.create_index("ix_store_orders_user_id", "store_orders_new", ["user_id"])

    op.rename_table("store_orders_new", "store_orders")


def _ensure_order_items_table(bind) -> None:
    inspector = sa.inspect(bind)
    table_exists = "store_order_items" in inspector.get_table_names()
    if not table_exists:
        op.create_table(
            "store_order_items",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("order_id", sa.String(length=50), sa.ForeignKey("store_orders.id", ondelete="CASCADE"), nullable=False),
            sa.Column("product_id", sa.Integer(), sa.ForeignKey("store_products.id"), nullable=False),
            sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("price_at_purchase", sa.Integer(), nullable=False),
        )

    existing_indexes = {idx["name"] for idx in inspector.get_indexes("store_order_items")}
    if "ix_store_order_items_order" not in existing_indexes:
        op.create_index("ix_store_order_items_order", "store_order_items", ["order_id"])
    if "ix_store_order_items_product" not in existing_indexes:
        op.create_index("ix_store_order_items_product", "store_order_items", ["product_id"])


def upgrade() -> None:
    bind = op.get_bind()
    _ensure_badge_columns(bind)
    _upgrade_store_products(bind)
    _recreate_store_orders(bind)
    _ensure_order_items_table(bind)


def downgrade() -> None:
    # Downgrade not supported because dropping transactional commerce data would lose orders.
    raise RuntimeError("Downgrade is not supported for store commerce alignment")
