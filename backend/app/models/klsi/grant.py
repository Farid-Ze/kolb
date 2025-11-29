import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UUID, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

class AccessGrant(Base):
    __tablename__ = "access_grants"
    __table_args__ = (
        CheckConstraint('credits_consumed <= credits_total', name='check_credits_limit'),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Who gave this grant? (System or Admin)
    grantor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    # Who owns this grant?
    grantee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    
    # What instrument is this for? (e.g., KLSI4, TeamRole)
    instrument_id: Mapped[int] = mapped_column(ForeignKey("instruments.id"), nullable=False)
    
    # Quota details
    credits_total: Mapped[int] = mapped_column(Integer, default=1)
    credits_consumed: Mapped[int] = mapped_column(Integer, default=0)
    
    # Audit trail from legacy store
    source_ref: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    study_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Validity
    expiry_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    grantor = relationship("User", foreign_keys=[grantor_id])
    grantee = relationship("User", foreign_keys=[grantee_id])
    instrument = relationship("Instrument")

    @property
    def is_active(self) -> bool:
        """Check if grant is valid and has remaining credits."""
        now = datetime.now(timezone.utc)
        not_expired = self.expiry_date is None or self.expiry_date > now
        has_credits = self.credits_consumed < self.credits_total
        return not_expired and has_credits
