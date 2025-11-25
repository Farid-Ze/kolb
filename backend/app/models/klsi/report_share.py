from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.klsi.assessment import AssessmentSession
    from app.models.klsi.user import User

__all__ = ["ReportShareLink"]


class ReportShareLink(Base):
    """Time-bound share links authorizing mediators to view a report."""

    __tablename__ = "report_share_links"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assessment_sessions.id"), index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    mediator_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    mediator_email: Mapped[str] = mapped_column(String(255))
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    note: Mapped[str | None] = mapped_column(String(255))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    last_accessed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    access_count: Mapped[int] = mapped_column(Integer, default=0)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    session: Mapped["AssessmentSession"] = relationship()
    owner: Mapped["User"] = relationship(foreign_keys=[owner_id])
    mediator: Mapped["User"] = relationship(foreign_keys=[mediator_id])