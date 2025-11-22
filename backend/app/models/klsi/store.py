from __future__ import annotations

from typing import TYPE_CHECKING, Optional, Any

from sqlalchemy import ForeignKey, Integer, String, Text, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

__all__ = ["StoreProduct"]


class StoreProduct(Base):
    __tablename__ = "store_products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    price_points: Mapped[int] = mapped_column(Integer)
    required_badge_id: Mapped[Optional[int]] = mapped_column(ForeignKey("gamification_badges.id"), nullable=True)
    meta: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON().with_variant(JSONB, "postgresql"), nullable=True)

    required_badge: Mapped[Optional["GamificationBadge"]] = relationship(back_populates="store_products")


if TYPE_CHECKING:  # pragma: no cover
    from app.models.klsi.gamification import GamificationBadge
