from __future__ import annotations

from datetime import datetime

from pydantic import EmailStr, Field

from app.schemas.base import CamelModel


class ReportShareCreate(CamelModel):
    mediator_email: EmailStr = Field(description="Email mediator yang diberi akses")
    expires_in_hours: int = Field(
        default=72,
        ge=1,
        le=24 * 14,
        description="Durasi link berlaku dalam jam (maks 14 hari)",
    )
    note: str | None = Field(default=None, max_length=255)


class ReportShareOut(CamelModel):
    share_id: int
    session_id: int
    mediator_email: EmailStr
    mediator_name: str | None
    expires_at: datetime
    share_token: str
    note: str | None


