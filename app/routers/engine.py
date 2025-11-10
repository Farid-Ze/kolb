from __future__ import annotations

from datetime import datetime, timezone
from hashlib import sha256
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.engine.runtime import runtime
from app.models.klsi import AssessmentSession, AuditLog, User
from app.services.security import get_current_user

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


def _get_session(db: Session, session_id: int) -> AssessmentSession:
    session = (
        db.query(AssessmentSession)
        .filter(AssessmentSession.id == session_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session tidak ditemukan")
    return session


def _assert_access(user: User, session: AssessmentSession) -> None:
    if user.role != "MEDIATOR" and session.user_id != user.id:
        raise HTTPException(status_code=403, detail="Akses sesi ditolak")


@router.post("/sessions/start", response_model=dict)
def start_engine_session(
    payload: StartSessionRequest,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    session = runtime.start_session(
        db,
        user,
        instrument_code=payload.instrument_code,
        instrument_version=payload.instrument_version,
    )
    return {"session_id": session.id}


@router.get("/sessions/{session_id}/delivery", response_model=dict)
def get_delivery(
    session_id: int,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    session = _get_session(db, session_id)
    _assert_access(user, session)
    return runtime.delivery_package(db, session_id)


@router.post("/sessions/{session_id}/interactions", response_model=dict)
def submit_interaction(
    session_id: int,
    payload: SubmissionPayload,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    session = _get_session(db, session_id)
    _assert_access(user, session)
    runtime.submit_payload(db, session_id, payload.dict(exclude_unset=True))
    return {"ok": True}


@router.post("/sessions/{session_id}/finalize", response_model=dict)
def finalize_session(
    session_id: int,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    session = _get_session(db, session_id)
    _assert_access(user, session)
    result = runtime.finalize(db, session_id)
    combination = result.get("combination")
    lfi = result.get("lfi")
    style = result.get("style")
    validation = result.get("validation")
    override = result.get("override", False)

    if combination and lfi and style:
        payload = (
            f"user:{user.email};session:{session_id};ACCE:{combination.ACCE_raw};"
            f"AERO:{combination.AERO_raw};LFI:{lfi.LFI_score}"
        ).encode("utf-8")
        db.add(
            AuditLog(
                actor=user.email,
                action="FINALIZE_SESSION_USER",
                payload_hash=sha256(payload).hexdigest(),
                created_at=datetime.now(timezone.utc),
            )
        )
        db.commit()

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
            "override": override,
        },
    }


@router.get("/sessions/{session_id}/report", response_model=dict)
def engine_report(
    session_id: int,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    viewer = get_current_user(authorization, db)
    session = _get_session(db, session_id)
    _assert_access(viewer, session)
    viewer_role: Optional[str] = None
    if viewer.role == "MEDIATOR":
        viewer_role = "MEDIATOR"
    data = runtime.build_report(db, session_id, viewer_role)
    return data


@router.post("/sessions/{session_id}/force-finalize", response_model=dict)
def force_finalize_session(
    session_id: int,
    request: ForceFinalizeRequest,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    mediator = get_current_user(authorization, db)
    if mediator.role != "MEDIATOR":
        raise HTTPException(status_code=403, detail="Hanya mediator yang dapat melakukan override")
    session = _get_session(db, session_id)
    result = runtime.finalize(db, session_id, skip_validation=True)
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
    db.add(
        AuditLog(
            actor=mediator.email,
            action="FORCE_FINALIZE_SESSION",
            payload_hash=sha256(payload).hexdigest(),
            created_at=datetime.now(timezone.utc),
        )
    )
    db.commit()

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
