"""Telemetry router for tracking user interactions and session events.

This module provides endpoints for collecting telemetry data from frontend clients.
Supports both legacy individual events and modern batched telemetry for scalability.
"""

from typing import Any, TYPE_CHECKING
import uuid

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Response, Depends
from pydantic import BaseModel, Field

if TYPE_CHECKING:
    import sqlalchemy.orm

from app.core.logging import get_logger
from app.core.metrics import inc_counter
from app.db.database import get_db, get_async_db
from app.services.security import get_current_user
from app.services.engine import EngineSessionService
from app.core.errors import SessionNotFoundError, PermissionDeniedError
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/telemetry", tags=["telemetry"])
logger = get_logger("kolb.telemetry")
from app.schemas.base import CamelModel

class TelemetryEvent(CamelModel):
    """Single telemetry event."""
    type: str = Field(..., description="Event type: mouse, scroll, time_on_page, etc.")
    timestamp_ms: int = Field(..., alias="timestampMs", description="Client-side timestamp in milliseconds")
    payload: dict[str, Any] = Field(default_factory=dict, description="Event-specific data")


class TelemetryBatch(CamelModel):
    """Batch of telemetry events for efficient processing."""
    session_id: str | None = Field(None, alias="sessionId", description="Optional session ID for correlation")
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
    background_tasks: BackgroundTasks,
    content_length: int = Header(..., alias="Content-Length", lt=1_000_000)  # Max 1MB
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
    sessionId: uuid.UUID
    events: list[ReplayEvent]


@router.post("/replay-events", status_code=202)
async def record_replay_events(
    batch: ReplayEventBatch,
    background_tasks: BackgroundTasks
):
    """
    Record session replay events for debugging.
    
    Logs events to stdout for aggregation (Cloud-Native).
    """
    # Process in background to avoid blocking
    background_tasks.add_task(_log_replay_batch, batch)
    return {"status": "accepted", "count": len(batch.events)}


def _log_replay_batch(batch: ReplayEventBatch):
    """Log replay events to stdout."""
    for event in batch.events:
        logger.info(
            "telemetry.replay_event",
            extra={
                "structured_data": {
                    "session_id": batch.sessionId,
                    "timestamp_ms": event.timestampMs,
                    "type": event.type,
                    "payload": event.payload
                }
            }
        )


class GuideOpenEvent(BaseModel):
    guide_id: str
    language: str
    surface: str
    context: str
    consent: bool


class PageViewEvent(BaseModel):
    page_path: str
    page_title: str
    referrer: str | None = None
    locale: str
    consent: bool


class ActionEvent(BaseModel):
    action_type: str
    action_target: str
    action_value: str | None = None
    metadata: dict[str, Any] | None = None
    consent: bool
    actor_role: str | None = None


class AssessmentTelemetryEvent(CamelModel):
    session_id: uuid.UUID = Field(..., alias="sessionId")
    item_id: int = Field(..., alias="itemId")
    response_rank: int | None = Field(None, alias="responseRank")
    response_latency_ms: int | None = Field(None, alias="responseLatencyMs")
    blur_events: int | None = Field(None, alias="blurEvents")
    meta: dict[str, Any] | None = None


@router.post("/guide-open", status_code=202)
def record_guide_open(event: GuideOpenEvent):
    inc_counter("guides.open.total")
    inc_counter(f"guides.open.guide.{event.guide_id}")
    inc_counter(f"guides.open.surface.{event.surface}")
    inc_counter(f"guides.open.lang.{event.language}")
    inc_counter(f"guides.open.context.{event.context}")
    if event.consent:
        inc_counter("guides.open.consent.granted")
    return {"ok": True}


@router.post("/page-view", status_code=202)
def record_page_view(event: PageViewEvent):
    inc_counter("page.view.total")
    inc_counter(f"page.view.path.{event.page_path}")
    inc_counter(f"page.view.locale.{event.locale}")
    if event.referrer:
        inc_counter("page.view.with_referrer")
    if event.consent:
        inc_counter("page.view.consent.granted")
    return {"ok": True}


@router.post("/action", status_code=202)
def record_action(event: ActionEvent):
    inc_counter("action.total")
    inc_counter(f"action.type.{event.action_type}")
    inc_counter(f"action.target.{event.action_target}")
    if not event.consent:
        inc_counter("action.consent.denied")
    if event.actor_role:
        inc_counter(f"action.role.{event.actor_role}")
    return {"ok": True}


@router.post("/assessment", status_code=202)
async def record_assessment_telemetry(
    event: AssessmentTelemetryEvent,
    db: AsyncSession = Depends(get_async_db),
    current_user: Any = Depends(get_current_user)
):
    service = EngineSessionService(db)
    try:
        await service.record_telemetry(
            session_id=event.session_id,
            user=current_user,
            item_id=event.item_id,
            response_rank=event.response_rank,
            response_latency_ms=event.response_latency_ms,
            blur_events=event.blur_events,
            meta=event.meta
        )
    except SessionNotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")
    except PermissionDeniedError:
        raise HTTPException(status_code=403, detail="Not authorized for this session")
    
    return {"ok": True}

