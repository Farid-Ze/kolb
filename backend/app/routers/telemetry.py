"""Telemetry router for tracking user interactions and session events.

This module provides endpoints for collecting telemetry data from frontend clients.
Supports both legacy individual events and modern batched telemetry for scalability.
"""

from fastapi import APIRouter, BackgroundTasks, HTTPException, Response
from pydantic import BaseModel, Field
from typing import Any

from app.core.logging import get_logger

router = APIRouter(prefix="/telemetry", tags=["telemetry"])
logger = get_logger("kolb.telemetry")


# Schemas
class TelemetryEvent(BaseModel):
    """Single telemetry event."""
    type: str = Field(..., description="Event type: mouse, scroll, time_on_page, etc.")
    timestamp_ms: int = Field(..., description="Client-side timestamp in milliseconds")
    payload: dict[str, Any] = Field(default_factory=dict, description="Event-specific data")


class TelemetryBatch(BaseModel):
    """Batch of telemetry events for efficient processing."""
    session_id: str | None = Field(None, description="Optional session ID for correlation")
    events: list[TelemetryEvent] = Field(..., max_length=1000, description="Events to process")


class MouseMovementEvent(BaseModel):
    """Legacy mouse movement event schema."""
    x: int
    y: int
    timestamp_ms: int | None = None


class ScrollEvent(BaseModel):
    """Legacy scroll event schema."""
    scroll_y: int
    timestamp_ms: int | None = None


class TimeOnPageEvent(BaseModel):
    """Legacy time-on-page event schema."""
    duration_ms: int
    page: str | None = None


# Background processing
async def process_telemetry_batch(batch: TelemetryBatch):
    """
    Process telemetry events in background.
    
    This runs asynchronously to avoid blocking the response.
    Events are logged for analysis and monitoring.
    """
    for event in batch.events:
        logger.info(
            f"telemetry.{event.type}",
            extra={
                "structured_data": {
                    "session_id": batch.session_id,
                    "timestamp_ms": event.timestamp_ms,
                    **event.payload
                }
            }
        )


# Modern batch endpoint (recommended)
@router.post("/batch", status_code=202)
async def batch_telemetry(
    batch: TelemetryBatch,
    background_tasks: BackgroundTasks
):
    """
    Accept batched telemetry events for async processing.
    
    **Scalability Benefits:**
    - Reduces request volume by 90%+ through client-side batching
    - Uses Beacon API for fire-and-forget delivery
    - Processes events asynchronously (non-blocking)
    - Handles up to 1000 events per batch
    
    **Usage:**
    ```javascript
    const batch = {
      session_id: "abc123",
      events: [
        {type: "mouse", timestamp_ms: 1234567890, payload: {x: 100, y: 200}},
        {type: "scroll", timestamp_ms: 1234567891, payload: {scrollY: 500}}
      ]
    };
    
    // Using Beacon API (recommended)
    navigator.sendBeacon('/telemetry/batch', JSON.stringify(batch));
    
    // Or fetch with keepalive
    fetch('/telemetry/batch', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(batch),
      keepalive: true
    });
    ```
    
    **Returns:** 202 Accepted (processing in background)
    """
    # Validate batch size
    if len(batch.events) > 1000:
        raise HTTPException(
            status_code=413,
            detail="Batch too large (max 1000 events)"
        )
    
    # Process asynchronously
    background_tasks.add_task(process_telemetry_batch, batch)
    
    return {
        "accepted": len(batch.events),
        "status": "processing"
    }


# Legacy endpoints (deprecated for scalability)
@router.post("/mouse-movement", status_code=202, deprecated=True, include_in_schema=False)
def record_mouse_movement(event: MouseMovementEvent, response: Response):
    """
    Record mouse movement event.
    
    **DEPRECATED:** Use `/telemetry/batch` instead for better scalability.
    
    This endpoint will be removed on 2026-03-01.
    """
    response.headers["Deprecation"] = "true"
    response.headers["Link"] = "</telemetry/batch>; rel=\"successor-version\""
    response.headers["Sunset"] = "Sat, 01 Mar 2026 00:00:00 GMT"
    
    logger.info(
        "telemetry.mouse_movement",
        extra={
            "structured_data": {
                "x": event.x,
                "y": event.y,
                "timestamp_ms": event.timestamp_ms
            }
        }
    )
    
    return {"status": "recorded"}


@router.post("/scroll", status_code=202, deprecated=True, include_in_schema=False)
def record_scroll(event: ScrollEvent, response: Response):
    """
    Record scroll event.
    
    **DEPRECATED:** Use `/telemetry/batch` instead for better scalability.
    
    This endpoint will be removed on 2026-03-01.
    """
    response.headers["Deprecation"] = "true"
    response.headers["Link"] = "</telemetry/batch>; rel=\"successor-version\""
    response.headers["Sunset"] = "Sat, 01 Mar 2026 00:00:00 GMT"
    
    logger.info(
        "telemetry.scroll",
        extra={
            "structured_data": {
                "scroll_y": event.scroll_y,
                "timestamp_ms": event.timestamp_ms
            }
        }
    )
    
    return {"status": "recorded"}


@router.post("/time-on-page", status_code=202, deprecated=True, include_in_schema=False)
def record_time_on_page(event: TimeOnPageEvent, response: Response):
    """
    Record time spent on page.
    
    **DEPRECATED:** Use `/telemetry/batch` instead for better scalability.
    
    This endpoint will be removed on 2026-03-01.
    """
    response.headers["Deprecation"] = "true"
    response.headers["Link"] = "</telemetry/batch>; rel=\"successor-version\""
    response.headers["Sunset"] = "Sat, 01 Mar 2026 00:00:00 GMT"
    
    logger.info(
        "telemetry.time_on_page",
        extra={
            "structured_data": {
                "duration_ms": event.duration_ms,
                "page": event.page
            }
        }
    )
    
    return {"status": "recorded"}

class ReplayEvent(BaseModel):
    """Event captured for session replay."""
    type: str
    payload: dict[str, Any]
    timestampMs: int


class ReplayEventBatch(BaseModel):
    """Batch of replay events."""
    sessionId: int
    events: list[ReplayEvent]


@router.post("/replay-events", status_code=202)
async def record_replay_events(
    batch: ReplayEventBatch,
    background_tasks: BackgroundTasks
):
    """
    Record session replay events for debugging.
    
    Stores events in a JSONL file for later playback/analysis.
    """
    # Process in background to avoid blocking
    background_tasks.add_task(_write_replay_logs, batch)
    return {"status": "accepted", "count": len(batch.events)}


def _write_replay_logs(batch: ReplayEventBatch):
    """Write replay events to disk."""
    import json
    from pathlib import Path
    
    log_dir = Path("logs/replays")
    log_dir.mkdir(parents=True, exist_ok=True)
    
    log_file = log_dir / f"session_{batch.sessionId}.jsonl"
    
    try:
        with open(log_file, "a", encoding="utf-8") as f:
            for event in batch.events:
                entry = {
                    "timestamp": event.timestampMs,
                    "type": event.type,
                    "payload": event.payload
                }
                f.write(json.dumps(entry) + "\n")
    except Exception as e:
        logger.error(f"Failed to write replay logs for session {batch.sessionId}: {e}")
