import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional, Any

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, JSON, UUID
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship, foreign, remote

from app.db.database import Base
from app.models.klsi.enums import SessionStatus

__all__ = [
    "AssessmentSession",
    "AssessmentSessionDelta",
]


def UUID_FACTORY():
    return uuid.uuid4()


class AssessmentSession(Base):
    __tablename__ = "assessment_sessions"
    __allow_unmapped__ = True

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=UUID_FACTORY)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    user: Mapped[Optional["User"]] = relationship(back_populates="sessions")
    guest_token: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime)
    status: Mapped[SessionStatus] = mapped_column(Enum(SessionStatus), default=SessionStatus.started)
    assessment_id: Mapped[str] = mapped_column(String(40), default="KLSI")
    assessment_version: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    instrument_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    pipeline_version: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    results_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    scale_score: Mapped[Optional["ScaleScore"]] = relationship(back_populates="session", uselist=False)
    combination_score: Mapped[Optional["CombinationScore"]] = relationship(back_populates="session", uselist=False)
    learning_style: Mapped[Optional["UserLearningStyle"]] = relationship(back_populates="session", uselist=False)
    lfi_index: Mapped[Optional["LearningFlexibilityIndex"]] = relationship(back_populates="session", uselist=False)
    percentile_score: Mapped[Optional["PercentileScore"]] = relationship(back_populates="session", uselist=False)
    backup_styles: Mapped[list["BackupLearningStyle"]] = relationship(back_populates="session")
    lfi_context_scores: Mapped[list["LFIContextScore"]] = relationship(back_populates="session")
    delta: Mapped[Optional["AssessmentSessionDelta"]] = relationship(back_populates="session", uselist=False)
    scale_provenances: Mapped[list["ScaleProvenance"]] = relationship(back_populates="session")
    responses: Mapped[list["UserResponse"]] = relationship(back_populates="session")
    item_responses: Mapped[list["AssessmentItemResponse"]] = relationship(back_populates="session")
    
    instrument: Mapped[Optional["Instrument"]] = relationship(
        "app.models.klsi.instrument.Instrument",
        primaryjoin=lambda: foreign(AssessmentSession.assessment_id) == remote(__import__("app.models.klsi.instrument", fromlist=["Instrument"]).Instrument.code),
        back_populates="sessions",
        viewonly=True,  # Avoid accidental writes via this relationship for now
    )

    # Transient / Non-mapped attributes
    strategy_code: str | None = None
    days_since_last_session: int | None = None

    @property
    def is_finalized(self) -> bool:
        return self.status == SessionStatus.completed


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