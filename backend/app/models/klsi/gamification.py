from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.models.klsi.enums import BadgeRarity

__all__ = ["GamificationBadge", "UserAchievement"]


class GamificationBadge(Base):
    __tablename__ = "gamification_badges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    rarity: Mapped[BadgeRarity] = mapped_column(Enum(BadgeRarity), default=BadgeRarity.common)

    achievements: Mapped[list["UserAchievement"]] = relationship(back_populates="badge")


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    badge_id: Mapped[int] = mapped_column(ForeignKey("gamification_badges.id"))
    awarded_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship(back_populates="achievements")
    badge: Mapped["GamificationBadge"] = relationship(back_populates="achievements")

    __table_args__ = (
        UniqueConstraint("user_id", "badge_id", name="uq_user_achievements_user_badge"),
    )


if TYPE_CHECKING:  # pragma: no cover
    from app.models.klsi.user import User
