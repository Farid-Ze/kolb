import uuid
from datetime import datetime
from typing import Any

from pydantic import Field

from app.schemas.base import CamelModel


class KiteCoordinates(CamelModel):
    CE: float
    RO: float
    AC: float
    AE: float


class AssessmentResultsResponse(CamelModel):
    session_id: uuid.UUID
    finalized_at: datetime | None = None
    kite_coordinates: KiteCoordinates
    blindspots: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    lfi_score: float
    percentiles: dict[str, Any]
    cycle_phase: str | None = None
    backup_style: str | None = None
