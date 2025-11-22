from datetime import timezone
from email.utils import format_datetime

from fastapi import APIRouter, Depends, Header, HTTPException, Response
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.repositories import SessionRepository
from app.engine.runtime import runtime
from app.models.klsi.user import User
from app.services.security import get_current_user
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
)
from app.services.assessments import upsert_responses
from app.core.config import settings
from app.core.metrics import inc_counter
from app.models.klsi.items import UserResponse, ItemChoice
from app.models.klsi.learning import LFIContextScore
from app.models.klsi.enums import SessionStatus
from app.i18n.id_messages import SessionErrorMessages
from app.services.engine import EngineSessionService

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
def start_session(db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
    user = get_current_user(authorization, db)
    session = runtime.start_session(db, user, instrument_code="KLSI", instrument_version="4.0")
    return SessionStartResponse(session_id=session.id)

@router.get("/{session_id}/items", response_model=list)
def get_items(
    session_id: int, 
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None)
):
    """
    Fetch assessment items for a specific session.
    
    Security:
    - Requires authentication.
    - Enforces strict ownership: users can only access their own sessions.
    - Returns 403 Forbidden if accessing another user's session.
    """
    user = get_current_user(authorization, db)
    repo = SessionRepository(db)
    sess = repo.get_for_user(session_id, user.id)
    
    # Prevent users from accessing sessions that do not belong to them
    if not sess or sess.user_id != user.id:
        raise HTTPException(status_code=403, detail=SessionErrorMessages.ACCESS_DENIED)

    # Return all items (20): 12 learning style + 8 LFI
    delivery = runtime.delivery_package(db, session_id)
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
def submit_item(session_id: int, item_id: int, ranks: dict, response: Response, db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
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
    user = get_current_user(authorization, db)
    repo = SessionRepository(db)
    sess = repo.get_for_user(session_id, user.id)
    if not sess or sess.user_id != user.id:
        raise HTTPException(status_code=403, detail=SessionErrorMessages.ACCESS_DENIED)
    try:
        submission = LegacyItemSubmissionPayload(item_id=item_id, ranks=ranks)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc
    runtime.submit_payload(db, session_id, submission.runtime_payload())
    return OperationStatus()

@router.post("/{session_id}/submit_context", response_model=OperationStatus, deprecated=True)
def submit_context(
    session_id: int,
    context_name: str,
    CE: int,
    RO: int,
    AC: int,
    AE: int,
    response: Response,
    overwrite: bool = False,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
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
    user = get_current_user(authorization, db)
    repo = SessionRepository(db)
    sess = repo.get_for_user(session_id, user.id)
    if not sess or sess.user_id != user.id:
        raise HTTPException(status_code=403, detail=SessionErrorMessages.ACCESS_DENIED)
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
    runtime.submit_payload(db, session_id, context_submission.runtime_payload())
    return OperationStatus()


@router.post("/{session_id}/submit_all_responses", response_model=SessionOperationResult)
def submit_all_responses(
    session_id: int,
    payload: SessionSubmissionPayload,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    """Batch submission of 12 learning-style items and 8 LFI contexts in a single transaction,
    followed by finalize. This reduces chattiness (22 calls → 1) and ensures atomicity.
    """
    user = get_current_user(authorization, db)
    repo = SessionRepository(db)
    sess = repo.get_for_user(session_id, user.id)
    if not sess or sess.user_id != user.id:
        raise HTTPException(status_code=403, detail=SessionErrorMessages.ACCESS_DENIED)
    if sess.status == SessionStatus.completed:
        raise HTTPException(status_code=409, detail=SessionErrorMessages.ALREADY_COMPLETED)

    try:
        # Single transaction: insert all ranks then finalize
        for item in payload.items:
            for choice_id, rank_value in item.ranks.items():
                db.add(
                    UserResponse(
                        session_id=session_id,
                        item_id=item.item_id,
                        choice_id=int(choice_id),
                        rank_value=int(rank_value),
                    )
                )
        for ctx in payload.contexts:
            db.add(
                LFIContextScore(
                    session_id=session_id,
                    context_name=ctx.context_name,
                    CE_rank=ctx.CE,
                    RO_rank=ctx.RO,
                    AC_rank=ctx.AC,
                    AE_rank=ctx.AE,
                )
            )
        # Explicit flush because SessionLocal disables autoflush; finalize() queries must see the new ranks.
        db.flush()
        # After data persisted, run finalize using the engine runtime helper with audit
        def _payload_builder(res: dict) -> bytes:
            combination = res.get("combination")
            lfi = res.get("lfi")
            if not combination or not lfi:
                return b""
            return (
                f"user:{user.email};session:{session_id};ACCE:{combination.ACCE_raw};"
                f"AERO:{combination.AERO_raw};LFI:{lfi.LFI_score}"
            ).encode("utf-8")

        result = runtime.finalize_with_audit(
            db,
            session_id,
            actor_email=user.email,
            action="FINALIZE_SESSION_USER_BATCH",
            build_payload=_payload_builder,
        )
        db.commit()

        result_payload = adapt_engine_to_api_payload(result)
        return SessionOperationResult(result=result_payload)
    except HTTPException:
        raise
    except Exception as exc:
        # In case of constraint violations or other errors, rollback any pending txn
        db.rollback()
        raise HTTPException(status_code=500, detail=SessionErrorMessages.BATCH_FAILURE) from exc

@router.post("/{session_id}/finalize", response_model=SessionOperationResult)
def finalize(session_id: int, db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
    user = get_current_user(authorization, db)
    repo = SessionRepository(db)
    sess = repo.get_for_user(session_id, user.id)
    if not sess or sess.user_id != user.id:
        raise HTTPException(status_code=403, detail=SessionErrorMessages.ACCESS_DENIED)
    if sess.status == SessionStatus.completed:
        raise HTTPException(status_code=409, detail=SessionErrorMessages.ALREADY_COMPLETED)
    # Explicit guard: require all 8 LFI contexts present before finalize,
    # even if engine validation would catch it. Gives clearer 400 with detail.
    validation_snapshot = run_session_validations(db, session_id)
    if not validation_snapshot.get("ready", False):
        issues = validation_snapshot.get("issues", [])
        raise HTTPException(status_code=400, detail={"issues": issues, "diagnostics": validation_snapshot.get("diagnostics")})
    engine_service = EngineSessionService(db)
    result = engine_service.finalize_session(session_id, user)
    return SessionOperationResult(result=result)

@router.get("/{session_id}/validation", response_model=dict)
def session_validation(session_id: int, db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
    """Mengembalikan status kelengkapan sesi (item ipsatif & konteks LFI)."""
    # Autentikasi opsional: jika token ada pastikan pemilik sesi atau mediator
    viewer: User | None = None
    if authorization:
        try:
            viewer = get_current_user(authorization, db)
        except HTTPException:
            viewer = None
    repo = SessionRepository(db)
    sess = repo.get_by_id(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail=SessionErrorMessages.NOT_FOUND)
    if viewer and viewer.role != 'MEDIATOR' and viewer.id != sess.user_id:
        raise HTTPException(status_code=403, detail=SessionErrorMessages.FORBIDDEN)
    return run_session_validations(db, session_id)

@router.post("/{session_id}/force_finalize", response_model=SessionOperationResult)
def force_finalize(
    session_id: int,
    request: ForceFinalizeRequest,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    mediator = get_current_user(authorization, db)
    if mediator.role != "MEDIATOR":
        raise HTTPException(status_code=403, detail=SessionErrorMessages.MEDIATOR_OVERRIDE_FORBIDDEN)
    repo = SessionRepository(db)
    sess = repo.get_by_id(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail=SessionErrorMessages.NOT_FOUND)

    def _payload_builder_override(res: dict) -> bytes:
        validation = res.get("validation") or {}
        issues = validation.get("issues", []) if isinstance(validation, dict) else []
        issue_codes = ",".join(sorted({i.get("code", "") for i in issues if isinstance(i, dict) and i.get("code")}))
        return (
            f"mediator:{mediator.email};session:{session_id};override:true;"
            f"reason:{request.reason or '-'};issues:{issue_codes or '-'}"
        ).encode("utf-8")

    result = runtime.finalize_with_audit(
        db,
        session_id,
        actor_email=mediator.email,
        action="FORCE_FINALIZE_SESSION",
        build_payload=_payload_builder_override,
        skip_validation=True,
    )
    db.commit()

    combination = result.get("combination")
    lfi = result.get("lfi")
    style = result.get("style")
    validation = result.get("validation")

    issues = validation.get("issues", []) if isinstance(validation, dict) else []
    issue_codes = ",".join(sorted({issue.get("code", "") for issue in issues if issue.get("code")}))
    payload = (
        f"mediator:{mediator.email};session:{session_id};override:true;"
        f"reason:{request.reason or '-'};issues:{issue_codes or '-'}"
    ).encode("utf-8")
    # Audit persisted within runtime transaction

    return SessionOperationResult(
        result=adapt_engine_to_api_payload(
            result,
            override_reason=request.reason,
            override_value=True,
        )
    )


@router.post("/{session_id}/response", response_model=SingleItemResponse)
def submit_single_response(
    session_id: int,
    payload: SingleItemResponsePayload,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    """
    Real-time submission of a single item response (Walking Skeleton).
    Maps dimension codes (CE, RO, AC, AE) to choice IDs and submits to runtime.
    """
    user = get_current_user(authorization, db)
    repo = SessionRepository(db)
    sess = repo.get_for_user(session_id, user.id)
    if not sess or sess.user_id != user.id:
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

@router.patch("/{session_id}/responses", status_code=204)
def submit_responses(
    session_id: int,
    payload: AssessmentResponseBatch,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None)
):
    user = get_current_user(authorization, db)
    repo = SessionRepository(db)
    session = repo.get_by_id(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this session")
    if getattr(session, "is_finalized", False):
         raise HTTPException(status_code=409, detail="Session already finalized")

    upsert_responses(db, session_id, payload.responses)
    return Response(status_code=204)
