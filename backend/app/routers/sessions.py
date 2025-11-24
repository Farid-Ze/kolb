import asyncio
from datetime import timezone
from email.utils import format_datetime

from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Response
from pydantic import ValidationError

from app.db.database import get_db
from app.db.repositories import SessionRepository
from app.engine.runtime import runtime
from app.models.klsi.user import User
from app.services.security import get_current_user, decode_access_token
from app.services.validation import run_session_validations
from app.schemas.base import CamelModel
from app.schemas.session import (
    SessionSubmissionPayload,
    LegacyItemSubmissionPayload,
    LegacyContextSubmissionPayload,
    SessionStartResponse,
    OperationStatus,
    SessionOperationResult,
    SingleItemResponsePayload,
    SingleItemResponse,
    AssessmentResponseBatch,
    AssessmentItemResponsePayload,
)
from app.services.assessments import upsert_responses
from app.core.config import settings
from app.core.metrics import inc_counter
from app.models.klsi.items import UserResponse, ItemChoice
from app.models.klsi.learning import LFIContextScore
from app.models.klsi.enums import SessionStatus
from app.i18n.id_messages import SessionErrorMessages
from app.services.engine_async import AsyncEngineSessionService

router = APIRouter(prefix="/sessions", tags=["sessions"])


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

@router.post("/start", response_model=SessionStartResponse)
async def start_session(
    db: Any = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = AsyncEngineSessionService(db)
    session = await service.start_session(
        current_user, instrument_code="KLSI", instrument_version="4.0"
    )
    return SessionStartResponse(session_id=session.id)

@router.get("/{session_id}/items", response_model=list)
async def get_items(
    session_id: int, 
    db: Any = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch assessment items for a specific session.
    
    Security:
    - Requires authentication.
    - Enforces strict ownership: users can only access their own sessions.
    - Returns 403 Forbidden if accessing another user's session.
    """
    service = AsyncEngineSessionService(db)
    delivery = await service.delivery_package(session_id, current_user)
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

@router.post("/{session_id}/submit_item", response_model=OperationStatus, deprecated=True)
async def submit_item(
    session_id: int, 
    item_id: int, 
    ranks: dict, 
    response: Response, 
    db: Any = Depends(get_db), 
    current_user: User = Depends(get_current_user)
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
    
    service = AsyncEngineSessionService(db)
    await service.submit_interaction(session_id, current_user, submission.runtime_payload())
    return OperationStatus()

@router.post("/{session_id}/submit_context", response_model=OperationStatus, deprecated=True)
async def submit_context(
    session_id: int,
    context_name: str,
    CE: int,
    RO: int,
    AC: int,
    AE: int,
    response: Response,
    overwrite: bool = False,
    db: Any = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
    
    service = AsyncEngineSessionService(db)
    await service.submit_interaction(session_id, current_user, context_submission.runtime_payload())
    return OperationStatus()


@router.post("/{session_id}/submit_all_responses", response_model=SessionOperationResult)
async def submit_all_responses(
    session_id: int,
    payload: SessionSubmissionPayload,
    db: Any = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Batch submission of 12 learning-style items and 8 LFI contexts in a single transaction,
    followed by finalize. This reduces chattiness (22 calls → 1) and ensures atomicity.
    """
    service = AsyncEngineSessionService(db)
    # Service handles validation, persistence, finalization, and error mapping (via DomainError)
    result = await service.submit_full_batch(session_id, current_user, payload)
    return SessionOperationResult(result=result)

@router.post("/{session_id}/finalize", response_model=SessionOperationResult)
async def finalize(
    session_id: int, 
    db: Any = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Explicit guard: require all 8 LFI contexts present before finalize,
    # even if engine validation would catch it. Gives clearer 400 with detail.
    validation_snapshot = await asyncio.to_thread(run_session_validations, db, session_id)
    if not validation_snapshot.get("ready", False):
        issues = validation_snapshot.get("issues", [])
        raise HTTPException(status_code=400, detail={"issues": issues, "diagnostics": validation_snapshot.get("diagnostics")})
    
    service = AsyncEngineSessionService(db)
    result = await service.finalize_session(session_id, current_user)
    return SessionOperationResult(result=result)

@router.get("/{session_id}/validation", response_model=dict)
async def session_validation(
    session_id: int, 
    db: Any = Depends(get_db), 
    authorization: str | None = Header(default=None)
):
    """Mengembalikan status kelengkapan sesi (item ipsatif & konteks LFI)."""
    def _sync_logic():
        # Autentikasi opsional: jika token ada pastikan pemilik sesi atau mediator
        viewer: User | None = None
        if authorization:
            try:
                parts = authorization.split(" ")
                if len(parts) == 2 and parts[0].lower() == "bearer":
                    token = parts[1]
                    payload = decode_access_token(token)
                    user_id = int(payload["sub"])
                    from app.db.repositories.user import UserRepository
                    user_repo = UserRepository(db)
                    viewer = user_repo.get(user_id)
            except Exception:
                viewer = None
                
        repo = SessionRepository(db)
        sess = repo.get_by_id(session_id)
        if not sess:
            raise HTTPException(status_code=404, detail=SessionErrorMessages.NOT_FOUND)
        if viewer and viewer.role != 'MEDIATOR' and viewer.id != sess.user_id:
            raise HTTPException(status_code=403, detail=SessionErrorMessages.FORBIDDEN)
        return run_session_validations(db, session_id)

    return await asyncio.to_thread(_sync_logic)

@router.post("/{session_id}/force_finalize", response_model=SessionOperationResult)
async def force_finalize(
    session_id: int,
    request: ForceFinalizeRequest,
    db: Any = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = AsyncEngineSessionService(db)
    # Service handles permission check, logic, and payload transformation
    result = await service.force_finalize(session_id, current_user, reason=request.reason)
    return SessionOperationResult(result=result)


@router.post("/{session_id}/response", response_model=SingleItemResponse)
async def submit_single_response(
    session_id: int,
    payload: SingleItemResponsePayload,
    db: Any = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Real-time submission of a single item response (Walking Skeleton).
    Maps dimension codes (CE, RO, AC, AE) to choice IDs and submits to runtime.
    """
    def _sync_logic():
        repo = SessionRepository(db)
        sess = repo.get_for_user(session_id, current_user.id)
        if not sess or sess.user_id != current_user.id:
            raise HTTPException(status_code=403, detail=SessionErrorMessages.ACCESS_DENIED)

        # 1. Fetch choices for the item to map Dimension -> Choice ID
        choices = db.query(ItemChoice).filter(ItemChoice.item_id == payload.item_id).all()
        if not choices:
            raise HTTPException(status_code=404, detail=f"Item {payload.item_id} not found or has no choices")

        # 2. Map response_map (Dimension -> Rank) to ranks (Choice ID -> Rank)
        ranks = {}
        for choice in choices:
            # choice.learning_mode is an Enum (CE, RO, AC, AE)
            mode_code = choice.learning_mode.name if hasattr(choice.learning_mode, "name") else str(choice.learning_mode)
            if mode_code in payload.response_map:
                ranks[choice.id] = payload.response_map[mode_code]
        
        if len(ranks) != 4:
            raise HTTPException(status_code=400, detail="Could not map all 4 dimensions to choices for this item")

        # 3. Construct runtime payload
        runtime_payload = {
            "kind": "item",
            "item_id": payload.item_id,
            "ranks": ranks,
        }

        # 4. Submit to runtime
        runtime.submit_payload(db, session_id, runtime_payload)

        # 5. Calculate progress (Simple approximation: count distinct items responded / 12)
        # This is a lightweight query
        responded_count = (
            db.query(UserResponse.item_id)
            .filter(UserResponse.session_id == session_id)
            .distinct()
            .count()
        )
        progress = min(100.0, (responded_count / 12.0) * 100.0)
        return SingleItemResponse(status="synced", progress=progress)

    return await asyncio.to_thread(_sync_logic)


@router.patch("/{session_id}/responses", status_code=204)
async def upsert_session_responses(
    session_id: int,
    payload: list[AssessmentItemResponsePayload],
    db: Any = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    def _sync_logic():
        repo = SessionRepository(db)
        sess = repo.get_for_user(session_id, current_user.id)
        if not sess or sess.user_id != current_user.id:
            raise HTTPException(status_code=403, detail=SessionErrorMessages.ACCESS_DENIED)

        upsert_responses(db, session_id, payload)
    
    await asyncio.to_thread(_sync_logic)
    return Response(status_code=204)


