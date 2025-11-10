from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.klsi import AssessmentSession, User
from app.services.report import build_report
from app.services.security import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


def _try_get_current_user(authorization: str | None, db: Session) -> User | None:
    """Attempt to resolve current user; return None on auth errors."""
    if not authorization:
        return None
    try:
        return get_current_user(authorization, db)
    except HTTPException as exc:
        if exc.status_code == 401:
            return None
        raise


@router.get("/{session_id}")
def get_report(
    session_id: int,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None)
):
    # Get current viewer
    viewer = _try_get_current_user(authorization, db)
    
    # Check if session exists
    session = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session tidak ditemukan")
    
    # Determine viewer role for analytics access control
    viewer_role = None
    if viewer:
        # Only provide enhanced analytics if viewer is a MEDIATOR viewing student data
        if viewer.role == "MEDIATOR":
            viewer_role = "MEDIATOR"
        # Students can only see their own basic reports
        elif viewer.id != session.user_id:
            raise HTTPException(status_code=403, detail="Akses ditolak")
    
    try:
        data = build_report(db, session_id, viewer_role=viewer_role)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None
    return data
