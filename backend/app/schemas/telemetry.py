from __future__ import annotations

from typing import Any

from pydantic import Field

from app.schemas.base import CamelModel


class AssessmentTelemetryPayload(CamelModel):
    """Payload capturing latency + blur telemetry for a forced-choice item."""

    session_id: int = Field(gt=0, description="Assessment session identifier")
    item_id: int = Field(gt=0, description="Assessment item identifier")
    response_rank: int = Field(ge=1, le=4, description="Rank assigned to the selected option")
    response_latency_ms: int = Field(ge=0, le=120000, description="Time spent on the item in milliseconds")
    blur_events: int | None = Field(default=None, ge=0, description="Number of blur events recorded for the item")
    meta: dict[str, Any] | None = Field(default=None, description="Optional telemetry metadata blob (e.g., device info)")
