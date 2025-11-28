from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship, foreign, remote

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

    sessions: Mapped[list["AssessmentSession"]] = relationship(
        "app.models.klsi.assessment.AssessmentSession",
        back_populates="instrument",
        primaryjoin=lambda: foreign(__import__("app.models.klsi.assessment", fromlist=["AssessmentSession"]).AssessmentSession.assessment_id) == Instrument.code,
        viewonly=True,
    )
    scales: Mapped[list["InstrumentScale"]] = relationship(back_populates="instrument")
    pipelines: Mapped[list["ScoringPipeline"]] = relationship(back_populates="instrument")


class InstrumentScale(Base):
    __tablename__ = "instrument_scales"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    instrument_id: Mapped[int] = mapped_column(ForeignKey("instruments.id"))
    scale_code: Mapped[str] = mapped_column(String(20))
    display_name: Mapped[str] = mapped_column(String(100))
    rendering_order: Mapped[int] = mapped_column(Integer)

    instrument: Mapped["Instrument"] = relationship(back_populates="scales")

    __table_args__ = (UniqueConstraint("instrument_id", "scale_code", name="uq_instrument_scale"),)


class ScoringPipeline(Base):
    __tablename__ = "scoring_pipelines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    instrument_id: Mapped[int] = mapped_column(ForeignKey("instruments.id"))
    pipeline_code: Mapped[str] = mapped_column(String(40))
    version: Mapped[str] = mapped_column(String(20))
    description: Mapped[Optional[str]] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    metadata_payload: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    instrument: Mapped["Instrument"] = relationship(back_populates="pipelines")
    nodes: Mapped[list["ScoringPipelineNode"]] = relationship(
        back_populates="pipeline", order_by="ScoringPipelineNode.execution_order"
    )

    __table_args__ = (UniqueConstraint("instrument_id", "pipeline_code", "version", name="uq_scoring_pipeline"),)


class ScoringPipelineNode(Base):
    __tablename__ = "scoring_pipeline_nodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pipeline_id: Mapped[int] = mapped_column(ForeignKey("scoring_pipelines.id"))
    node_key: Mapped[str] = mapped_column(String(40))
    node_type: Mapped[str] = mapped_column(String(20))  # 'service_call', 'calculation', 'decision'
    execution_order: Mapped[int] = mapped_column(Integer)
    config: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    next_node_key: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    is_terminal: Mapped[bool] = mapped_column(Boolean, default=False)

    pipeline: Mapped["ScoringPipeline"] = relationship(back_populates="nodes")

    __table_args__ = (UniqueConstraint("pipeline_id", "node_key", name="uq_scoring_pipeline_node"),)


if TYPE_CHECKING:  # pragma: no cover
    from app.models.klsi.assessment import AssessmentSession
