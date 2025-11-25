from datetime import datetime, timezone
from email.utils import format_datetime
from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends, Header, Response

from app.db.database import get_db
from app.engine.authoring import (
    get_instrument_locale_resource,
    get_instrument_spec,
    list_instrument_specs,
)
from app.services.security import get_current_user
from app.schemas.base import CamelModel
from app.schemas.report import ReportPayload, as_report_payload
from app.schemas.session import (
    SessionAutosavePayload,
    SessionSubmissionPayload,
    SessionStartResponse,
    SessionOperationResult,
    OperationStatus,
    SessionListResponse,
)
from app.db.repositories import SessionRepository
from app.core.errors import InstrumentNotFoundError, PermissionDeniedError
from app.core.metrics import (
    get_metrics,
    get_counters,
    get_histograms,
    get_last_runs,
    inc_counter,
)
from app.services.engine import EngineSessionService
from app.i18n.id_messages import AuthorizationMessages, EngineMessages

def _format_sunset(value: datetime | None) -> str | None:
    if value is None:
        return None
    aware = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    return format_datetime(aware.astimezone(timezone.utc))

router = APIRouter(prefix="/engine", tags=["engine"])


@router.get("/sessions/", response_model=list[SessionListResponse])
def list_sessions(
    skip: int = 0,
    limit: int = 100,
    current_user: Any = Depends(get_current_user),
    db: Any = Depends(get_db),
):
    """List all assessment sessions for the current user."""
    repo = SessionRepository(db)
    sessions = repo.get_by_user(current_user.id, skip=skip, limit=limit)
    return sessions


class StartSessionRequest(CamelModel):
    instrument_code: str
    instrument_version: Optional[str] = None


class SubmissionPayload(CamelModel):
    kind: Literal["item", "context"]
    item_id: Optional[int] = None
    ranks: Optional[dict[int, int]] = None
    context_name: Optional[str] = None
    CE: Optional[int] = None
    RO: Optional[int] = None
    AC: Optional[int] = None
    AE: Optional[int] = None


class ForceFinalizeRequest(CamelModel):
    reason: Optional[str] = None
@router.get("/instruments", response_model=dict)
def list_instruments(
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    # Any authenticated user may fetch instrument catalog metadata.
    specs = list_instrument_specs()
    return {"instruments": [spec.manifest() for spec in specs]}


@router.get("/instruments/{instrument_code}/{instrument_version}", response_model=dict)
def get_instrument_manifest(
    instrument_code: str,
    instrument_version: str,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    try:
        spec = get_instrument_spec(instrument_code, instrument_version)
    except KeyError as exc:
        raise InstrumentNotFoundError(EngineMessages.MANIFEST_NOT_FOUND) from exc
    return {"instrument": spec.manifest()}


@router.get("/instruments/{instrument_code}/{instrument_version}/resources/{locale}", response_model=dict)
def get_instrument_locale_resource_endpoint(
    instrument_code: str,
    instrument_version: str,
    locale: str,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    try:
        payload = get_instrument_locale_resource(instrument_code, instrument_version, locale)
    except KeyError as exc:
        raise InstrumentNotFoundError(EngineMessages.LOCALE_RESOURCE_NOT_FOUND) from exc
    return {"locale": locale, "resources": payload}


@router.post("/sessions/start", response_model=SessionStartResponse)
def start_engine_session(
    payload: StartSessionRequest,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    service = EngineSessionService(db)
    session = service.start_session(
        current_user,
        instrument_code=payload.instrument_code,
        instrument_version=payload.instrument_version,
    )
    return SessionStartResponse(session_id=session.id)


@router.get("/sessions/{session_id}/delivery", response_model=dict)
def get_delivery(
    session_id: int,
    locale: str | None = None,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    service = EngineSessionService(db)
    return service.delivery_package(session_id, current_user, locale=locale)


@router.get("/sessions/{session_id}/items", response_model=dict)
def get_session_items(
    session_id: int,
    locale: str | None = None,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    service = EngineSessionService(db)
    return service.session_state(session_id, current_user, locale=locale)


@router.post("/sessions/{session_id}/items", response_model=SessionOperationResult)
def autosave_session_items(
    session_id: int,
    payload: SessionAutosavePayload,
    locale: str | None = None,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    service = EngineSessionService(db)
    result = service.autosave_responses(session_id, current_user, payload, locale=locale)
    return SessionOperationResult(result=result)


@router.post("/sessions/{session_id}/submit_all", response_model=SessionOperationResult)
def submit_all_responses(
    session_id: int,
    payload: SessionSubmissionPayload,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """Accept 12 learning-style items and 8 LFI contexts in a single request and finalize atomically (Sync)."""
    service = EngineSessionService(db)
    result = service.submit_full_batch(session_id, current_user, payload)
    return SessionOperationResult(result=result)


@router.post("/sessions/{session_id}/interactions", response_model=OperationStatus)
def submit_interaction(
    session_id: int,
    payload: SubmissionPayload,
    response: Response,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """Backward-compatible single interaction submission (deprecated).
    Retained to support existing clients and tests; prefer submit_all.
    """
    service = EngineSessionService(db)
    service.ensure_access(session_id, current_user)
    # Deprecation telemetry
    response.headers["Deprecation"] = "true"
    response.headers["Link"] = f"</engine/sessions/{session_id}/submit_all>; rel=successor-version"
    from app.core.config import settings as _settings
    sunset_header = _format_sunset(_settings.legacy_sunset)
    if sunset_header:
        response.headers["Sunset"] = sunset_header
    inc_counter("deprecated.engine.interactions")
    service.submit_interaction(session_id, current_user, payload.model_dump(exclude_unset=True))
    return OperationStatus()


@router.get("/metrics", response_model=dict)
def engine_metrics(
    reset: bool = False,
    include_last_runs: bool = True,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    if current_user.role != "MEDIATOR":
        raise PermissionDeniedError(AuthorizationMessages.MEDIATOR_METRICS_ONLY)

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


@router.post("/sessions/{session_id}/finalize", response_model=SessionOperationResult)
def finalize_session(
    session_id: int,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    service = EngineSessionService(db)
    result = service.finalize_session(session_id, current_user)
    return SessionOperationResult(result=result)


@router.get("/sessions/{session_id}/validation", response_model=dict)
def validation_snapshot(
    session_id: int,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """Expose run_session_validations snapshot via engine router."""
    service = EngineSessionService(db)
    return service.validation_snapshot(session_id, current_user)


@router.get("/sessions/{session_id}/report", response_model=ReportPayload)
def engine_report(
    session_id: int,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    service = EngineSessionService(db)
    report = service.build_report(session_id, current_user)
    return as_report_payload(report)


@router.post("/sessions/{session_id}/force-finalize", response_model=SessionOperationResult)
def force_finalize_session(
    session_id: int,
    request: ForceFinalizeRequest,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    service = EngineSessionService(db)
    result = service.force_finalize(session_id, current_user, reason=request.reason)
    return SessionOperationResult(result=result)
