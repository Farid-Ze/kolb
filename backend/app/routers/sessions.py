import uuid
from datetime import timezone
from email.utils import format_datetime

from typing import Any, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Response, BackgroundTasks
from pydantic import ValidationError

from app.db.database import get_db, get_async_db
from app.db.repositories import SessionRepository
from app.engine.runtime import runtime
from app.services.security import get_current_user, decode_access_token, get_current_user_optional
from app.services.validation import run_session_validations
from app.schemas.base import CamelModel
from app.services.provenance import log_provenance_background_task
from app.schemas.session import (
    SessionSubmissionPayload,
    SessionAutosavePayload,
    LegacyItemSubmissionPayload,
    LegacyContextSubmissionPayload,
    SessionStartResponse,
    OperationStatus,
    SessionOperationResult,
    SingleItemResponsePayload,
    SingleItemResponse,
    AssessmentResponseBatch,
    AssessmentItemResponsePayload,
    StartSessionRequest,
    SessionUpdate,
    SessionStatus,
    SessionListResponse,
)
from app.services.assessments import upsert_responses
from app.core.config import settings
from app.core.metrics import inc_counter
from app.core.logging import get_logger
from app.i18n.id_messages import SessionErrorMessages
from app.services.engine import EngineSessionService

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("/", response_model=list[SessionListResponse])
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


class ForceFinalizeRequest(CamelModel):
    reason: str | None = None


def _get_attr(obj, attr_name: str):
    if obj is None:
        return None
    if isinstance(obj, dict):
        return obj.get(attr_name)
    return getattr(obj, attr_name, None)


def adapt_engine_to_api_payload(
    engine_output: dict | None,
    *,
    override_reason: str | None = None,
    override_value: bool | None = None,
) -> dict | None:
    if not engine_output:
        return None

    combination = engine_output.get("combination")
    style = engine_output.get("style")
    lfi = engine_output.get("lfi")
    percentiles = engine_output.get("percentiles")

    payload = {
        "ACCE": _get_attr(combination, "ACCE_raw"),
        "AERO": _get_attr(combination, "AERO_raw"),
        "style_primary_id": _get_attr(style, "primary_style_type_id") or _get_attr(style, "id"),
        "LFI": _get_attr(lfi, "LFI_score"),
        "delta": engine_output.get("delta"),
        "percentile_sources": getattr(percentiles, "norm_provenance", None) if percentiles is not None else None,
        "norm_group_used": _get_attr(percentiles, "norm_group_used"),
        "norm_version_used": _get_attr(percentiles, "norm_version_used"),
        "validation": engine_output.get("validation"),
        "override": engine_output.get("override", False) if override_value is None else override_value,
    }
    if override_reason is not None:
        payload["override_reason"] = override_reason

    return payload


def _sunset_header_value() -> str | None:
    sunset = settings.legacy_sunset
    if sunset is None:
        return None
    aware = sunset if sunset.tzinfo else sunset.replace(tzinfo=timezone.utc)
    return format_datetime(aware.astimezone(timezone.utc))


from app.services.grant_service import GrantService
from app.models.klsi.instrument import Instrument
from app.core.errors import InsufficientCreditsError
from sqlalchemy import select

@router.post("/start", response_model=SessionStartResponse)
async def start_session(
    payload: StartSessionRequest,
    db_async: Any = Depends(get_async_db),
    db_sync: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """
    Start a new assessment session.
    
    This is the primary entry point for starting an assessment.
    Enforces Grant consumption (Phase 1: Semantic Pivot).
    """
    from fastapi.concurrency import run_in_threadpool

    # 1. Lookup Instrument (Async)
    stmt = select(Instrument).where(Instrument.code == payload.instrument_code)
    result = await db_async.execute(stmt)
    instrument = result.scalar_one_or_none()
    
    if not instrument:
        raise HTTPException(status_code=404, detail=f"Instrument {payload.instrument_code} not found")

    # 2. Consume Credit (Async Transactional)
    # Only for KLSI instruments for now
    if payload.instrument_code == "KLSI":
        grant_service = GrantService(db_async)
        try:
            await grant_service.redeem_credit(current_user.id, instrument.id)
        except InsufficientCreditsError as e:
            raise HTTPException(status_code=402, detail=e.message)

    # 3. Start Session (Sync Engine in Threadpool)
    # We use db_sync for the engine because runtime is synchronous
    service = EngineSessionService(db_sync)
    
    # Wrap blocking call
    session = await run_in_threadpool(
        service.start_session,
        current_user,
        instrument_code=payload.instrument_code,
        instrument_version=payload.instrument_version,
    )
    return SessionStartResponse(session_id=session.id)


@router.get("/{session_id}/delivery", response_model=dict)
def get_delivery(
    session_id: uuid.UUID,
    locale: str | None = None,
    lite: bool = False,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """
    Fetch full delivery package including items, manifest, and locale resources.
    This is the primary endpoint for retrieving assessment content.
    
    Args:
        lite: If True, returns only manifest and structure (no item content).
              Use for checking updates or lightweight sync.
    """
    service = EngineSessionService(db)
    return service.delivery_package(session_id, current_user, locale=locale, lite=lite)

@router.get("/{session_id}/items", response_model=list)
def get_items(
    session_id: uuid.UUID, 
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """
    Fetch assessment items for a specific session.
    
    Security:
    - Requires authentication.
    - Enforces strict ownership: users can only access their own sessions.
    - Returns 403 Forbidden if accessing another user's session.
    """
    service = EngineSessionService(db)
    delivery = service.delivery_package(session_id, current_user)
    items = delivery.get("items", [])
    return [
        {
            "id": item["id"],
            "number": item["number"],
            "type": item["type"],
            "stem": item["stem"],
            "options": item.get("options", []),
            "category": item.get("category"),
        }
        for item in items
    ]

@router.post("/{session_id}/submit-item", response_model=OperationStatus, deprecated=True, include_in_schema=False)
@router.post("/{session_id}/submit_item", response_model=OperationStatus, deprecated=True, include_in_schema=False)
def submit_item(
    session_id: uuid.UUID, 
    item_id: int, 
    ranks: dict, 
    response: Response, 
    db: Any = Depends(get_db), 
    current_user: Any = Depends(get_current_user)
):
    # Optional runtime deprecation: return 410 Gone when DISABLE_LEGACY_SUBMISSION=1
    if settings.disable_legacy_submission and settings.environment not in ("dev", "development", "test"):
        raise HTTPException(status_code=410, detail=SessionErrorMessages.LEGACY_ENDPOINT_DEPRECATED)
    # Telemetry & deprecation header
    response.headers["Deprecation"] = "true"
    response.headers["Link"] = "</sessions/{session_id}/submit_all_responses>; rel=successor-version"
    sunset_value = _sunset_header_value()
    if sunset_value:
        response.headers["Sunset"] = sunset_value
    inc_counter("deprecated.sessions.submit_item")
    
    try:
        submission = LegacyItemSubmissionPayload(item_id=item_id, ranks=ranks)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc
    
    service = EngineSessionService(db)
    service.submit_interaction(session_id, current_user, submission.runtime_payload())
    return OperationStatus()

@router.post("/{session_id}/submit-context", response_model=OperationStatus, deprecated=True, include_in_schema=False)
@router.post("/{session_id}/submit_context", response_model=OperationStatus, deprecated=True, include_in_schema=False)
def submit_context(
    session_id: uuid.UUID,
    context_name: str,
    CE: int,
    RO: int,
    AC: int,
    AE: int,
    response: Response,
    overwrite: bool = False,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    if settings.disable_legacy_submission and settings.environment not in ("dev", "development", "test"):
        raise HTTPException(status_code=410, detail=SessionErrorMessages.LEGACY_ENDPOINT_DEPRECATED)
    # Telemetry & deprecation header
    response.headers["Deprecation"] = "true"
    response.headers["Link"] = "</sessions/{session_id}/submit_all_responses>; rel=successor-version"
    sunset_value = _sunset_header_value()
    if sunset_value:
        response.headers["Sunset"] = sunset_value
    inc_counter("deprecated.sessions.submit_context")
    
    try:
        context_submission = LegacyContextSubmissionPayload(
            context_name=context_name,
            CE=CE,
            RO=RO,
            AC=AC,
            AE=AE,
            overwrite=overwrite,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc
    
    service = EngineSessionService(db)
    service.submit_interaction(session_id, current_user, context_submission.runtime_payload())
    return OperationStatus()


@router.post("/{session_id}/submit-all-responses", response_model=SessionOperationResult)
@router.post("/{session_id}/submit_all_responses", response_model=SessionOperationResult, include_in_schema=False)
def submit_all_responses(
    session_id: uuid.UUID,
    payload: SessionSubmissionPayload,
    background_tasks: BackgroundTasks,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """Batch submission of 12 learning-style items and 8 LFI contexts in a single transaction,
    followed by finalize. This reduces chattiness (22 calls → 1) and ensures atomicity.
    """
    service = EngineSessionService(db)
    # Service handles validation, persistence, finalization, and error mapping (via DomainError)
    result = service.submit_full_batch(session_id, current_user, payload)
    
    if result and "_provenance_payload" in result:
        prov_payload = result.pop("_provenance_payload")
        background_tasks.add_task(log_provenance_background_task, **prov_payload)

    return SessionOperationResult(result=result)

@router.patch("/{session_id}", response_model=SessionOperationResult)
def update_session(
    session_id: uuid.UUID,
    payload: SessionUpdate,
    background_tasks: BackgroundTasks,
    idempotency_key: Optional[str] = Header(None, description="Unique key to prevent duplicate operations"),
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """
    Update session state.
    
    - Set status='completed' to finalize the session.
    """
    if payload.status == SessionStatus.COMPLETED:
        # Re-use finalize logic
        return finalize(session_id, background_tasks, db, current_user)
    
    # Future: Handle other updates (e.g. abandonment)
    return SessionOperationResult(ok=True)


@router.post("/{session_id}/finalize", response_model=SessionOperationResult, deprecated=True)
def finalize(
    session_id: uuid.UUID, 
    background_tasks: BackgroundTasks,
    db: Any = Depends(get_db), 
    current_user: Any = Depends(get_current_user)
):
    # Explicit guard: require all 8 LFI contexts present before finalize,
    # even if engine validation would catch it. Gives clearer 400 with detail.
    validation_snapshot = run_session_validations(db, session_id)
    if not validation_snapshot.get("ready", False):
        issues = validation_snapshot.get("issues", [])
        raise HTTPException(status_code=400, detail={"issues": issues, "diagnostics": validation_snapshot.get("diagnostics")})
    
    service = EngineSessionService(db)
    result = service.finalize_session(session_id, current_user)
    
    if result and "_provenance_payload" in result:
        prov_payload = result.pop("_provenance_payload")
        background_tasks.add_task(log_provenance_background_task, **prov_payload)

    return SessionOperationResult(result=result)

@router.get("/{session_id}/validation", response_model=dict)
def session_validation(
    session_id: uuid.UUID, 
    db: Any = Depends(get_db), 
    viewer: Any | None = Depends(get_current_user_optional)
):
    """Mengembalikan status kelengkapan sesi (item ipsatif & konteks LFI)."""
    # Autentikasi opsional: jika token ada pastikan pemilik sesi atau mediator
            
    repo = SessionRepository(db)
    sess = repo.get_by_id(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail=SessionErrorMessages.NOT_FOUND)
    if viewer and viewer.role != 'MEDIATOR' and viewer.id != sess.user_id:
        raise HTTPException(status_code=403, detail=SessionErrorMessages.FORBIDDEN)
    return run_session_validations(db, session_id)

@router.post("/{session_id}/force_finalize", response_model=SessionOperationResult, include_in_schema=False)
def force_finalize(
    session_id: uuid.UUID,
    request: ForceFinalizeRequest,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """
    Force finalize a session without validation.
    
    ⚠️ WARNING: This bypasses data integrity checks and may produce
    invalid results. Use only for:
    - Testing/debugging
    - Data recovery scenarios
    - Explicit user request with informed consent
    
    Requires: MEDIATOR or ADMIN role
    Logged: All force finalizations are audited
    """
    # Access control: Require mediator or admin role
    if current_user.role not in ("MEDIATOR", "ADMIN"):
        from app.core.errors import PermissionDeniedError
        from app.i18n.id_messages import AuthorizationMessages
        raise PermissionDeniedError(AuthorizationMessages.MEDIATOR_ADMIN_ONLY)
    
    # Audit logging
    logger = get_logger("kolb.sessions.force_finalize")
    logger.warning(
        "force_finalize_invoked",
        extra={
            "structured_data": {
                "session_id": session_id,
                "user_id": current_user.id,
                "user_role": current_user.role,
                "reason": request.reason or "not_provided"
            }
        }
    )
    
    service = EngineSessionService(db)
    # Service handles permission check, logic, and payload transformation
    result = service.force_finalize(session_id, current_user, reason=request.reason)
    return SessionOperationResult(result=result)


@router.post("/{session_id}/response", response_model=SingleItemResponse, include_in_schema=False)
def submit_single_response(
    session_id: uuid.UUID,
    payload: SingleItemResponsePayload,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """
    Real-time submission of a single item response (Walking Skeleton).
    Maps dimension codes (CE, RO, AC, AE) to choice IDs and submits to runtime.
    """
    service = EngineSessionService(db)
    result = service.submit_single_response(
        session_id, current_user, payload.item_id, payload.response_map
    )
    return SingleItemResponse(**result)


@router.post("/{session_id}/autosave", response_model=SessionOperationResult)
def autosave_session(
    session_id: uuid.UUID,
    payload: SessionAutosavePayload,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """
    Autosave partial progress (items and contexts).
    
    This endpoint supports the "Batch" strategy by allowing periodic saves
    without triggering full submission logic.
    """
    service = EngineSessionService(db)
    result = service.autosave_responses(session_id, current_user, payload)
    return SessionOperationResult(result=result)


@router.patch("/{session_id}/responses", status_code=204)
def upsert_session_responses(
    session_id: uuid.UUID,
    payload: list[AssessmentItemResponsePayload],
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    repo = SessionRepository(db)
    sess = repo.get_for_user(session_id, current_user.id)
    if not sess or sess.user_id != current_user.id:
        raise HTTPException(status_code=403, detail=SessionErrorMessages.ACCESS_DENIED)

    upsert_responses(db, session_id, payload)
    return Response(status_code=204)


