from __future__ import annotations

from datetime import datetime, timezone
from email.utils import format_datetime
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Header, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.engine.authoring import (
    get_instrument_locale_resource,
    get_instrument_spec,
    list_instrument_specs,
)
from app.services.security import get_current_user
from app.schemas.session import SessionSubmissionPayload
from app.core.errors import InstrumentNotFoundError, PermissionDeniedError
from app.core.metrics import (
    get_metrics,
    get_counters,
    get_histograms,
    get_last_runs,
    inc_counter,
)
from app.services.engine import EngineSessionService

def _format_sunset(value: datetime | None) -> str | None:
    if value is None:
        return None
    aware = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    return format_datetime(aware.astimezone(timezone.utc))

router = APIRouter(prefix="/engine", tags=["engine"])


class StartSessionRequest(BaseModel):
    instrument_code: str
    instrument_version: Optional[str] = None


class SubmissionPayload(BaseModel):
    kind: Literal["item", "context"]
    item_id: Optional[int] = None
    ranks: Optional[dict[int, int]] = None
    context_name: Optional[str] = None
    CE: Optional[int] = None
    RO: Optional[int] = None
    AC: Optional[int] = None
    AE: Optional[int] = None


class ForceFinalizeRequest(BaseModel):
    reason: Optional[str] = None
@router.get("/instruments", response_model=dict)
def list_instruments(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    # Any authenticated user may fetch instrument catalog metadata.
    get_current_user(authorization, db)
    specs = list_instrument_specs()
    return {"instruments": [spec.manifest() for spec in specs]}


@router.get("/instruments/{instrument_code}/{instrument_version}", response_model=dict)
def get_instrument_manifest(
    instrument_code: str,
    instrument_version: str,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    get_current_user(authorization, db)
    try:
        spec = get_instrument_spec(instrument_code, instrument_version)
    except KeyError as exc:
        raise InstrumentNotFoundError("Instrument manifest tidak ditemukan") from exc
    return {"instrument": spec.manifest()}


@router.get("/instruments/{instrument_code}/{instrument_version}/resources/{locale}", response_model=dict)
def get_instrument_locale_resource_endpoint(
    instrument_code: str,
    instrument_version: str,
    locale: str,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    get_current_user(authorization, db)
    try:
        payload = get_instrument_locale_resource(instrument_code, instrument_version, locale)
    except KeyError as exc:
        raise InstrumentNotFoundError("Resource locale tidak ditemukan") from exc
    return {"locale": locale, "resources": payload}


@router.post("/sessions/start", response_model=dict)
def start_engine_session(
    payload: StartSessionRequest,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    service = EngineSessionService(db)
    session = service.start_session(
        user,
        instrument_code=payload.instrument_code,
        instrument_version=payload.instrument_version,
    )
    return {"session_id": session.id}


@router.get("/sessions/{session_id}/delivery", response_model=dict)
def get_delivery(
    session_id: int,
    locale: str | None = None,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    service = EngineSessionService(db)
    return service.delivery_package(session_id, user, locale=locale)


@router.post("/sessions/{session_id}/submit_all", response_model=dict)
def submit_all_responses(
    session_id: int,
    payload: SessionSubmissionPayload,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    """Accept 12 learning-style items and 8 LFI contexts in a single request and finalize atomically."""
    user = get_current_user(authorization, db)
    service = EngineSessionService(db)
    result = service.submit_full_batch(session_id, user, payload)
    return {"ok": True, "result": result}


@router.post("/sessions/{session_id}/interactions", response_model=dict)
def submit_interaction(
    session_id: int,
    payload: SubmissionPayload,
    response: Response,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    """Backward-compatible single interaction submission (deprecated).
    Retained to support existing clients and tests; prefer submit_all.
    """
    user = get_current_user(authorization, db)
    service = EngineSessionService(db)
    service.ensure_access(session_id, user)
    # Deprecation telemetry
    response.headers["Deprecation"] = "true"
    response.headers["Link"] = f"</engine/sessions/{session_id}/submit_all>; rel=successor-version"
    from app.core.config import settings as _settings
    sunset_header = _format_sunset(_settings.legacy_sunset)
    if sunset_header:
        response.headers["Sunset"] = sunset_header
    inc_counter("deprecated.engine.interactions")
    service.submit_interaction(session_id, user, payload.model_dump(exclude_unset=True))
    return {"ok": True}


@router.get("/metrics", response_model=dict)
def engine_metrics(
    reset: bool = False,
    include_last_runs: bool = True,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    if user.role != "MEDIATOR":
        raise PermissionDeniedError("Hanya mediator yang dapat melihat metrik")

    timings = get_metrics(reset=reset)
    counters = get_counters(reset=reset)
    histograms = get_histograms(reset=reset)
    last_runs = get_last_runs(reset=reset) if include_last_runs or reset else {}

    payload = {
        "timings": timings,
        "counters": counters,
        "histograms": histograms,
    }
    if include_last_runs:
        payload["last_runs"] = last_runs
    return payload


@router.post("/sessions/{session_id}/finalize", response_model=dict)
def finalize_session(
    session_id: int,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    service = EngineSessionService(db)
    result = service.finalize_session(session_id, user)
    return {"ok": True, "result": result}


@router.get("/sessions/{session_id}/report", response_model=dict)
def engine_report(
    session_id: int,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    viewer = get_current_user(authorization, db)
    service = EngineSessionService(db)
    return service.build_report(session_id, viewer)


@router.post("/sessions/{session_id}/force-finalize", response_model=dict)
def force_finalize_session(
    session_id: int,
    request: ForceFinalizeRequest,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    mediator = get_current_user(authorization, db)
    service = EngineSessionService(db)
    result = service.force_finalize(session_id, mediator, reason=request.reason)
    return {"ok": True, "result": result}
