from fastapi import APIRouter, Depends, Header, HTTPException
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.models.klsi import AssessmentSession, User
from app.services.report import build_report

router = APIRouter(prefix="/reports", tags=["reports"])


def _get_current_user(authorization: str | None, db: Session) -> User | None:
    """Extract current user from JWT token if present."""
    if not authorization or not authorization.lower().startswith('bearer '):
        return None
    token = authorization.split()[1]
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None
    uid_raw = payload.get('sub')
    if uid_raw is None:
        return None
    try:
        uid = int(uid_raw)
    except ValueError:
        return None
    user = db.query(User).filter(User.id == uid).first()
    return user


@router.get("/{session_id}")
def get_report(
    session_id: int,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None)
):
    # Get current viewer
    viewer = _get_current_user(authorization, db)
    
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
        raise HTTPException(status_code=404, detail=str(e))
    return data
