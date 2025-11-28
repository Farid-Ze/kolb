import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional, Any

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, JSON, UUID
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.models.klsi.enums import SessionStatus

__all__ = [
    "AssessmentSession",
    "AssessmentSessionDelta",
]


def UUID_FACTORY():
    try:
        return uuid.uuid7()
    except AttributeError:
        return uuid.uuid4()


class AssessmentSession(Base):
    __tablename__ = "assessment_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=UUID_FACTORY)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    guest_token: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime)
    status: Mapped[SessionStatus] = mapped_column(Enum(SessionStatus), default=SessionStatus.started)
    assessment_id: Mapped[str] = mapped_column(String(40), default="KLSI")
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
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("assessment_sessions.id"), unique=True)
    previous_session_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
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
    from app.models.klsi.items import UserResponse, AssessmentItemResponse