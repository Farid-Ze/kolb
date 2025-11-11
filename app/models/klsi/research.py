from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base

__all__ = [
    "ResearchStudy",
    "ReliabilityResult",
    "ValidityEvidence",
]


class ResearchStudy(Base):
    __tablename__ = "research_studies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(String(1000))
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    notes: Mapped[Optional[str]] = mapped_column(String(1000))


class ReliabilityResult(Base):
    __tablename__ = "reliability_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    study_id: Mapped[int] = mapped_column(ForeignKey("research_studies.id"))
    metric_name: Mapped[str] = mapped_column(String(100))
    value: Mapped[float] = mapped_column(Float)
    notes: Mapped[Optional[str]] = mapped_column(String(500))


class ValidityEvidence(Base):
    __tablename__ = "validity_evidence"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    study_id: Mapped[int] = mapped_column(ForeignKey("research_studies.id"))
    evidence_type: Mapped[str] = mapped_column(String(50))
    description: Mapped[Optional[str]] = mapped_column(String(1000))
    metric_name: Mapped[Optional[str]] = mapped_column(String(100))
    value: Mapped[Optional[float]] = mapped_column(Float)
