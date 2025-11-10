from datetime import datetime, timezone
from hashlib import sha256

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.klsi import (
    AssessmentItem,
    AssessmentSession,
    AuditLog,
    Instrument,
    ItemChoice,
    LFIContextScore,
    SessionStatus,
    User,
    UserResponse,
)
from app.services.scoring import CONTEXT_NAMES, finalize_session
from app.services.security import get_current_user
from app.services.validation import check_session_complete

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.post("/start", response_model=dict)
def start_session(db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
    user = get_current_user(authorization, db)
    instrument = (
        db.query(Instrument)
        .filter(Instrument.code == "KLSI", Instrument.version == "4.0")
        .first()
    )
    s = AssessmentSession(
        user_id=user.id,
        status=SessionStatus.started,
        assessment_id=instrument.code if instrument else "KLSI",
        assessment_version=instrument.version if instrument else "4.0",
        instrument_id=instrument.id if instrument else None,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return {"session_id": s.id}

@router.get("/{session_id}/items", response_model=list)
def get_items(session_id: int, db: Session = Depends(get_db)):
    # Return all items (20): 12 learning style + 8 LFI
    items = db.query(AssessmentItem).order_by(AssessmentItem.item_number.asc()).all()
    return [{"id": i.id, "number": i.item_number, "type": i.item_type.value, "stem": i.item_stem} for i in items]

@router.post("/{session_id}/submit_item", response_model=dict)
def submit_item(session_id: int, item_id: int, ranks: dict, db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
    user = get_current_user(authorization, db)
    sess = db.query(AssessmentSession).filter(AssessmentSession.id==session_id).first()
    if not sess or sess.user_id != user.id:
        raise HTTPException(status_code=403, detail="Akses sesi ditolak")
    # ranks: {choice_id: rank}
    if len(ranks.values()) != 4 or set(ranks.values()) != {1,2,3,4}:
        raise HTTPException(status_code=400, detail="Exactly one of each rank 1,2,3,4 required")
    # validate all choice_ids belong to the item
    valid_choices = {c.id for c in db.query(ItemChoice).filter(ItemChoice.item_id==item_id).all()}
    if set(map(int, ranks.keys())) != valid_choices:
        raise HTTPException(status_code=400, detail="Submitted choices mismatch item choices")
    # idempotent replace: remove existing responses for this session+item, then insert
    db.query(UserResponse).filter(
        UserResponse.session_id == session_id,
        UserResponse.item_id == item_id,
    ).delete(synchronize_session=False)
    for cid, rank in ranks.items():
        db.add(UserResponse(session_id=session_id, item_id=item_id, choice_id=int(cid), rank_value=int(rank)))
    db.commit()
    return {"ok": True}

@router.post("/{session_id}/submit_context", response_model=dict)
def submit_context(session_id: int, context_name: str, CE: int, RO: int, AC: int, AE: int, db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
    user = get_current_user(authorization, db)
    sess = db.query(AssessmentSession).filter(AssessmentSession.id==session_id).first()
    if not sess or sess.user_id != user.id:
        raise HTTPException(status_code=403, detail="Akses sesi ditolak")
    # store LFI context ranks; must be 1..4 all distinct
    vals = [CE,RO,AC,AE]
    if set(vals) != {1,2,3,4}:
        raise HTTPException(status_code=400, detail="Context ranks must be unique 1..4")
    # Validate context name against allowed list
    if context_name not in CONTEXT_NAMES:
        raise HTTPException(status_code=400, detail="Context name tidak dikenal")
    # Idempotent upsert: replace any existing row for this session+context
    db.query(LFIContextScore).filter(
        LFIContextScore.session_id == session_id,
        LFIContextScore.context_name == context_name,
    ).delete(synchronize_session=False)
    db.add(LFIContextScore(session_id=session_id, context_name=context_name, CE_rank=CE, RO_rank=RO, AC_rank=AC, AE_rank=AE))
    db.commit()
    return {"ok": True}

@router.post("/{session_id}/finalize", response_model=dict)
def finalize(session_id: int, db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
    user = get_current_user(authorization, db)
    sess = db.query(AssessmentSession).filter(AssessmentSession.id==session_id).first()
    if not sess or sess.user_id != user.id:
        raise HTTPException(status_code=403, detail="Akses sesi ditolak")
    if sess.status == SessionStatus.completed:
        raise HTTPException(status_code=409, detail="Sesi sudah selesai")
    result = finalize_session(db, session_id)
    if not result.get("ok"):
        db.rollback()
        raise HTTPException(status_code=400, detail={"issues": result.get("issues"), "diagnostics": result.get("diagnostics")})
    sess.status = SessionStatus.completed
    sess.end_time = datetime.now(timezone.utc)
    # user-level audit log
    payload = f"user:{user.email};session:{session_id};ACCE:{result['combination'].ACCE_raw};AERO:{result['combination'].AERO_raw};LFI:{result['lfi'].LFI_score}".encode('utf-8')
    db.add(AuditLog(actor=user.email, action='FINALIZE_SESSION_USER', payload_hash=sha256(payload).hexdigest()))
    db.commit()
    return {"ok": True, "result": {
        "ACCE": result["combination"].ACCE_raw,
        "AERO": result["combination"].AERO_raw,
        "style_primary_id": result["style"].primary_style_type_id,
        "LFI": result["lfi"].LFI_score,
        "delta": result.get("delta"),
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
