from typing import Any, Literal
import uuid

from pydantic import Field

from app.schemas.base import CamelModel


class AssessmentTelemetryPayload(CamelModel):
    """Payload capturing latency + blur telemetry for a forced-choice item."""

    session_id: uuid.UUID = Field(..., description="Assessment session identifier", serialization_alias="sessionId", validation_alias="sessionId")
    item_id: int = Field(gt=0, description="Assessment item identifier")
    response_rank: int = Field(ge=1, le=4, description="Rank assigned to the selected option")
    response_latency_ms: int = Field(ge=0, le=120000, description="Time spent on the item in milliseconds")
    blur_events: int | None = Field(default=None, ge=0, description="Number of blur events recorded for the item")
    meta: dict[str, Any] | None = Field(default=None, description="Optional telemetry metadata blob (e.g., device info)")


class TimeOnPageEvent(CamelModel):
    """Captures duration spent on a specific route."""
    page_path: str = Field(..., min_length=1, max_length=200)
    duration_ms: int = Field(..., ge=0, le=3600000, description="Duration in ms (max 1 hour)")
    session_id: uuid.UUID | None = Field(None, serialization_alias="sessionId", validation_alias="sessionId")


class ItemChangedEvent(CamelModel):
    """Captures when a user changes their answer (rank) for an item."""
    session_id: uuid.UUID = Field(..., serialization_alias="sessionId", validation_alias="sessionId")
    item_id: int = Field(..., gt=0)
    from_rank: int | None = Field(None, ge=1, le=4)
    to_rank: int = Field(..., ge=1, le=4)
    timestamp_ms: int = Field(..., ge=0)



class MouseMovementEvent(CamelModel):
    """Captures mouse coordinates. Should be throttled/sampled on client."""
    session_id: uuid.UUID | None = Field(None, serialization_alias="sessionId", validation_alias="sessionId")
    page_path: str = Field(..., min_length=1, max_length=200)
    x: int = Field(..., ge=0)
    y: int = Field(..., ge=0)
    viewport_width: int = Field(..., gt=0)
    viewport_height: int = Field(..., gt=0)
    timestamp_ms: int = Field(..., ge=0)


class ReplayEvent(CamelModel):
    """Generic event for session replay."""
    type: str = Field(..., min_length=1, max_length=50)
    payload: dict[str, Any] = Field(default_factory=dict)
    timestamp_ms: int = Field(..., ge=0)


class ReplayEventBatch(CamelModel):
    """Batch of replay events for a session."""
    session_id: uuid.UUID = Field(..., serialization_alias="sessionId", validation_alias="sessionId")
    events: list[ReplayEvent]

