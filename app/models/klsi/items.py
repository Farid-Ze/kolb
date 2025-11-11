from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import CheckConstraint, Enum, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.models.klsi.enums import ItemType, LearningMode

__all__ = [
    "AssessmentItem",
    "ItemChoice",
    "UserResponse",
]


class AssessmentItem(Base):
    __tablename__ = "assessment_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    item_number: Mapped[int] = mapped_column(Integer, index=True)
    item_type: Mapped[ItemType] = mapped_column(Enum(ItemType))
    item_stem: Mapped[str] = mapped_column(String(300))
    item_category: Mapped[Optional[str]] = mapped_column(String(100))
    item_order_position: Mapped[Optional[int]] = mapped_column(Integer)
    language: Mapped[str] = mapped_column(String(10), default="EN")

    choices: Mapped[list["ItemChoice"]] = relationship(back_populates="item")


class ItemChoice(Base):
    __tablename__ = "item_choices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("assessment_items.id"))
    learning_mode: Mapped[LearningMode] = mapped_column(Enum(LearningMode))
    choice_text: Mapped[str] = mapped_column(String(400))

    item: Mapped[AssessmentItem] = relationship(back_populates="choices")
    responses: Mapped[list["UserResponse"]] = relationship(back_populates="choice")


class UserResponse(Base):
    __tablename__ = "user_responses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assessment_sessions.id"))
    item_id: Mapped[int] = mapped_column(ForeignKey("assessment_items.id"))
    choice_id: Mapped[int] = mapped_column(ForeignKey("item_choices.id"))
    rank_value: Mapped[int] = mapped_column(Integer)

    __table_args__ = (
        UniqueConstraint("session_id", "item_id", "rank_value", name="uq_rank_per_item"),
        UniqueConstraint("session_id", "choice_id", name="uq_choice_once_per_session"),
        CheckConstraint("rank_value BETWEEN 1 AND 4", name="ck_rank_range"),
        Index("ix_user_responses_session_item", "session_id", "item_id"),
    )

    session: Mapped["AssessmentSession"] = relationship(back_populates="responses")
    choice: Mapped[ItemChoice] = relationship(back_populates="responses")


if TYPE_CHECKING:  # pragma: no cover
    from app.models.klsi.assessment import AssessmentSession
