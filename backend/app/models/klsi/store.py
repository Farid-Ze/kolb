from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional, Any

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

__all__ = ["StoreProduct", "StoreOrder"]


class StoreProduct(Base):
    __tablename__ = "store_products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    price_points: Mapped[int] = mapped_column(Integer)
    required_badge_id: Mapped[Optional[int]] = mapped_column(ForeignKey("gamification_badges.id"), nullable=True)
    meta: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON().with_variant(JSONB, "postgresql"), nullable=True)

    required_badge: Mapped[Optional["GamificationBadge"]] = relationship(back_populates="store_products")
    orders: Mapped[list["StoreOrder"]] = relationship(back_populates="product")


class StoreOrder(Base):
    __tablename__ = "store_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("store_products.id"))
    points_spent: Mapped[int] = mapped_column(Integer)
    contribution_points: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship(back_populates="orders")
    product: Mapped["StoreProduct"] = relationship(back_populates="orders")


if TYPE_CHECKING:  # pragma: no cover
    from app.models.klsi.gamification import GamificationBadge
    from app.models.klsi.user import User
