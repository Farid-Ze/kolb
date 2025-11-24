from datetime import datetime
from typing import Any

from pydantic import Field

from app.schemas.base import CamelModel


class AssessmentResultsResponse(CamelModel):
    session_id: int
    finalized_at: datetime | None = None
    kite_coordinates: dict[str, float] | None = None
    blindspots: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    lfi_score: float | None = None
    percentiles: dict[str, Any] | None = None
