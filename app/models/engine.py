"""Generic assessment engine authoring models.

These models are intentionally separate from the legacy KLSI-specific
schema defined in `app/models/klsi.py`. Over time, the KLSI tables can
be migrated (or mirrored) onto this generic layer. For now they serve
as an authoring abstraction (instrument → form → page → item → option)
plus declarative scoring constructs (scales & scoring rules).

Non‑negotiables:
 - Do NOT mutate psychometric computations directly from these tables.
 - KLSI 4.0 scoring continues to live in services until fully ported.
 - All rule execution will be implemented in a future runtime adapter.

Tables here are SAFE to evolve while we experiment with engine DSL.
"""

from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class InstrumentStatus(enum.Enum):
    draft = "DRAFT"
    active = "ACTIVE"
    retired = "RETIRED"


class EngineInstrument(Base):
    __tablename__ = "engine_instruments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(60))  # e.g. KLSI
    version: Mapped[str] = mapped_column(String(20), default="1.0")
    name: Mapped[str] = mapped_column(String(200))
    status: Mapped[InstrumentStatus] = mapped_column(Enum(InstrumentStatus), default=InstrumentStatus.draft)
    description: Mapped[Optional[str]] = mapped_column(String(1000))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    forms: Mapped[list[EngineForm]] = relationship(back_populates="instrument", cascade="all, delete-orphan")
    scales: Mapped[list[EngineScale]] = relationship(back_populates="instrument", cascade="all, delete-orphan")
    rules: Mapped[list[EngineScoringRule]] = relationship(back_populates="instrument", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("code", "version", name="uq_engine_instrument_code_version"),
    )


class EngineForm(Base):
    __tablename__ = "engine_forms"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    instrument_id: Mapped[int] = mapped_column(ForeignKey("engine_instruments.id"))
    form_code: Mapped[str] = mapped_column(String(60))
    title: Mapped[Optional[str]] = mapped_column(String(200))
    ordering: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    instrument: Mapped[EngineInstrument] = relationship(back_populates="forms")
    pages: Mapped[list[EnginePage]] = relationship(back_populates="form", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("instrument_id", "form_code", name="uq_engine_form_code_per_instrument"),
    )


class EnginePage(Base):
    __tablename__ = "engine_pages"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    form_id: Mapped[int] = mapped_column(ForeignKey("engine_forms.id"))
    page_code: Mapped[str] = mapped_column(String(60))
    title: Mapped[Optional[str]] = mapped_column(String(200))
    page_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    form: Mapped[EngineForm] = relationship(back_populates="pages")
    items: Mapped[list[EngineItem]] = relationship(back_populates="page", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("form_id", "page_code", name="uq_engine_page_code_per_form"),
    )


class EngineItemType(enum.Enum):
    forced_choice = "FORCED_CHOICE"  # ipsative rank group
    single_choice = "SINGLE_CHOICE"
    text = "TEXT"
    context_rank = "CONTEXT_RANK"  # LFI style context style ranking analogue


class EngineItem(Base):
    __tablename__ = "engine_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    page_id: Mapped[int] = mapped_column(ForeignKey("engine_pages.id"))
    item_code: Mapped[str] = mapped_column(String(60))
    item_type: Mapped[EngineItemType] = mapped_column(Enum(EngineItemType))
    stem: Mapped[str] = mapped_column(String(1000))
    sequence_order: Mapped[int] = mapped_column(Integer, default=0)
    metadata_payload: Mapped[Optional[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    page: Mapped[EnginePage] = relationship(back_populates="items")
    options: Mapped[list[EngineItemOption]] = relationship(
        back_populates="item", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("page_id", "item_code", name="uq_engine_item_code_per_page"),
    )


class EngineItemOption(Base):
    __tablename__ = "engine_item_options"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("engine_items.id"))
    option_code: Mapped[str] = mapped_column(String(40))
    option_text: Mapped[str] = mapped_column(String(500))
    learning_mode: Mapped[Optional[str]] = mapped_column(String(10))  # e.g. CE/RO/AC/AE for KLSI mapping
    value: Mapped[Optional[str]] = mapped_column(String(40))  # generic numeric / symbolic value (string for flexibility)
    metadata_payload: Mapped[Optional[dict]] = mapped_column(JSON)

    item: Mapped[EngineItem] = relationship(back_populates="options")

    __table_args__ = (
        UniqueConstraint("item_id", "option_code", name="uq_engine_item_option_code"),
    )


class EngineScale(Base):
    __tablename__ = "engine_scales"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    instrument_id: Mapped[int] = mapped_column(ForeignKey("engine_instruments.id"))
    scale_code: Mapped[str] = mapped_column(String(40))
    name: Mapped[Optional[str]] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(String(1000))
    ordering: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    instrument: Mapped[EngineInstrument] = relationship(back_populates="scales")

    __table_args__ = (
        UniqueConstraint("instrument_id", "scale_code", name="uq_engine_scale_code_per_instrument"),
    )


class RuleType(enum.Enum):
    sum = "SUM"               # Sum raw contributions
    diff = "DIFF"             # Difference of two referenced scalars
    percentile = "PERCENTILE" # Norm lookup (raw -> pct)
    classify = "CLASSIFY"     # Region boundary classification
    custom = "CUSTOM"         # Placeholder for Python hook


class EngineScoringRule(Base):
    __tablename__ = "engine_scoring_rules"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    instrument_id: Mapped[int] = mapped_column(ForeignKey("engine_instruments.id"))
    rule_code: Mapped[str] = mapped_column(String(60))
    rule_type: Mapped[RuleType] = mapped_column(Enum(RuleType))
    target: Mapped[Optional[str]] = mapped_column(String(60))  # e.g. scale code or derived metric name
    expression: Mapped[Optional[str]] = mapped_column(String(1000))  # DSL / JSON expression (to be defined)
    config: Mapped[Optional[dict]] = mapped_column(JSON)  # Parameterization for execution engine
    position: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    instrument: Mapped[EngineInstrument] = relationship(back_populates="rules")

    __table_args__ = (
        UniqueConstraint("instrument_id", "rule_code", name="uq_engine_rule_code_per_instrument"),
        CheckConstraint("position >= 0", name="ck_engine_rule_position_non_negative"),
    )


# NOTE: No automatic migration is generated here; an Alembic revision must be
# created after this scaffolding lands. Existing tests import only klsi models;
# to include these in test DB creation, conftest should import this module.
