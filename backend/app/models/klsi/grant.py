
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
import uuid

from sqlalchemy import DateTime, ForeignKey, Integer, String, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.klsi.user import User
    from app.models.klsi.instrument import Instrument

__all__ = ["AccessGrant"]

class AccessGrant(Base):
    __tablename__ = "access_grants"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: f"grant_{uuid.uuid4().hex[:12]}")
    grantor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    grantee_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    instrument_id: Mapped[int] = mapped_column(ForeignKey("instruments.id"), nullable=False)
    study_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, comment="External Research Study ID for provenance")
    credits_allocated: Mapped[int] = mapped_column(Integer, default=1)
    credits_consumed: Mapped[int] = mapped_column(Integer, default=0)
    expiry_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

    # Relationships
    grantor: Mapped["User"] = relationship("User", foreign_keys=[grantor_id])
    grantee: Mapped[Optional["User"]] = relationship("User", foreign_keys=[grantee_id])
    instrument: Mapped["Instrument"] = relationship("Instrument")
