from datetime import datetime, timezone
from hashlib import sha256

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.engine.runtime import runtime
from app.models.klsi import (
    AssessmentSession,
    AuditLog,
    LFIContextScore,
    User,
)
from app.services.security import get_current_user
from app.services.validation import check_session_complete

router = APIRouter(prefix="/sessions", tags=["sessions"])

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

@router.post("/{session_id}/submit_item", response_model=dict)
def submit_item(session_id: int, item_id: int, ranks: dict, db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
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

@router.post("/{session_id}/submit_context", response_model=dict)
def submit_context(session_id: int, context_name: str, CE: int, RO: int, AC: int, AE: int, db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
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
    }
    runtime.submit_payload(db, session_id, payload)
    return {"ok": True}

@router.post("/{session_id}/finalize", response_model=dict)
def finalize(session_id: int, db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
    user = get_current_user(authorization, db)
    sess = db.query(AssessmentSession).filter(AssessmentSession.id==session_id).first()
    if not sess or sess.user_id != user.id:
        raise HTTPException(status_code=403, detail="Akses sesi ditolak")
    result = runtime.finalize(db, session_id)
    combination = result.get("combination")
    lfi = result.get("lfi")
    style = result.get("style")

    percentiles = result.get("percentiles")
    per_scale_provenance = None
    if percentiles is not None:
        per_scale_provenance = getattr(percentiles, "norm_provenance", None)

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

    return {"ok": True, "result": {
        "ACCE": combination.ACCE_raw if combination else None,
        "AERO": combination.AERO_raw if combination else None,
        "style_primary_id": style.primary_style_type_id if style else None,
        "LFI": lfi.LFI_score if lfi else None,
        "delta": result.get("delta"),
        "percentile_sources": per_scale_provenance,
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
    validation_core = check_session_complete(db, session_id)
    # Tambah info konteks LFI (target 8)
    ctx_count = db.query(LFIContextScore).filter(LFIContextScore.session_id == session_id).count()
    validation_core["lfi_contexts_recorded"] = ctx_count
    validation_core["lfi_contexts_complete"] = (ctx_count == 8)
    validation_core["all_ready"] = validation_core.get("ready_to_complete") and validation_core["lfi_contexts_complete"]
    return validation_core
