from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.models.klsi.enums import ChallengeStatus

__all__ = ["GrowthChallenge", "UserChallenge"]


class GrowthChallenge(Base):
    __tablename__ = "growth_challenges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    target_style_deficiency: Mapped[str] = mapped_column(String(100))  # e.g. "AE_low"
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    societal_impact: Mapped[str] = mapped_column(Text)

    user_challenges: Mapped[list["UserChallenge"]] = relationship(back_populates="challenge")


class UserChallenge(Base):
    __tablename__ = "user_challenges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    challenge_id: Mapped[int] = mapped_column(ForeignKey("growth_challenges.id"))
    status: Mapped[ChallengeStatus] = mapped_column(Enum(ChallengeStatus), default=ChallengeStatus.active)
    proof_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="challenges")
    challenge: Mapped["GrowthChallenge"] = relationship(back_populates="user_challenges")


if TYPE_CHECKING:  # pragma: no cover
    from app.models.klsi.user import User
