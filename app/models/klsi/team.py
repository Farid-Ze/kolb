from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

__all__ = [
    "Team",
    "TeamMember",
    "TeamAssessmentRollup",
]


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    kelas: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    members: Mapped[list["TeamMember"]] = relationship(back_populates="team")
    rollups: Mapped[list["TeamAssessmentRollup"]] = relationship(back_populates="team")


class TeamMember(Base):
    __tablename__ = "team_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    role_in_team: Mapped[Optional[str]] = mapped_column(String(50))
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    team: Mapped[Team] = relationship(back_populates="members")
    user: Mapped["User"] = relationship()

    __table_args__ = (
        UniqueConstraint("team_id", "user_id", name="uq_team_user_unique"),
    )


class TeamAssessmentRollup(Base):
    __tablename__ = "team_assessment_rollup"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"))
    date: Mapped[Date] = mapped_column(Date)
    total_sessions: Mapped[int] = mapped_column(Integer)
    avg_lfi: Mapped[Optional[float]] = mapped_column(Float)
    style_counts: Mapped[Optional[dict]] = mapped_column(JSON)

    team: Mapped[Team] = relationship(back_populates="rollups")

    __table_args__ = (
        UniqueConstraint("team_id", "date", name="uq_team_date_unique"),
    )


if TYPE_CHECKING:  # pragma: no cover
    from app.models.klsi.user import User
