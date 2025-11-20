from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.repositories import SessionRepository
from app.services.security import get_current_user
from app.models.klsi.user import User

router = APIRouter(prefix="/assessments", tags=["assessments"])

class AssessmentResults(BaseModel):
    ac_score: int
    ce_score: int
    ae_score: int
    ro_score: int
    acce_score: int
    aero_score: int
    learning_style: str
    lfi_score: Optional[float] = None

class AssessmentSessionResponse(BaseModel):
    id: str
    date: str
    status: str = "completed"
    results: AssessmentResults

@router.get("/latest", response_model=Optional[AssessmentSessionResponse])
def get_latest_assessment(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None)
):
    """
    Get the latest completed assessment session for the current user.
    
    This endpoint is strictly scoped to the authenticated user. It retrieves the most
    recent session with status 'completed' and maps the internal ORM model to a
    frontend-friendly DTO.
    
    Returns:
        AssessmentSessionResponse: The latest completed session with results.
        None: If the user has no completed sessions (returns 200 OK with null body).
    
    Raises:
        HTTPException(401): If the user is not authenticated.
    """
    current_user = get_current_user(authorization, db)
    
    repo = SessionRepository(db)
    session = repo.get_latest_completed_for_user(current_user.id)
    
    if not session:
        return None
        
    # Map ORM to Pydantic
    # Ensure we have the necessary score components
    if not session.scale_score or not session.combination_score:
        return None

    learning_style_name = "Unknown"
    if session.learning_style and session.learning_style.style_type:
        learning_style_name = session.learning_style.style_type.style_name

    lfi_score = None
    if session.lfi_index:
        lfi_score = session.lfi_index.LFI_score

    results = AssessmentResults(
        ac_score=session.scale_score.AC_raw,
        ce_score=session.scale_score.CE_raw,
        ae_score=session.scale_score.AE_raw,
        ro_score=session.scale_score.RO_raw,
        acce_score=session.combination_score.ACCE_raw,
        aero_score=session.combination_score.AERO_raw,
        learning_style=learning_style_name,
        lfi_score=lfi_score
    )
    
    # Use end_time for the date, fallback to start_time
    date_val = session.end_time if session.end_time else session.start_time
    
    return AssessmentSessionResponse(
        id=str(session.id),
        date=date_val.isoformat(),
        status="completed",
        results=results
    )
