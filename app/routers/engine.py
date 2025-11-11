from __future__ import annotations

from datetime import datetime, timezone
from email.utils import format_datetime
from hashlib import sha256
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.engine.authoring import (
    get_instrument_locale_resource,
    get_instrument_spec,
    list_instrument_specs,
)
from app.engine.runtime import runtime
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.audit import AuditLog
from app.models.klsi.user import User
from app.models.klsi.items import UserResponse
from app.models.klsi.learning import LFIContextScore
from app.models.klsi.enums import SessionStatus
from app.services.security import get_current_user
from app.schemas.session import SessionSubmissionPayload
from app.core.metrics import (
    get_metrics,
    get_counters,
    get_histograms,
    get_last_runs,
    inc_counter,
)


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
        raise HTTPException(status_code=404, detail="Instrument manifest tidak ditemukan") from exc
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
        raise HTTPException(status_code=404, detail="Resource locale tidak ditemukan") from exc
    return {"locale": locale, "resources": payload}


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
    locale: str | None = None,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    session = _get_session(db, session_id)
    _assert_access(user, session)
    return runtime.delivery_package(db, session_id, locale=locale)


@router.post("/sessions/{session_id}/submit_all", response_model=dict)
def submit_all_responses(
    session_id: int,
    payload: SessionSubmissionPayload,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    """Accept 12 learning-style items and 8 LFI contexts in a single request and finalize atomically."""
    user = get_current_user(authorization, db)
    session = _get_session(db, session_id)
    _assert_access(user, session)

    if session.status == SessionStatus.completed:
        raise HTTPException(status_code=409, detail="Sesi sudah selesai")

    try:
        with db.begin():
            # Insert all item ranks
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
            # Insert all contexts
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
        # Finalize with audit after persistence
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
            action="FINALIZE_SESSION_ENGINE_BATCH",
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
                "ACCE": getattr(combination, "ACCE_raw", None),
                "AERO": getattr(combination, "AERO_raw", None),
                "style_primary_id": getattr(style, "primary_style_type_id", None),
                "LFI": getattr(lfi, "LFI_score", None),
                "delta": result.get("delta"),
                "percentile_sources": per_scale_provenance,
                "validation": result.get("validation"),
                "override": result.get("override", False),
            },
        }
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Gagal memproses submisi batch") from exc


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
    session = _get_session(db, session_id)
    _assert_access(user, session)
    # Deprecation telemetry
    response.headers["Deprecation"] = "true"
    response.headers["Link"] = f"</engine/sessions/{session_id}/submit_all>; rel=successor-version"
    from app.core.config import settings as _settings
    sunset_header = _format_sunset(_settings.legacy_sunset)
    if sunset_header:
        response.headers["Sunset"] = sunset_header
    inc_counter("deprecated.engine.interactions")
    runtime.submit_payload(db, session_id, payload.model_dump(exclude_unset=True))
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
        raise HTTPException(status_code=403, detail="Hanya mediator yang dapat melihat metrik")

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
    session = _get_session(db, session_id)
    _assert_access(user, session)
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
    def _payload_builder_override(res: dict) -> bytes:
        combination = res.get("combination")
        lfi = res.get("lfi")
        validation = res.get("validation") or {}
        issues = validation.get("issues", []) if isinstance(validation, dict) else []
        issue_codes = ",".join(sorted({i.get("code", "") for i in issues if isinstance(i, dict) and i.get("code")}))
        return (
            f"mediator:{mediator.email};session:{session_id};override:true;"
            f"reason:{request.reason or '-'};issues:{issue_codes or '-'};"
            f"ACCE:{getattr(combination,'ACCE_raw',None)};AERO:{getattr(lfi,'LFI_score',None)}"
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
