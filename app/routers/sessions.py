from datetime import datetime, timezone
from hashlib import sha256

from fastapi import APIRouter, Depends, Header, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.engine.runtime import runtime
from app.models.klsi import (
    AssessmentSession,
    AuditLog,
    User,
)
from app.services.security import get_current_user
from app.services.validation import run_session_validations
from app.schemas.session import SessionSubmissionPayload
from app.core.config import settings
from app.core.metrics import inc_counter
from app.models.klsi import UserResponse, LFIContextScore, SessionStatus

router = APIRouter(prefix="/sessions", tags=["sessions"])


class ForceFinalizeRequest(BaseModel):
    reason: str | None = None

@router.post("/start", response_model=dict)
def start_session(db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
    user = get_current_user(authorization, db)
    session = runtime.start_session(db, user, instrument_code="KLSI", instrument_version="4.0")
    return {"session_id": session.id}

@router.get("/{session_id}/items", response_model=list)
def get_items(session_id: int, db: Session = Depends(get_db)):
    # Return all items (20): 12 learning style + 8 LFI
    delivery = runtime.delivery_package(db, session_id)
    items = delivery.get("items", [])
    return [
        {
            "id": item["id"],
            "number": item["number"],
            "type": item["type"],
            "stem": item["stem"],
        }
        for item in items
    ]

@router.post("/{session_id}/submit_item", response_model=dict, deprecated=True)
def submit_item(session_id: int, item_id: int, ranks: dict, response: Response, db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
    # Optional runtime deprecation: return 410 Gone when DISABLE_LEGACY_SUBMISSION=1
    if settings.disable_legacy_submission and settings.environment not in ("dev", "development", "test"):
        raise HTTPException(status_code=410, detail="Endpoint deprecated. Gunakan /sessions/{session_id}/submit_all_responses.")
    # Telemetry & deprecation header
    response.headers["Deprecation"] = "true"
    response.headers["Link"] = "</sessions/{session_id}/submit_all_responses>; rel=successor-version"
    if settings.legacy_sunset:
        response.headers["Sunset"] = settings.legacy_sunset
    inc_counter("deprecated.sessions.submit_item")
    user = get_current_user(authorization, db)
    sess = db.query(AssessmentSession).filter(AssessmentSession.id==session_id).first()
    if not sess or sess.user_id != user.id:
        raise HTTPException(status_code=403, detail="Akses sesi ditolak")
    payload = {
        "kind": "item",
        "item_id": item_id,
        "ranks": ranks,
    }
    runtime.submit_payload(db, session_id, payload)
    return {"ok": True}

@router.post("/{session_id}/submit_context", response_model=dict, deprecated=True)
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
        raise HTTPException(status_code=410, detail="Endpoint deprecated. Gunakan /sessions/{session_id}/submit_all_responses.")
    # Telemetry & deprecation header
    response.headers["Deprecation"] = "true"
    response.headers["Link"] = "</sessions/{session_id}/submit_all_responses>; rel=successor-version"
    if settings.legacy_sunset:
        response.headers["Sunset"] = settings.legacy_sunset
    inc_counter("deprecated.sessions.submit_context")
    user = get_current_user(authorization, db)
    sess = db.query(AssessmentSession).filter(AssessmentSession.id==session_id).first()
    if not sess or sess.user_id != user.id:
        raise HTTPException(status_code=403, detail="Akses sesi ditolak")
    payload = {
        "kind": "context",
        "context_name": context_name,
        "CE": CE,
        "RO": RO,
        "AC": AC,
        "AE": AE,
        "overwrite": overwrite,
    }
    runtime.submit_payload(db, session_id, payload)
    return {"ok": True}


@router.post("/{session_id}/submit_all_responses", response_model=dict)
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
    sess = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    if not sess or sess.user_id != user.id:
        raise HTTPException(status_code=403, detail="Akses sesi ditolak")
    if sess.status == SessionStatus.completed:
        raise HTTPException(status_code=409, detail="Sesi sudah selesai")

    try:
        # Single transaction: insert all ranks then finalize
        with db.begin():
            # Insert/validate learning style item ranks
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
            # Insert LFI contexts
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

        combination = result.get("combination")
        lfi = result.get("lfi")
        style = result.get("style")
        percentiles = result.get("percentiles")
        per_scale_provenance = getattr(percentiles, "norm_provenance", None) if percentiles is not None else None

        return {
            "ok": True,
            "result": {
                "ACCE": combination.ACCE_raw if combination else None,
                "AERO": combination.AERO_raw if combination else None,
                "style_primary_id": style.primary_style_type_id if style else None,
                "LFI": lfi.LFI_score if lfi else None,
                "delta": result.get("delta"),
                "percentile_sources": per_scale_provenance,
                "validation": result.get("validation"),
                "override": result.get("override", False),
            },
        }
    except HTTPException:
        raise
    except Exception as exc:
        # In case of constraint violations or other errors, rollback any pending txn
        db.rollback()
        raise HTTPException(status_code=500, detail="Gagal memproses submisi batch") from exc

@router.post("/{session_id}/finalize", response_model=dict)
def finalize(session_id: int, db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
    user = get_current_user(authorization, db)
    sess = db.query(AssessmentSession).filter(AssessmentSession.id==session_id).first()
    if not sess or sess.user_id != user.id:
        raise HTTPException(status_code=403, detail="Akses sesi ditolak")
    # Explicit guard: require all 8 LFI contexts present before finalize,
    # even if engine validation would catch it. Gives clearer 400 with detail.
    validation_snapshot = run_session_validations(db, session_id)
    if not validation_snapshot.get("ready", False):
        issues = validation_snapshot.get("issues", [])
        raise HTTPException(status_code=400, detail={"issues": issues, "diagnostics": validation_snapshot.get("diagnostics")})
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
        action="FINALIZE_SESSION_USER",
        build_payload=_payload_builder,
    )
    combination = result.get("combination")
    lfi = result.get("lfi")
    style = result.get("style")
    validation = result.get("validation")
    override = result.get("override", False)

    percentiles = result.get("percentiles")
    per_scale_provenance = None
    if percentiles is not None:
        per_scale_provenance = getattr(percentiles, "norm_provenance", None)

    # Audit persisted within runtime transaction

    return {"ok": True, "result": {
        "ACCE": combination.ACCE_raw if combination else None,
        "AERO": combination.AERO_raw if combination else None,
        "style_primary_id": style.primary_style_type_id if style else None,
        "LFI": lfi.LFI_score if lfi else None,
        "delta": result.get("delta"),
        "percentile_sources": per_scale_provenance,
        "validation": validation,
        "override": override,
    }}

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
    sess = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan")
    if viewer and viewer.role != 'MEDIATOR' and viewer.id != sess.user_id:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    return run_session_validations(db, session_id)

@router.post("/{session_id}/force_finalize", response_model=dict)
def force_finalize(
    session_id: int,
    request: ForceFinalizeRequest,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    mediator = get_current_user(authorization, db)
    if mediator.role != "MEDIATOR":
        raise HTTPException(status_code=403, detail="Hanya mediator yang dapat melakukan override")
    sess = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan")

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

    percentiles = result.get("percentiles")
    per_scale_provenance = None
    if percentiles is not None:
        per_scale_provenance = getattr(percentiles, "norm_provenance", None)

    return {
        "ok": True,
        "result": {
            "ACCE": combination.ACCE_raw if combination else None,
            "AERO": combination.AERO_raw if combination else None,
            "style_primary_id": style.primary_style_type_id if style else None,
            "LFI": lfi.LFI_score if lfi else None,
            "delta": result.get("delta"),
            "percentile_sources": per_scale_provenance,
            "validation": validation,
            "override": True,
            "override_reason": request.reason,
        },
    }
