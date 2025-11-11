from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.models.klsi.enums import SessionStatus

__all__ = [
    "AssessmentSession",
    "AssessmentSessionDelta",
]


class AssessmentSession(Base):
    __tablename__ = "assessment_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    start_time: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime)
    status: Mapped[SessionStatus] = mapped_column(Enum(SessionStatus), default=SessionStatus.started)
    assessment_id: Mapped[str] = mapped_column(String(40), default="KLSI")
    assessment_version: Mapped[str] = mapped_column(String(10), default="4.0")
    instrument_id: Mapped[Optional[int]] = mapped_column(ForeignKey("instruments.id"), nullable=True)
    strategy_code: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    pipeline_version: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    session_type: Mapped[str] = mapped_column(String(20), default="Initial")
    days_since_last_session: Mapped[Optional[int]] = mapped_column(Integer)

    user: Mapped["User"] = relationship(back_populates="sessions")
    instrument: Mapped[Optional["Instrument"]] = relationship(back_populates="sessions")
    responses: Mapped[list["UserResponse"]] = relationship(back_populates="session")
    scale_score: Mapped[Optional["ScaleScore"]] = relationship(back_populates="session", uselist=False)
    combination_score: Mapped[Optional["CombinationScore"]] = relationship(back_populates="session", uselist=False)
    learning_style: Mapped[Optional["UserLearningStyle"]] = relationship(back_populates="session", uselist=False)
    lfi_index: Mapped[Optional["LearningFlexibilityIndex"]] = relationship(back_populates="session", uselist=False)
    percentile_score: Mapped[Optional["PercentileScore"]] = relationship(back_populates="session", uselist=False)
    backup_styles: Mapped[list["BackupLearningStyle"]] = relationship(back_populates="session")
    lfi_context_scores: Mapped[list["LFIContextScore"]] = relationship(back_populates="session")
    delta: Mapped[Optional["AssessmentSessionDelta"]] = relationship(back_populates="session", uselist=False)
    scale_provenances: Mapped[list["ScaleProvenance"]] = relationship(back_populates="session")


class AssessmentSessionDelta(Base):
    __tablename__ = "assessment_session_deltas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assessment_sessions.id"), unique=True)
    previous_session_id: Mapped[Optional[int]] = mapped_column(Integer)
    delta_acce: Mapped[Optional[int]] = mapped_column(Integer)
    delta_aero: Mapped[Optional[int]] = mapped_column(Integer)
    delta_lfi: Mapped[Optional[float]] = mapped_column(Float)
    delta_intensity: Mapped[Optional[int]] = mapped_column(Integer)
    computed_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    session: Mapped[AssessmentSession] = relationship(back_populates="delta")


if TYPE_CHECKING:  # pragma: no cover
    from app.models.klsi.instrument import Instrument
    from app.models.klsi.learning import (
        BackupLearningStyle,
        CombinationScore,
        LFIContextScore,
        LearningFlexibilityIndex,
        ScaleProvenance,
        ScaleScore,
        UserLearningStyle,
    )
    from app.models.klsi.norms import PercentileScore
    from app.models.klsi.user import User
    from app.models.klsi.items import UserResponse