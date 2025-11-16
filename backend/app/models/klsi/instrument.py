from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

__all__ = [
    "Instrument",
    "ScoringPipeline",
    "ScoringPipelineNode",
    "InstrumentScale",
]


class Instrument(Base):
    __tablename__ = "instruments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    version: Mapped[str] = mapped_column(String(20))
    default_strategy_code: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    sessions: Mapped[list["AssessmentSession"]] = relationship(back_populates="instrument")
    scales: Mapped[list["InstrumentScale"]] = relationship(back_populates="instrument")
    pipelines: Mapped[list["ScoringPipeline"]] = relationship(back_populates="instrument")


class ScoringPipeline(Base):
    __tablename__ = "scoring_pipelines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    instrument_id: Mapped[int] = mapped_column(ForeignKey("instruments.id"))
    pipeline_code: Mapped[str] = mapped_column(String(60))
    version: Mapped[str] = mapped_column(String(20), default="v1")
    description: Mapped[Optional[str]] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    metadata_payload: Mapped[Optional[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    instrument: Mapped[Instrument] = relationship(back_populates="pipelines")
    nodes: Mapped[list["ScoringPipelineNode"]] = relationship(
        back_populates="pipeline",
        cascade="all, delete-orphan",
        order_by="ScoringPipelineNode.execution_order",
    )

    __table_args__ = (
        UniqueConstraint("instrument_id", "pipeline_code", "version", name="uq_pipeline_per_instrument_version"),
    )


class ScoringPipelineNode(Base):
    __tablename__ = "scoring_pipeline_nodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pipeline_id: Mapped[int] = mapped_column(ForeignKey("scoring_pipelines.id"))
    node_key: Mapped[str] = mapped_column(String(50))
    node_type: Mapped[str] = mapped_column(String(40))
    execution_order: Mapped[int] = mapped_column(Integer)
    config: Mapped[Optional[dict]] = mapped_column(JSON)
    next_node_key: Mapped[Optional[str]] = mapped_column(String(50))
    is_terminal: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    pipeline: Mapped[ScoringPipeline] = relationship(back_populates="nodes")

    __table_args__ = (
        UniqueConstraint("pipeline_id", "node_key", name="uq_pipeline_node_key"),
        UniqueConstraint("pipeline_id", "execution_order", name="uq_pipeline_order"),
    )


class InstrumentScale(Base):
    __tablename__ = "instrument_scales"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    instrument_id: Mapped[int] = mapped_column(ForeignKey("instruments.id"))
    scale_code: Mapped[str] = mapped_column(String(20))
    display_name: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(String(500))
    rendering_order: Mapped[Optional[int]] = mapped_column(Integer)

    instrument: Mapped[Instrument] = relationship(back_populates="scales")

    __table_args__ = (
        UniqueConstraint("instrument_id", "scale_code", name="uq_instrument_scale_code"),
    )


if TYPE_CHECKING:  # pragma: no cover - typing only
    from app.models.klsi.assessment import AssessmentSession
