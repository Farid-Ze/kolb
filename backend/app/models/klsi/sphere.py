from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional, Any

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, Text, JSON, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.models.klsi.enums import ReflectionType

__all__ = ["SphereNode", "MemoryReflection"]


class SphereNode(Base):
    __tablename__ = "sphere_nodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    pos_x: Mapped[float] = mapped_column(Float)
    pos_y: Mapped[float] = mapped_column(Float)
    pos_z: Mapped[float] = mapped_column(Float)
    unlock_date: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    meta: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON().with_variant(JSONB, "postgresql"), nullable=True)

    user: Mapped["User"] = relationship(back_populates="sphere_nodes")
    reflections: Mapped[list["MemoryReflection"]] = relationship(back_populates="sphere_node")

    __table_args__ = (
        Index("ix_sphere_nodes_user_id", "user_id"),
    )


class MemoryReflection(Base):
    __tablename__ = "memory_reflections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    sphere_node_id: Mapped[Optional[int]] = mapped_column(ForeignKey("sphere_nodes.id"), nullable=True)
    content: Mapped[str] = mapped_column(Text)
    reflection_type: Mapped[ReflectionType] = mapped_column(Enum(ReflectionType))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship(back_populates="reflections")
    sphere_node: Mapped[Optional["SphereNode"]] = relationship(back_populates="reflections")

    __table_args__ = (
        Index("ix_memory_reflections_user_id", "user_id"),
    )


if TYPE_CHECKING:  # pragma: no cover
    from app.models.klsi.user import User
