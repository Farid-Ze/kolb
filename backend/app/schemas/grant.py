from datetime import datetime
from uuid import UUID
from pydantic import Field
from app.schemas.base import CamelModel

class GrantCreate(CamelModel):
    instrument_id: int = 1  # Default to KLSI
    credits: int = Field(gt=0)
    expiry_date: datetime | None = None

class GrantRevoke(CamelModel):
    grant_id: UUID
    reason: str | None = None

class GrantOut(CamelModel):
    id: UUID
    user_id: int
    instrument_id: int
    credits_total: int
    credits_consumed: int
    expiry_date: datetime | None = None
    is_active: bool
