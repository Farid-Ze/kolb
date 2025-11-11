from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

__all__ = [
    "ScaleScore",
    "CombinationScore",
    "LearningStyleType",
    "UserLearningStyle",
    "LFIContextScore",
    "LearningFlexibilityIndex",
    "BackupLearningStyle",
    "ScaleProvenance",
]


class ScaleScore(Base):
    """Summed raw learning mode scores for a single assessment session."""

    __tablename__ = "scale_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assessment_sessions.id"), unique=True)
    CE_raw: Mapped[int] = mapped_column(Integer)
    RO_raw: Mapped[int] = mapped_column(Integer)
    AC_raw: Mapped[int] = mapped_column(Integer)
    AE_raw: Mapped[int] = mapped_column(Integer)

    session: Mapped["AssessmentSession"] = relationship(back_populates="scale_score")


class CombinationScore(Base):
    """Derived dialectic and balance metrics computed from raw mode totals."""

    __tablename__ = "combination_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assessment_sessions.id"), unique=True)
    ACCE_raw: Mapped[int] = mapped_column(Integer)
    AERO_raw: Mapped[int] = mapped_column(Integer)
    assimilation_accommodation: Mapped[int] = mapped_column(Integer)
    converging_diverging: Mapped[int] = mapped_column(Integer)
    balance_acce: Mapped[int] = mapped_column(Integer)
    balance_aero: Mapped[int] = mapped_column(Integer)

    session: Mapped["AssessmentSession"] = relationship(back_populates="combination_score")


class LearningStyleType(Base):
    """Lookup table describing the 9 Kolb learning styles and their cutpoints."""

    __tablename__ = "learning_style_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    style_name: Mapped[str] = mapped_column(String(50), unique=True)
    style_code: Mapped[str] = mapped_column(String(20), unique=True)
    ACCE_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ACCE_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    AERO_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    AERO_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    quadrant: Mapped[str | None] = mapped_column(String(10))
    description: Mapped[str | None] = mapped_column(String(500))


class UserLearningStyle(Base):
    """Primary style assignment and kite coordinates per completed session."""

    __tablename__ = "user_learning_styles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assessment_sessions.id"), unique=True)
    primary_style_type_id: Mapped[int] = mapped_column(ForeignKey("learning_style_types.id"))
    ACCE_raw: Mapped[int] = mapped_column(Integer)
    AERO_raw: Mapped[int] = mapped_column(Integer)
    kite_coordinates: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    style_intensity_score: Mapped[int | None] = mapped_column(Integer)

    session: Mapped["AssessmentSession"] = relationship(back_populates="learning_style")
    style_type: Mapped[LearningStyleType] = relationship()


class LFIContextScore(Base):
    """Ipsative ranks for the eight Learning Flexibility Index contexts."""

    __tablename__ = "lfi_context_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assessment_sessions.id"))
    context_name: Mapped[str] = mapped_column(String(50))
    CE_rank: Mapped[int] = mapped_column(Integer)
    RO_rank: Mapped[int] = mapped_column(Integer)
    AC_rank: Mapped[int] = mapped_column(Integer)
    AE_rank: Mapped[int] = mapped_column(Integer)

    __table_args__ = (
        UniqueConstraint("session_id", "context_name", name="uq_lfi_context_per_session"),
        CheckConstraint("context_name <> ''", name="ck_context_name_not_blank"),
        CheckConstraint(
            "context_name IN ("
            "'Starting_Something_New',"
            "'Influencing_Someone',"
            "'Getting_To_Know_Someone',"
            "'Learning_In_A_Group',"
            "'Planning_Something',"
            "'Analyzing_Something',"
            "'Evaluating_An_Opportunity',"
            "'Choosing_Between_Alternatives')",
            name="ck_context_name_allowed",
        ),
        Index("ix_lfi_context_scores_session", "session_id"),
    )

    session: Mapped["AssessmentSession"] = relationship(back_populates="lfi_context_scores")


class LearningFlexibilityIndex(Base):
    """Kendall's W derived Learning Flexibility Index per session."""

    __tablename__ = "learning_flexibility_index"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assessment_sessions.id"), unique=True)
    W_coefficient: Mapped[float] = mapped_column(Float)
    LFI_score: Mapped[float] = mapped_column(Float)
    LFI_percentile: Mapped[float | None] = mapped_column(Float)
    flexibility_level: Mapped[str | None] = mapped_column(String(20))
    norm_group_used: Mapped[str | None] = mapped_column(String(50))

    session: Mapped["AssessmentSession"] = relationship(back_populates="lfi_index")


class BackupLearningStyle(Base):
    """Backup style frequencies reflecting contextual flexing patterns."""

    __tablename__ = "backup_learning_styles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assessment_sessions.id"))
    style_type_id: Mapped[int] = mapped_column(ForeignKey("learning_style_types.id"))
    frequency_count: Mapped[int] = mapped_column(Integer)
    contexts_used: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    percentage: Mapped[int | None] = mapped_column(Integer)

    session: Mapped["AssessmentSession"] = relationship(back_populates="backup_styles")
    style_type: Mapped[LearningStyleType] = relationship()


class ScaleProvenance(Base):
    """Audit trail storing provenance for percentile conversions per scale."""

    __tablename__ = "scale_provenance"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assessment_sessions.id"))
    scale_code: Mapped[str] = mapped_column(String(10))
    raw_score: Mapped[float] = mapped_column(Float)
    percentile_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    provenance_tag: Mapped[str] = mapped_column(String(80))
    source_kind: Mapped[str] = mapped_column(String(20))
    norm_group: Mapped[str | None] = mapped_column(String(150), nullable=True)
    truncated: Mapped[bool] = mapped_column(Boolean, default=False)

    session: Mapped["AssessmentSession"] = relationship(back_populates="scale_provenances")

    __table_args__ = (
        UniqueConstraint("session_id", "scale_code", name="uq_scale_provenance_session_scale"),
    )


if TYPE_CHECKING:  # pragma: no cover
    from app.models.klsi.assessment import AssessmentSession
