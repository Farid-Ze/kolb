from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Float, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

__all__ = [
    "PercentileScore",
    "NormativeConversionTable",
    "NormativeStatistics",
]


class PercentileScore(Base):
    __tablename__ = "percentile_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assessment_sessions.id"), unique=True)
    norm_group_used: Mapped[str] = mapped_column(String(50))
    CE_percentile: Mapped[float] = mapped_column(Float)
    RO_percentile: Mapped[float] = mapped_column(Float)
    AC_percentile: Mapped[float] = mapped_column(Float)
    AE_percentile: Mapped[float] = mapped_column(Float)
    ACCE_percentile: Mapped[float] = mapped_column(Float)
    AERO_percentile: Mapped[float] = mapped_column(Float)
    CE_source: Mapped[str] = mapped_column(String(60), default="AppendixFallback")
    RO_source: Mapped[str] = mapped_column(String(60), default="AppendixFallback")
    AC_source: Mapped[str] = mapped_column(String(60), default="AppendixFallback")
    AE_source: Mapped[str] = mapped_column(String(60), default="AppendixFallback")
    ACCE_source: Mapped[str] = mapped_column(String(60), default="AppendixFallback")
    AERO_source: Mapped[str] = mapped_column(String(60), default="AppendixFallback")
    used_fallback_any: Mapped[bool] = mapped_column(Boolean, default=True)
    norm_provenance: Mapped[dict | None] = mapped_column(JSON)
    raw_outside_norm_range: Mapped[bool] = mapped_column(Boolean, default=False)
    truncated_scales: Mapped[dict | None] = mapped_column(JSON)

    session: Mapped["AssessmentSession"] = relationship(back_populates="percentile_score")


class NormativeConversionTable(Base):
    __tablename__ = "normative_conversion_table"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    norm_group: Mapped[str] = mapped_column(String(150))
    norm_version: Mapped[str] = mapped_column(String(40), default="default", nullable=False)
    scale_name: Mapped[str] = mapped_column(String(5))
    raw_score: Mapped[int] = mapped_column(Integer)
    percentile: Mapped[float] = mapped_column(Float)

    __table_args__ = (
        UniqueConstraint(
            "norm_group",
            "norm_version",
            "scale_name",
            "raw_score",
            name="uq_norm_group_version_scale_raw",
        ),
    )


class NormativeStatistics(Base):
    __tablename__ = "normative_statistics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    norm_group: Mapped[str] = mapped_column(String(150))
    sample_size: Mapped[int] = mapped_column(Integer)
    CE_mean: Mapped[float] = mapped_column(Float)
    CE_stdev: Mapped[float] = mapped_column(Float)
    RO_mean: Mapped[float] = mapped_column(Float)
    RO_stdev: Mapped[float] = mapped_column(Float)
    AC_mean: Mapped[float] = mapped_column(Float)
    AC_stdev: Mapped[float] = mapped_column(Float)
    AE_mean: Mapped[float] = mapped_column(Float)
    AE_stdev: Mapped[float] = mapped_column(Float)
    ACCE_mean: Mapped[float] = mapped_column(Float)
    ACCE_stdev: Mapped[float] = mapped_column(Float)
    AERO_mean: Mapped[float] = mapped_column(Float)
    AERO_stdev: Mapped[float] = mapped_column(Float)


if TYPE_CHECKING:  # pragma: no cover
    from app.models.klsi.assessment import AssessmentSession
