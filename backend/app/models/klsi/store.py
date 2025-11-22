from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional, Any

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

__all__ = ["StoreProduct", "StoreOrder", "StoreOrderItem"]


class StoreProduct(Base):
    __tablename__ = "store_products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    base_price: Mapped[int] = mapped_column(Integer)
    required_badge_id: Mapped[Optional[int]] = mapped_column(ForeignKey("gamification_badges.id"), nullable=True)
    meta: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON().with_variant(JSONB, "postgresql"), nullable=True)

    required_badge: Mapped[Optional["GamificationBadge"]] = relationship(back_populates="store_products")
    order_items: Mapped[list["StoreOrderItem"]] = relationship(back_populates="product")


class StoreOrder(Base):
    __tablename__ = "store_orders"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    total_amount: Mapped[int] = mapped_column(Integer)
    payment_status: Mapped[str] = mapped_column(String(20), default="pending")
    snap_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship(back_populates="orders")
    items: Mapped[list["StoreOrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")


class StoreOrderItem(Base):
    __tablename__ = "store_order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[str] = mapped_column(ForeignKey("store_orders.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("store_products.id"))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    price_at_purchase: Mapped[int] = mapped_column(Integer)

    order: Mapped["StoreOrder"] = relationship(back_populates="items")
    product: Mapped["StoreProduct"] = relationship(back_populates="order_items")


if TYPE_CHECKING:  # pragma: no cover
    from app.models.klsi.gamification import GamificationBadge
    from app.models.klsi.user import User
